const UserModel = require('./usersModel');
const Utils = require('../../helper/utils');
const web3Helper = require('../../helper/web3Helper');
const lotteryModel = require('../lottery/lotteryModel');
const SnapshotModel = require('../snapshot/snapshotModel');
const SyncHelper = require('../sync/syncHelper');
const PoolsModel = require('../pools/poolsModel');
const genrateSpreadSheet = require('../../helper/genrateSpreadsheet');
const asyncRedis = require('async-redis');
const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const crypto = require('crypto');
const config = require('../../config/config.json');
const fs = require('fs');
const { values } = require('lodash');
const client = asyncRedis.createClient();

const UserCtr = {};

UserCtr.list = async (req, res) => {
  try {
    const page = +req.query.page || 1;

    const query = { isActive: true };

    if (req.query.tier) {
      query.tier = req.query.tier;
    }

    if (req.query.kycStatus) {
      query.kycStatus = req.query.kycStatus.toLowerCase().trim();
    }

    if (req.query.address) {
      query.walletAddress = req.query.address.toLowerCase().trim();
    }

    if (req.query.email) {
      query.email = req.query.email.trim();
    }

    const totalCount = await UserModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const list = await UserModel.find(query, {
      balObj: 0,
      createdAt: 0,
      updatedAt: 0,
    })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: 'SUCCESS',
      status: true,
      data: list,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog(`Error in lsiting kyc users ${err}`);
    return res.status(500).json({
      message: 'DB_ERROR',
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

UserCtr.genrateLotteryNumbers = async (req, res) => {
  try {
    const tier = req.body.tier ? req.body.tier.toLowerCase().trim() : null;
    const requestNo = req.body.requestNo;

    const fetchRecords = await SnapshotModel.findOne({
      _id: req.body.snapshotId,
    });

    if (
      fetchRecords &&
      fetchRecords.snapshotId &&
      fetchRecords.isSnapshotDone
    ) {
      return res.status(400).json({
        status: false,
        message: 'Lottery Already genrated',
      });
    }

    if (fetchRecords && +req.body.num > fetchRecords.totalUsers) {
      return res.status(400).json({
        status: false,
        message: 'Number cant excedd no of records',
      });
    }

    if (fetchRecords && fetchRecords.users.length) {
      res.status(200).json({
        status: true,
        message: 'Request received ',
      });

      const recordsLength = fetchRecords.totalUsers;
      let num = req.body.num;
      console.log('num is:', num);
      let looteryNumbers = [];

      // recursive loop
      const itreate = async (no) => {
        console.log('Number is:', num);

        if (num > 1 && num <= 100) {
          num = num + 5;
        } else if (num > 100 && num <= 1000) {
          num = Math.ceil(+num + +num * 0.1);
        } else {
          num = Math.ceil(+num + +num * 0.15);
        }

        const getRandomNumber = await web3Helper.getRandomNumber(
          requestNo,
          num,
          recordsLength
        );

        // console.log('sorted arry ', getRandomNumber.length);
        const uniqueArry = getRandomNumber.filter(function (elem, pos) {
          return getRandomNumber.indexOf(elem) == pos;
        });
        if (uniqueArry.length < req.body.num) {
          num = Math.ceil(num + num * 0.1);
          itreate(num);
        } else {
          looteryNumbers = uniqueArry;
          const lotteryUsers = [];

          // console.log('lottery numbers is:', looteryNumbers.length);
          // find the records of pertilcar array
          for (let i = 0; i < req.body.num; i++) {
            let index = +looteryNumbers[i];
            const userRecords = fetchRecords.users[index];

            lotteryUsers.push({
              name: userRecords.name,
              email: userRecords.email,
              walletAddress: userRecords.walletAddress,
              tier: userRecords.tier,
            });
          }

          const csv = new ObjectsToCsv(lotteryUsers);
          const fileName = `${+new Date()}_${req.body.requestNo}`;
          await csv.toDisk(`./lottery/${fileName}.csv`);

          Utils.sendSmapshotEmail(
            `./lottery/${fileName}.csv`,
            fileName,
            `Result of lottery genrated on  ${Math.floor(
              Date.now() / 1000
            )} for ${fetchRecords.tier}  `,
            `Result of  lottery  genrated  on ${Math.floor(
              Date.now() / 1000
            )} for ${fetchRecords.tier} and  snapshot Id ${
              fetchRecords._id
            } with following file hash ${fetchRecords.fileHash}`
          );
          let userIds = [];

          // fetch records
          for (let j = 0; j < fetchRecords.users.length; j++) {
            userIds.push({
              // _id: fetchRecords.[j]._id,
              walletAddress: fetchRecords.users[j].walletAddress,
            });
          }

          const addNewLottery = new lotteryModel({
            requestNo: req.body.requestNo,
            walletAddress: JSON.stringify(userIds),
            lotteryNumbers: looteryNumbers,
            lotteryUsers: req.body.num,
            totalRecords: fetchRecords.length,
            snapshotId: req.body.snapshotId,
            noOfRecordsAdded: num,
          });

          await addNewLottery.save();

          fetchRecords.snapshotId = req.body.requestNo;
          fetchRecords.isSnapshotDone = true;

          await fetchRecords.save();
        }
      };
      itreate(req.body.num);
    }
  } catch (err) {
    console.log('err is:', err);
    Utils.echoLog(`error in genrateLotteryNumbers ${err}`);
  }
};

UserCtr.addCsv = async (req, res) => {
  try {
    console.log('add csv called');
    const getUsers = await UserModel.find({
      isActive: true,
      tier: req.query.tier.toLowerCase().trim(),
    });
    const userList = [];
    for (let i = 0; i < getUsers.length; i++) {
      userList.push({
        name: getUsers[i].name,
        walletAddress: getUsers[i].walletAddress,
        email: getUsers[i].email,
        tier: getUsers[i].tier,
        totalbalance: getUsers[i].totalbalance,
      });
    }

    // genate cs v and hash
    const csv = new ObjectsToCsv(userList);
    const fileName = `${+new Date()}`;
    await csv.toDisk(`./lottery/${fileName}.csv`);

    // gnearte file hash
    const fileBuffer = fs.readFileSync(`./lottery/${fileName}.csv`);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');

    // add this record to snapshot model

    const addNewSnapshotRecord = new SnapshotModel({
      users: userList,
      tier: req.query.tier.toLowerCase().trim(),
      totalUsers: userList.length,
      fileHash: hex,
    });

    const save = await addNewSnapshotRecord.save();

    if (req.query.sendEmail === 'true') {
      Utils.sendSmapshotEmail(
        `./lottery/${fileName}.csv`,
        save._id,
        `snapshot for ${req.query.tier} taken at ${+new Date()} `,
        `snapshot for ${req.query.tier} with file name ${save._id} with following file Hash ${hex}`
      );
    }

    res.status(200).json({
      status: true,
      message: 'Request received ',
    });
  } catch (err) {
    console.log('error', err);
    res.status(500).json({
      status: false,
      message: 'Something went wrong ',
    });
  }
};

UserCtr.getGenratedSnapshotData = async (req, res) => {
  try {
    const getSnapshotDetails = await SnapshotModel.find({}, { users: 0 }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: true,
      message: 'Snapshot genrated',
      data: {
        getSnapshotDetails,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: true,
      message: 'Something went wrong ',
      err: `${err.message}?${err.message}:null`,
    });
  }
};

UserCtr.getUsersStakedBalance = async (req, res) => {
  try {
    console.log('getUsersStakedBalance called');

    const getLatestBlockNoUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=CWZ1A15GW1ANBXEKUUE32Z2V2F4U1Q6TVA`;
    const getLatestBlock = await axios.get(getLatestBlockNoUrl);
    const latestBlock = parseInt(getLatestBlock.data.result, 16);

    // const getFarmingArray = await await SyncHelper.getFarmingBalance(
    //   0,
    //   latestBlock
    // );
    // const getBakeryArray = await SyncHelper.getBakeryFarmBalance(
    //   0,
    //   latestBlock
    // );
    // const getTosdisArray = await SyncHelper.getToshFarmBalance(0, latestBlock);

    const getLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LIQUIDITY_ADDRESS
    );

    res.status(200).json({
      message: 'Your request received',
    });

    const getPools = await PoolsModel.find({});
    const getUsers = await UserModel.find({
      isActive: true,
      kycStatus: 'approved',
    });
    const getTimeStamp = Math.round(new Date().getTime() / 1000);
    // console.log('get users is:', getUsers);
    if (getUsers && getUsers.length) {
      const users = {
        tier0: [],
        tier1: [],
        tier2: [],
        tier3: [],
        tier4: [],
        tier5: [],
        tier6: [],
        tier7: [],
        tier8: [],
        tier9: [],
      };

      for (let i = 0; i < getUsers.length; i++) {
        console.log(`${i} of ${getUsers.length}`);
        const getBalance = await getUserBalance(
          getUsers[i].walletAddress,
          getPools,
          getTimeStamp,
          latestBlock,
          getLiquidityLocked.totalSupply,
          getLiquidityLocked.totalBalance
        );

        const userBal = JSON.stringify(getBalance);

        getBalance.walletAddress = getUsers[i].walletAddress;

        getBalance.tier = await SyncHelper.getUserTier(+getBalance.eTokens);

        console.log('getBalance.tier', getBalance.tier);

        console.log('user bal ', userBal);

        const updateUser = await UserModel.updateOne(
          { _id: getUsers[i]._id },
          {
            balObj: JSON.parse(userBal),
            tier: getBalance.tier,
            timestamp: getTimeStamp,
          }
        );

        users[getBalance.tier].push(getBalance);
        // users.push(getBalance);
      }

      await client.flushall();
      genrateSpreadSheet.genrateExcel(users);
      console.log('User staked balances fetched');
    }
  } catch (err) {
    console.log('err is:', err);
  }
};

async function getUserBalance(
  walletAddress,
  pool,
  timestamp,
  endBlock,
  totalSupply,
  totalBalance
) {
  return new Promise(async (resolve, reject) => {
    try {
      let pools = [];

      if (pool.length) {
        for (let i = 0; i < pool.length; i++) {
          if (pool[i].contractType !== 'farming') {
            const fetchBalance = await web3Helper.getUserStakedBalance(
              walletAddress,
              pool[i].contractAddress
            );

            const value = Utils.convertToEther(fetchBalance['0']);
            const endDate = fetchBalance['2'];
            // check if token expired
            if (endDate < timestamp) {
              pools.push({
                name: pool[i].poolName,
                staked: 0,
                loyalityPoints: 0,
              });
            } else {
              const points = +value + (value * pool[i].loyalityPoints) / 100;
              pools.push({
                name: pool[i].poolName,
                staked: +Utils.toTruncFixed(value, 3),
                loyalityPoints: points,
              });
            }
          } else {
            if (pool[i].endDate > 0 && pool[i].endDate >= timestamp) {
              const getLiquidityData = await UserCtr.checkRedis(
                pool[i].lpTokenAddress
              );

              const getLockedTokens = await web3Helper.getUserFarmedBalance(
                walletAddress,
                pool[i].contractAddress
              );

              const totalSupplyCount =
                getLockedTokens / getLiquidityData.totalSupply;

              const transaction =
                totalSupplyCount * getLiquidityData.totalBalance;

              const points =
                +transaction + (transaction * pool[i].loyalityPoints) / 100;

              pools.push({
                name: pool[i].poolName,
                staked: +Utils.toTruncFixed(transaction, 3),
                loyalityPoints: points,
              });
            }
          }
        }
      }

      // get farming balance
      // const getFarmingBalance = await web3Helper.getTosdisFarmingBal(
      //   walletAddress,
      //   process.env.FARMING_ADDRESS
      // );

      // const totalSupplyCount = +getFarmingBalance / totalSupply;

      // const farmingTransaction = +totalSupplyCount * totalBalance;

      // pools.push({
      //   name: 'farming',
      //   staked: farmingTransaction,
      //   loyalityPoints:
      //     +farmingTransaction + (+farmingTransaction * config.farming) / 100,
      // });

      // // get bakery balance
      // const bakeryBalance = await web3Helper.getTosdisFarmingBal(
      //   walletAddress,
      //   process.env.FARMING_BAKERY
      // );

      // const bakeryCount = +bakeryBalance / totalSupply;

      // const bakeryTransaction = +bakeryCount * totalBalance;

      // pools.push({
      //   name: 'bakery',
      //   staked: bakeryTransaction,
      //   loyalityPoints:
      //     +bakeryTransaction + (+bakeryTransaction * config.bakery) / 100,
      // });

      // // get tosdis balance
      // const tosdisBalance = await web3Helper.getTosdisStakingBal(walletAddress);

      // pools.push({
      //   name: 'tosdis-staking',
      //   staked: tosdisBalance,
      //   loyalityPoints: +tosdisBalance + (+tosdisBalance * config.tosdis) / 100,
      // });

      // // get sfund bal
      // const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';
      // const getSfund = await getSfundBalance(address, walletAddress, endBlock);
      // pools.push({
      //   name: 'sfund',
      //   staked: getSfund,
      //   loyalityPoints: +getSfund + (+getSfund * config.sfund) / 100,
      // });

      // // get liquity balance
      // const getLiquidity = await getLiquidityBalance(walletAddress, endBlock);
      // pools.push({
      //   name: 'liquidity',
      //   staked: getLiquidity,
      //   loyalityPoints:
      //     +getLiquidity + (+getLiquidity * config.liquidity) / 100,
      // });

      // const getFarmingFromPanCakeSwap = await UserCtr.getPancakeSwapInvestment(
      //   walletAddress,
      //   totalSupply,
      //   totalBalance
      // );

      // pools.push({
      //   name: 'pancakeSwapFarming',
      //   staked: getFarmingFromPanCakeSwap,
      //   loyalityPoints:
      //     +getFarmingFromPanCakeSwap +
      //     (+getFarmingFromPanCakeSwap * config.farmingPancakeSwap) / 100,
      // });

      const getFarmingBalance = web3Helper.getTosdisFarmingBal(
        walletAddress,
        process.env.FARMING_ADDRESS
      );

      // get bakery balance
      const bakeryBalance = web3Helper.getTosdisFarmingBal(
        walletAddress,
        process.env.FARMING_BAKERY
      );

      // get tosdis balance
      const tosdisBalance = web3Helper.getTosdisStakingBal(walletAddress);

      // get sfund bal
      // const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';
      // const getSfund = getSfundBalance(address, walletAddress, endBlock);

      const getSfund = web3Helper.sfundBalance(walletAddress);

      // get liquity balance
      const getLiquidity = getLiquidityBalance(walletAddress, endBlock);

      const getFarmingFromPanCakeSwap = UserCtr.getPancakeSwapInvestment(
        walletAddress,
        totalSupply,
        totalBalance
      );

      await Promise.all([
        getFarmingBalance,
        bakeryBalance,
        tosdisBalance,
        getSfund,
        getLiquidity,
        getFarmingFromPanCakeSwap,
      ]).then((result) => {
        if (result.length) {
          for (let k = 0; k < result.length; k++) {
            if (k === 0) {
              const totalSupplyCount = +result[k] / totalSupply;

              const farmingTransaction = +totalSupplyCount * totalBalance;

              pools.push({
                name: 'farming',
                staked: +Utils.toTruncFixed(farmingTransaction, 3),
                loyalityPoints:
                  +farmingTransaction +
                  (+farmingTransaction * config.farming) / 100,
              });
            } else if (k === 1) {
              const bakeryCount = +result[k] / totalSupply;

              const bakeryTransaction = +bakeryCount * totalBalance;

              pools.push({
                name: 'bakery',
                staked: +Utils.toTruncFixed(bakeryTransaction, 3),
                loyalityPoints:
                  +bakeryTransaction +
                  (+bakeryTransaction * config.bakery) / 100,
              });
            } else if (k === 2) {
              pools.push({
                name: 'tosdis-staking',
                staked: +Utils.toTruncFixed(result[k], 3),
                loyalityPoints: +result[k] + (+result[k] * config.tosdis) / 100,
              });
            } else if (k === 3) {
              pools.push({
                name: 'sfund',
                staked: +Utils.toTruncFixed(result[k], 3),
                loyalityPoints: +result[k] + (+result[k] * config.sfund) / 100,
              });
            } else if (k === 4) {
              pools.push({
                name: 'liquidity',
                staked: +Utils.toTruncFixed(result[k], 3),
                loyalityPoints:
                  +result[k] + (+result[k] * config.liquidity) / 100,
              });
            } else if (k === 5) {
              pools.push({
                name: 'pancakeSwapFarming',
                staked: +Utils.toTruncFixed(result[k], 3),
                loyalityPoints:
                  +result[k] + (+result[k] * config.farmingPancakeSwap) / 100,
              });
            } else {
              console.log('IN ELSE');
            }
          }
        }
      });
      let points = 0;
      const userStaked = {};

      for (let j = 0; j < pools.length; j++) {
        userStaked[pools[j].name] = pools[j].staked;
        points += pools[j].loyalityPoints;
      }

      userStaked.eTokens = Utils.toTruncFixed(points, 3);

      resolve(userStaked);
    } catch (err) {
      console.log('err is:', err);
      reject(false);
    }
  });
}

async function findData(data, userAddress) {
  const findIndex = data.findIndex(
    (user) =>
      user.address.toLowerCase().trim() === userAddress.toLowerCase().trim()
  );

  if (findIndex >= 0) {
    return data[findIndex].balance;
  } else {
    return 0;
  }
}

// get sfund balance
async function getSfundBalance(address, userAddress, endBlock) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    var config = {
      method: 'get',
      url: `https://api.bscscan.com/api?module=account&action=tokenbalancehistory&contractaddress=${address}&address=${userAddress}&blockno=${endBlock}&apikey=${process.env.BSC_API_KEY}`,
      headers: {},
    };

    const getSfundBal = await axios(config);

    if (getSfundBal.status === 200) {
      const data = getSfundBal.data;

      let seedifyBalance = (+data.result / Math.pow(10, 18)).toFixed(2);

      return +seedifyBalance > 0 ? +seedifyBalance : 0;
    }
  } catch (err) {
    Utils.echoLog(`error in getSfundBalance ${err}`);
    return 0;
  }
}

// get liquidy bal
async function getLiquidityBalance(userAddress, endBlock) {
  const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';

  const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${address}&apikey=${process.env.BSC_API_KEY}`;
  const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${address}&tag=latest&apikey=${process.env.BSC_API_KEY}`;

  const getTotalSupply = await axios.get(getTotalSupplyUrl);
  const getTokenBalance = await axios.get(tokenBalanceUrl);

  const getSfundBal = await getSfundBalance(address, userAddress, endBlock);

  const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
  const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

  if (getSfundBal) {
    const transactionCount = +getSfundBal / tokenSupply;
    const total = transactionCount * tokenBalance;

    return +total > 0 ? +total : 0;
  } else {
    return 0;
  }
}

UserCtr.fetchLiquidityLocked = async (contractAddress) => {
  try {
    return new Promise(async (resolve, reject) => {
      let getTotalSupplyUrl = '';
      let tokenBalanceUrl = '';
      if (process.env.NODE_ENV === 'development') {
        getTotalSupplyUrl = `https://api-testnet.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${process.env.BSC_API_KEY}`;
        tokenBalanceUrl = `https://api-testnet.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${contractAddress}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      } else {
        getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${process.env.BSC_API_KEY}`;
        tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${contractAddress}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      }

      const getTotalSupply = await axios.get(getTotalSupplyUrl);
      const getTokenBalance = await axios.get(tokenBalanceUrl);

      const totalSupply = +getTotalSupply.data.result / Math.pow(10, 18);
      const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

      const data = {
        totalSupply: totalSupply,
        totalBalance: tokenBalance,
      };
      await client.set(
        `${contractAddress.toLowerCase()}`,
        JSON.stringify(data),
        'EX',
        60 * 10000
      );
      resolve(data);
    });
  } catch (err) {
    return {
      totalSupply: 0,
      totalBalance: 0,
    };
  }
};

UserCtr.checkRedis = async (contractAddress) => {
  console.log('Check resdis called');
  return new Promise(async (resolve, reject) => {
    try {
      const checkRedisAvalaible = await client.get(
        `${contractAddress.toLowerCase()}`
      );

      if (checkRedisAvalaible) {
        resolve(JSON.parse(checkRedisAvalaible));
      } else {
        const getLiquidity = await UserCtr.fetchLiquidityLocked(
          contractAddress
        );
        resolve(getLiquidity);
      }
    } catch (err) {
      reject(err);
    }
  });
};

UserCtr.getPancakeSwapInvestment = (
  walletAddress,
  totalSupply,
  totalBalance
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const getTotalStaked = await web3Helper.getPanCakeSwapFarmBalance(
        walletAddress
      );

      if (getTotalStaked > 0) {
        const totalSupplyCount = getTotalStaked / totalSupply;

        const transaction = totalSupplyCount * totalBalance;

        resolve(transaction);
      } else {
        resolve(0);
      }
    } catch (err) {
      resolve(0);
    }
  });
};

module.exports = UserCtr;
