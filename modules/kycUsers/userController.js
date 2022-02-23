const UserModel = require("./usersModel");
const Utils = require("../../helper/utils");
const web3Helper = require("../../helper/web3Helper");
const lotteryModel = require("../lottery/lotteryModel");
const NetworkWalletModel = require("../networkWallet/networkWalletModel");
const SnapshotModel = require("../snapshot/snapshotModel");
const SyncHelper = require("../sync/syncHelper");
const PoolsModel = require("../pools/poolsModel");
const jwtUtil = require("../../helper/jwtUtils");
const genrateSpreadSheet = require("../../helper/genrateSpreadsheet");
const networkWallet = require("../network/networkModel");
const asyncRedis = require("async-redis");
const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
const csv = require("fast-csv");
const CSV = require("csvtojson");
const crypto = require("crypto");
const config = require("../../config/config.json");
const fs = require("fs");
const Web3 = require("web3");
const client = asyncRedis.createClient();
const Async = require("async");
const xlsx = require("node-xlsx");
const networkModel = require("../network/networkModel");
const logsModel = require("../logs/logsModel");
const projectsModel = require("../projects/projectsModel");
const networkWalletModel = require("../networkWallet/networkWalletModel");

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

    if (req.query.country) {
      query.country = req.query.country.toLowerCase().trim();
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
    })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: "SUCCESS",
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
      message: "DB_ERROR",
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
        message: "Lottery Already genrated",
      });
    }

    if (fetchRecords && +req.body.num > fetchRecords.totalUsers) {
      return res.status(400).json({
        status: false,
        message: "Number cant excedd no of records",
      });
    }

    if (fetchRecords && fetchRecords.users.length) {
      res.status(200).json({
        status: true,
        message: "Request received ",
      });

      const recordsLength = fetchRecords.totalUsers;
      let num = req.body.num;
      console.log("num is:", num);
      let looteryNumbers = [];

      // recursive loop
      const itreate = async (no) => {
        console.log("Number is:", num);

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
            `Result of lottery generated on  ${Math.floor(
              Date.now() / 1000
            )} for ${fetchRecords.tier}  `,
            `Result of  lottery generated  on ${Math.floor(
              Date.now() / 1000
            )} for ${fetchRecords.tier} and  snapshot Id ${
              fetchRecords._id
            } with following file hash ${fetchRecords.fileHash}`,
            "csv"
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
          if (addNewLottery && typeof addNewLottery.log === "function") {
            console.log("req.userData._id :>> " + req.userData._id);
            const data = {
              action: "genrateLotteryNumbers",
              category: "user/genrateRandom",
              createdBy: req.userData._id,
              message: `${
                req.userData.username
                  ? req.userData.username
                  : req.userData.email
              } created new lottery`,
            };
            addNewLottery.log(data);
          }
          await addNewLottery.save();

          fetchRecords.snapshotId = req.body.requestNo;
          fetchRecords.isSnapshotDone = true;

          await fetchRecords.save();
        }
      };
      itreate(req.body.num);
    }
  } catch (err) {
    console.log("err is:", err);
    Utils.echoLog(`error in genrateLotteryNumbers ${err}`);
  }
};

UserCtr.addCsv = async (req, res) => {
  try {
    console.log("add csv called");

    let query = {
      isActive: true,
      kycStatus: "approved",
      tier: req.query.tier.toLowerCase().trim(),
    };

    if (req.query.country) {
      query.country = { $ne: req.query.country.toLowerCase().trim() };
    }
    if (req.query.projectId) {
      const project = await projectsModel.findOne({ _id: req.query.projectId });
      query._id = { $in: project.subscribedUsers };
    }
    const getUsers = await UserModel.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$walletAddress",
          doc: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },
    ]);

    const userList = [];
    for (let i = 0; i < getUsers.length; i++) {
      userList.push({
        name: getUsers[i].name,
        walletAddress: getUsers[i].walletAddress,
        email: getUsers[i].email,
        tier: getUsers[i].tier,
      });
    }

    // genate cs v and hash
    const csv = new ObjectsToCsv(userList);
    const fileName = `${+new Date()}`;
    await csv.toDisk(`./lottery/${fileName}.csv`);

    // gnearte file hash
    const fileBuffer = fs.readFileSync(`./lottery/${fileName}.csv`);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    const hex = hashSum.digest("hex");

    // add this record to snapshot model
    const addNewSnapshotRecord = new SnapshotModel({
      users: userList,
      tier: req.query.tier.toLowerCase().trim(),
      totalUsers: userList.length,
      fileHash: hex,
    });
    if (
      addNewSnapshotRecord &&
      typeof addNewSnapshotRecord.log === "function"
    ) {
      console.log("req.userData._id :>> " + req.userData._id);
      const data = {
        action: "generate CSV After snapshot",
        category: "user/genrateCsv",
        createdBy: req.userData._id,
        message: `${
          req.userData.username ? req.userData.username : req.userData.email
        } created new snapshot`,
      };
      addNewSnapshotRecord.log(data);
    }
    const save = await addNewSnapshotRecord.save();

    if (req.query.sendEmail === "true") {
      Utils.sendSmapshotEmail(
        `./lottery/${fileName}.csv`,
        save._id,
        `snapshot for ${req.query.tier} taken at ${+new Date()} `,
        `snapshot for ${req.query.tier} with file name ${save._id} with following file Hash ${hex}`,
        "csv"
      );
    }

    res.status(200).json({
      status: true,
      message: "Request received ",
    });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({
      status: false,
      message: "Something went wrong ",
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
      message: "Snapshot genrated",
      data: {
        getSnapshotDetails,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: true,
      message: "Something went wrong ",
      err: `${err.message}?${err.message}:null`,
    });
  }
};

UserCtr.getUsersStakedBalance = async (req, res) => {
  try {
    const igoName = req.query.name ? req.query.name : "IGO";
    const data = {
      isSnapshotStarted: true,
      startedAt: +new Date(),
    };

    await client.set("snapshot", JSON.stringify(data));

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

    const log = {
      action: "Snapshot fired",
      category: "user/getUserStake",
      createdBy: req.userData._id,
      message: `Snapshot fired for ${igoName} IGO`,
    };
    const newLog = new logsModel(log);
    await newLog.save();
    const users = await UserModel.find({}, { walletAddress: 1, kycStatus: 1 })
      .lean()
      .sort({ createdAt: -1 });
    const walletAddresses = users.map(({ _id, ...rest }) => ({ ...rest }));
    const csv = new ObjectsToCsv(walletAddresses);
    const fileName = `${+new Date()}_${igoName}`;
    await csv.toDisk(`./csv/${fileName}.csv`);
    Utils.sendSmapshotEmail(
      `./csv/${fileName}.csv`,
      fileName,
      `Snapshot fired for ${igoName} at ${new Date(data.startedAt)}`,
      `Snapshot fired for ${igoName}`,
      "csv"
    );

    const getLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LIQUIDITY_ADDRESS
    );

    const getBakeryLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LP_BAKERY
    );

    const getApeTokenLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LP_APE_ADDRESS
    );

    res.status(200).json({
      message: "Your request received",
    });

    const getPools = await PoolsModel.find({});
    // const getUsers = await UserModel.find({
    //   isActive: true,
    //   kycStatus: 'approved',
    // });

    let query = { isActive: true, kycStatus: "approved" };

    if (req.query.country) {
      query.country = { $ne: req.query.country.toLowerCase().trim() };
    }

    const getUsers = await UserModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$walletAddress",
          doc: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },
    ]);

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

      const queue = Async.queue(async (task, completed) => {
        console.log("Currently Busy Processing Task " + task.address);

        const getBalance = await getUserBalance(
          task.address,
          getPools,
          getTimeStamp,
          latestBlock,
          getLiquidityLocked.totalSupply,
          getLiquidityLocked.totalBalance,
          getApeTokenLiquidityLocked,
          getBakeryLiquidityLocked,
          getLiquidityLocked
        );
        const userBal = JSON.stringify(getBalance);

        getBalance.walletAddress = task.address;
        getBalance.tier = await SyncHelper.getUserTier(+getBalance.eTokens);

        console.log("getBalance.tier", getBalance.tier);

        console.log("user bal ", userBal);

        const updateUser = await UserModel.updateOne(
          { _id: task._id },
          {
            balObj: JSON.parse(userBal),
            tier: getBalance.tier,
            timestamp: getTimeStamp,
          }
        );

        users[getBalance.tier].push(getBalance);
        // users.push(getBalance);

        // Simulating a Complex task
        setTimeout(() => {
          // The number of tasks to be processed
          const remaining = queue.length();
          console.log("remaining is:", remaining);
          // completed(null, { remaining });
        }, 2000);
      }, 5);

      for (let i = 0; i < getUsers.length; i++) {
        console.log(`${i} of ${getUsers.length}`);
        // const getBalance = await getUserBalance(
        //   getUsers[i].walletAddress,
        //   getPools,
        //   getTimeStamp,
        //   latestBlock,
        //   getLiquidityLocked.totalSupply,
        //   getLiquidityLocked.totalBalance
        // );

        // const userBal = JSON.stringify(getBalance);

        // getBalance.walletAddress = getUsers[i].walletAddress;

        // getBalance.tier = await SyncHelper.getUserTier(+getBalance.eTokens);

        // console.log('getBalance.tier', getBalance.tier);

        // console.log('user bal ', userBal);

        // const updateUser = await UserModel.updateOne(
        //   { _id: getUsers[i]._id },
        //   {
        //     balObj: JSON.parse(userBal),
        //     tier: getBalance.tier,
        //     timestamp: getTimeStamp,
        //   }
        // );

        // users[getBalance.tier].push(getBalance);
        // // users.push(getBalance);

        queue.push(
          { address: getUsers[i].walletAddress, _id: getUsers[i]._id },
          (error) => {
            if (error) {
              console.log(`An error occurred while processing task ${error}`);
            } else {
              console.log(`Finished processing task . `);
            }
          }
        );
      }

      queue.drain(async () => {
        console.log("Successfully processed all items");
        await client.flushall();
        genrateSpreadSheet.genrateExcel(users, igoName);
        await client.del("snapshot");
        console.log("User staked balances fetched");
      });
    }
  } catch (err) {
    await client.del("snapshot");
    console.log("err is:", err);
  }
};

async function getUserBalance(
  walletAddress,
  pool,
  timestamp,
  endBlock,
  totalSupply,
  totalBalance,
  apeLiquidity,
  bakeryLiquidity,
  panCakeLiquidity
) {
  return new Promise(async (resolve, reject) => {
    try {
      let pools = [];
      let isInvested = false;
      if (pool.length) {
        for (let i = 0; i < pool.length; i++) {
          if (pool[i].contractType !== "farming") {
            const fetchBalance = await web3Helper.getUserStakedBalance(
              walletAddress,
              pool[i].contractAddress
            );

            const value = Utils.convertToEther(fetchBalance["0"]);
            const endDate = fetchBalance["2"];
            // check if time  expired
            // if (endDate < timestamp) {
            //   pools.push({
            //     name: pool[i].poolName,
            //     staked: 0,
            //     loyalityPoints: 0,
            //   });
            // } else {
            const points = +value + (value * pool[i].loyalityPoints) / 100;
            pools.push({
              name: pool[i].poolName,
              staked: +Utils.toTruncFixed(value, 3),
              loyalityPoints: points,
            });

            if (+points > 0 && !isInvested) {
              isInvested = true;
              // }
            }
          } else {
            // if (pool[i].endDate > 0) {
            let getLiquidityData = {};

            if (
              pool[i].lpTokenAddress.toLowerCase() ===
              process.env.LP_BAKERY.toLowerCase()
            ) {
              getLiquidityData = bakeryLiquidity;
            } else {
              getLiquidityData = panCakeLiquidity;
            }

            console.log("getLiquidityData", getLiquidityData);

            const getLockedTokens = await web3Helper.getUserFarmedBalance(
              walletAddress,
              pool[i].contractAddress
            );

            const totalSupplyCount =
              getLockedTokens.farm / getLiquidityData.totalSupply;

            const transaction =
              totalSupplyCount * getLiquidityData.totalBalance;

            const points =
              +transaction + (transaction * pool[i].loyalityPoints) / 100;

            pools.push({
              name: pool[i].poolName,
              staked: +Utils.toTruncFixed(transaction, 3),
              loyalityPoints: points,
              // loyalityPoints: points + getLockedTokens.harvest,
            });

            if (+points > 0 && !isInvested) {
              isInvested = true;
            }
            // }
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

      // const getFarmingBalance = web3Helper.getTosdisFarmingBal(
      //   walletAddress,
      //   process.env.FARMING_ADDRESS
      // );

      // // get bakery balance
      // const bakeryBalance = web3Helper.getTosdisFarmingBal(
      //   walletAddress,
      //   process.env.FARMING_BAKERY
      // );

      // // get tosdis balance
      // const tosdisBalance = web3Helper.getTosdisStakingBal(walletAddress);

      // // get sfund bal
      // // const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';
      // // const getSfund = getSfundBalance(address, walletAddress, endBlock);

      // const getSfund = web3Helper.sfundBalance(walletAddress);

      // // get liquity balance
      // const getLiquidity = getLiquidityBalance(walletAddress, endBlock);

      // // const getFarmingFromPanCakeSwap = UserCtr.getPancakeSwapInvestment(
      // //   walletAddress,
      // //   totalSupply,
      // //   totalBalance
      // // );

      // // ape farming
      // const apeBalance = web3Helper.getApeFarmingBalance(
      //   walletAddress,
      //   process.env.APE_FARM_ADDRESS
      // );

      // // // get previous farmig pool tokens
      // // const getPreviousFarmingBalance = web3Helper.getTosdisFarmingBal(
      // //   walletAddress,
      // //   process.env.PREVIOUS_FARMING_ADDRESS
      // // );

      // // // get previous bakery pool tokens
      // // const getPreviousBakeryBalance = web3Helper.getTosdisFarmingBal(
      // //   walletAddress,
      // //   process.env.PREVIOUS_FARMING_BAKERY
      // // );

      // // get previous staking from tosdis
      // // const getPreviousTosdisBalance =
      // //   web3Helper.getTosdisStakingBalWithContract(
      // //     walletAddress,
      // //     process.env.PREVIOUS_STAKING_TOSDIS
      // //   );

      // await Promise.all([
      //   getFarmingBalance,
      //   bakeryBalance,
      //   tosdisBalance,
      //   getSfund,
      //   getLiquidity,
      //   apeBalance,
      // ]).then((result) => {
      //   if (result.length) {
      //     for (let k = 0; k < result.length; k++) {
      //       if (k === 0) {
      //         const totalSupplyCount = +result[k] / totalSupply;

      //         const farmingTransaction = +totalSupplyCount * totalBalance;

      //         pools.push({
      //           name: 'farming',
      //           staked: +Utils.toTruncFixed(farmingTransaction, 3),
      //           loyalityPoints:
      //             +farmingTransaction +
      //             (+farmingTransaction * config.farming) / 100,
      //         });
      //       } else if (k === 1) {
      //         const bakeryCount = +result[k] / totalSupply;

      //         const bakeryTransaction = +bakeryCount * totalBalance;

      //         pools.push({
      //           name: 'bakery',
      //           staked: +Utils.toTruncFixed(bakeryTransaction, 3),
      //           loyalityPoints:
      //             +bakeryTransaction +
      //             (+bakeryTransaction * config.bakery) / 100,
      //         });
      //       } else if (k === 2) {
      //         pools.push({
      //           name: 'tosdis-staking',
      //           staked: +Utils.toTruncFixed(result[k], 3),
      //           loyalityPoints: +result[k] + (+result[k] * config.tosdis) / 100,
      //         });
      //       } else if (k === 3) {
      //         pools.push({
      //           name: 'sfund',
      //           staked: +Utils.toTruncFixed(result[k], 3),
      //           loyalityPoints: +result[k] + (+result[k] * config.sfund) / 100,
      //         });
      //       } else if (k === 4) {
      //         pools.push({
      //           name: 'liquidity',
      //           staked: +Utils.toTruncFixed(result[k], 3),
      //           loyalityPoints:
      //             +result[k] + (+result[k] * config.liquidity) / 100,
      //         });
      //       } else if (k === 5) {
      //         const totalSupplyCount = +result[k] / apeLiquidity.totalSupply;

      //         const farmingTransaction =
      //           +totalSupplyCount * apeLiquidity.totalBalance;

      //         pools.push({
      //           name: 'ape Farming',
      //           staked: +Utils.toTruncFixed(farmingTransaction, 3),
      //           loyalityPoints:
      //             +farmingTransaction +
      //             (+farmingTransaction * config.ape) / 100,
      //         });
      //       }
      //       //  else if (k === 7) {
      //       //   const totalSupplyCount = +result[k] / totalSupply;

      //       //   const farmingTransaction = +totalSupplyCount * totalBalance;

      //       //   pools.push({
      //       //     name: 'previous-farming',
      //       //     staked: +Utils.toTruncFixed(farmingTransaction, 3),
      //       //     loyalityPoints:
      //       //       +farmingTransaction +
      //       //       (+farmingTransaction * config.farming) / 100,
      //       //   });
      //       // } else if (k === 8) {
      //       //   const bakeryCount = +result[k] / totalSupply;

      //       //   const bakeryTransaction = +bakeryCount * totalBalance;

      //       //   pools.push({
      //       //     name: 'previous-bakery',
      //       //     staked: +Utils.toTruncFixed(bakeryTransaction, 3),
      //       //     loyalityPoints:
      //       //       +bakeryTransaction +
      //       //       (+bakeryTransaction * config.bakery) / 100,
      //       //   });
      //       // } else if (k === 9) {
      //       //   pools.push({
      //       //     name: 'previous-tosdis-staking',
      //       //     staked: +Utils.toTruncFixed(result[k], 3),
      //       //     loyalityPoints: +result[k] + (+result[k] * config.tosdis) / 100,
      //       //   });
      //       // }
      //       else {
      //         console.log('IN ELSE');
      //       }
      //     }
      //   }
      // });
      let points = 0;
      const userStaked = {};

      for (let j = 0; j < pools.length; j++) {
        userStaked[pools[j].name] = pools[j].staked;
        points += pools[j].loyalityPoints;
      }

      console.log("user Staked is:", userStaked);

      userStaked.eTokens = Utils.toTruncFixed(points, 3);
      userStaked.isStaked = isInvested;
      resolve(userStaked);
    } catch (err) {
      console.log("err is:", err);
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
      method: "get",
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
  const address = "0x74fa517715c4ec65ef01d55ad5335f90dce7cc87";

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
      let getTotalSupplyUrl = "";
      let tokenBalanceUrl = "";
      if (process.env.NODE_ENV === "development") {
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

      console.log("getTotalSupply", totalSupply);

      const data = {
        totalSupply: totalSupply,
        totalBalance: tokenBalance,
      };
      await client.set(
        `${contractAddress.toLowerCase()}`,
        JSON.stringify(data),
        "EX",
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

// cron service
UserCtr.getUserBalances = async (req, res) => {
  try {
    console.log("getUsersStakedBalance CRON called");

    const getLatestBlockNoUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=CWZ1A15GW1ANBXEKUUE32Z2V2F4U1Q6TVA`;
    const getLatestBlock = await axios.get(getLatestBlockNoUrl);
    const latestBlock = parseInt(getLatestBlock.data.result, 16);

    const getLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LIQUIDITY_ADDRESS
    );

    const getApeTokenLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LP_APE_ADDRESS
    );

    const getBakeryLiquidityLocked = await UserCtr.fetchLiquidityLocked(
      process.env.LP_BAKERY
    );

    console.log("getApeTokenLiquidityLocked", getApeTokenLiquidityLocked);

    const getPools = await PoolsModel.find({});
    const getUsers = await UserModel.find({
      isActive: true,
    });
    const getTimeStamp = Math.round(new Date().getTime() / 1000);
    // console.log('get users is:', getUsers);
    if (getUsers && getUsers.length) {
      const queue = Async.queue(async (task, completed) => {
        console.log("Currently Busy Processing Task " + task.address);

        const getBalance = await getUserBalance(
          task.address,
          getPools,
          getTimeStamp,
          latestBlock,
          getLiquidityLocked.totalSupply,
          getLiquidityLocked.totalBalance,
          getApeTokenLiquidityLocked,
          getBakeryLiquidityLocked,
          getLiquidityLocked
        );
        const userBal = JSON.stringify(getBalance);
        getBalance.walletAddress = task.address;
        getBalance.tier = await SyncHelper.getUserTier(+getBalance.eTokens);
        const updateUser = await UserModel.updateOne(
          { _id: task._id },
          {
            balObj: JSON.parse(userBal),
            tier: getBalance.tier,
            timestamp: getTimeStamp,
          }
        );

        // Simulating a Complex task
        setTimeout(() => {
          // The number of tasks to be processed
          const remaining = queue.length();
          console.log("remaining is:", remaining);
          // completed(null, { remaining });
        }, 2000);
      }, 3);

      for (let i = 0; i < getUsers.length; i++) {
        console.log(`${i} of ${getUsers.length}`);

        queue.push(
          { address: getUsers[i].walletAddress, _id: getUsers[i]._id },
          (error) => {
            if (error) {
              console.log(`An error occurred while processing task `);
            } else {
              console.log(`Finished processing task . `);
            }
          }
        );
        // const userBal = JSON.stringify(getBalance);
        // getBalance.walletAddress = getUsers[i].walletAddress;
        // getBalance.tier = await SyncHelper.getUserTier(+getBalance.eTokens);
        // const updateUser = await UserModel.updateOne(
        //   { _id: getUsers[i]._id },
        //   {
        //     balObj: JSON.parse(userBal),
        //     tier: getBalance.tier,
        //     timestamp: getTimeStamp,
        //   }
        // );
      }

      queue.drain(() => {
        console.log("Successfully processed all items");
      });

      console.log("User staked balances fetched");
    }
  } catch (err) {
    console.log("err is:", err);
  }
};

// add user network
UserCtr.addUserNetwork = async (req, res) => {
  try {
    const fetchUsers = await UserModel.find({
      walletAddress: req.userDetails.walletAddress.toLowerCase(),
    });

    if (fetchUsers.length) {
      let userId = [];
      for (let i = 0; i < fetchUsers.length; i++) {
        userId.push(fetchUsers[i]._id);
      }

      // create a entry in networkWallet model
      const addWallets = new NetworkWalletModel({
        walletAddress: req.body.walletAddress,
        networkId: req.body.networkId,
        userId: userId,
      });
      await addWallets.save();

      for (let j = 0; j < fetchUsers.length; j++) {
        const fetchUsersDetails = await UserModel.findById(fetchUsers[j]._id);

        const network = fetchUsersDetails.networks;

        network.push(addWallets._id);

        fetchUsersDetails.networks = network;

        await fetchUsersDetails.save();
      }

      return res.status(200).json({
        message: "Network Wallet added sucessfully",
        status: true,
      });
    } else {
      return res.status(200).json({
        message: "No User Found",
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog("error in genrating nonce  ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// Login user

UserCtr.login = async (req, res) => {
  try {
    const { nonce, signature } = req.body;
    const web3 = new Web3(
      new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
    );

    const signer = await web3.eth.accounts.recover(nonce, signature);

    if (signer) {
      const fetchRedisData = await client.get(nonce);

      if (fetchRedisData) {
        const parsedRedisData = JSON.parse(fetchRedisData);

        const checkAddressMatched =
          parsedRedisData.walletAddress.toLowerCase() === signer.toLowerCase();

        if (checkAddressMatched) {
          const checkAddressAvalaible = await UserModel.findOne({
            walletAddress: signer.toLowerCase().trim(),
          });

          if (checkAddressAvalaible) {
            // create the token and sent i tin response
            const token = jwtUtil.getAuthToken({
              _id: checkAddressAvalaible._id,
              walletAddress: checkAddressAvalaible.walletAddress.toLowerCase(),
            });

            await client.del(nonce);

            return res.status(200).json({
              message: "SUCCESS",
              status: true,
              data: {
                token,
              },
            });
          } else {
            return res.status(400).json({
              message: "Kyc Not yet Verified",
              status: false,
            });
          }
        } else {
          // invalid address
          return res.status(400).json({
            message: "Inavlid Wallet Address",
            status: false,
          });
        }
      } else {
        // redis data not avalible login again
        return res.status(400).json({
          message: "LOGIN_AGAIN",
          status: false,
        });
      }
    } else {
      // inavlid signature
      return res.status(400).json({
        message: "INVALID_SIGNATURE",
        status: false,
      });
    }
  } catch (err) {
    console.log("err in login :", err);
    Utils.echoLog("error in singnup  ", err);
    return res.status(500).json({
      message: req.t("DB_ERROR"),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// genrate nonce
UserCtr.genrateNonce = async (req, res) => {
  try {
    let nonce = crypto.randomBytes(16).toString("hex");

    const data = {
      walletAddress: req.params.address,
      nonce: nonce,
    };

    await client.set(nonce, JSON.stringify(data), "EX", 60 * 10);

    return res.status(200).json({
      message: "NONCE_GENRATED",
      status: true,
      data: {
        nonce: nonce,
      },
    });
  } catch (err) {
    Utils.echoLog("error in genrating nonce  ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get count by groups
UserCtr.getByGroups = async (req, res) => {
  try {
    // const getDataByGroup = await UserModel.aggregate([
    //   {
    //     $group: {
    //       _id: { source: '$source', status: '$kycStatus' },
    //       count: { $sum: 1 },
    //     },
    //   },
    //   { $sort: { count: -1 } },
    // ]);

    const getDataByGroup = await UserModel.aggregate([
      { $group: { _id: "$kycStatus", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      message: "User Group",
      status: true,
      data: getDataByGroup,
    });
  } catch (err) {
    Utils.echoLog("error in genrating gtroup data   ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// edit user wallet addresses
UserCtr.updateUserNetwork = async (req, res) => {
  try {
    const { nonce, signature, walletId, walletAddress } = req.body;
    const web3 = new Web3(
      new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
    );

    const signer = await web3.eth.accounts.recover(nonce, signature);

    if (signer) {
      const fetchRedisData = await client.get(nonce);

      console.log("redis data is:", fetchRedisData);

      if (fetchRedisData) {
        const parsedRedisData = JSON.parse(fetchRedisData);

        const checkAddressMatched =
          parsedRedisData.walletAddress.toLowerCase() === signer.toLowerCase();

        if (checkAddressMatched) {
          const checkAddressAvalaible = await UserModel.findOne({
            walletAddress: signer.toLowerCase().trim(),
          });

          const findNetworkWallet = await NetworkWalletModel.findById(walletId);
          // network id found
          if (checkAddressAvalaible && findNetworkWallet) {
            const userIds = findNetworkWallet.userId;

            const checkUserIdAvalaible = userIds.includes(req.userDetails._id);

            if (checkUserIdAvalaible) {
              findNetworkWallet.walletAddress = walletAddress;

              await findNetworkWallet.save();
              return res.status(200).json({
                message: "Wallet Address updated Successfully",
                status: true,
              });
            } else {
              return res.status(400).json({
                message: "Invalid Request",
                status: false,
              });
            }
          } else {
            return res.status(400).json({
              message: "Wallet Id Not Found",
              status: false,
            });
          }

          await client.del(nonce);
        } else {
          return res.status(400).json({
            message: "Nonce and signature not matching",
            status: false,
          });
        }
      } else {
        // invalid address
        return res.status(400).json({
          message: "Inavlid Wallet Address",
          status: false,
        });
      }
    } else {
      // redis data not avalible login again
      return res.status(400).json({
        message: "LOGIN_AGAIN",
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog("error in genrating gtroup data   ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

UserCtr.getSecondayWalletAddresses = async (req, res) => {
  try {
    const fetchWalletData = await networkModel.findById(req.body.walletId);
    if (fetchWalletData) {
      const csvFiles = req.files.csv;
      const file = csvFiles.path;
      const fileName = csvFiles.name;
      const csvData = [];
      console.log("file is:", csvFiles);
      const stream = fs.createReadStream(file);

      // const obj = xlsx.parse(file);
      // const csvFile = [];

      //   for (let i = 1; i < obj[0].data.length; i++) {
      //     const transactionData = obj[0].data[i];
      //     let transaction = {
      //       TxHash: transactionData[0],
      //       UnixTimeStamp: transactionData[1],
      //       DateTime: transactionData[2],
      //       From: transactionData[3],
      //       To: transactionData[4],
      //       Value: transactionData[5],
      //       ContractAddress: transactionData[6],
      //       TokenName: transactionData[7],
      //       TokenSymbol: transactionData[8],
      //     };

      //     console.log('transactionData', transactionData);

      //     const walletAddress = transactionData[3].toLowerCase().trim();
      //     const fetchUserDetails = UserModel.findOne({
      //       walletAddress: walletAddress,
      //     });

      //     if (fetchUserDetails) {
      //       const fetchSecondartyWallet = await NetworkWalletModel.findOne({
      //         networkId: fetchWalletData._id,
      //         userId: { $in: fetchUserDetails._id },
      //       });

      //       if (fetchSecondartyWallet) {
      //         transaction[`${fetchWalletData.networkName}`] =
      //           fetchSecondartyWallet.walletAddress;
      //       } else {
      //         transaction[`${fetchWalletData.networkName}`] = '-';
      //       }
      //     } else {
      //       transaction[`${fetchWalletData.networkName}`] = '-';
      //     }
      //     csvFile.push(transaction);
      //   }
      //   const csv = new ObjectsToCsv(transaction);
      //   const fileName = `${+new Date()}_${fetchWalletData.networkName}`;
      //   await csv.toDisk(`./lottery/${fileName}.csv`);

      //   Utils.sendSmapshotEmail(
      //     `./lottery/${fileName}.csv`,
      //     fileName,
      //     `Secondary Wallet Address of user`,
      //     `Secondary Wallet Address of user`
      //   );
      // } else {
      //   return res.status(400).json({
      //     message: 'Invalid Wallet Id',
      //     status: false,
      //   });

      let csvstream = csv
        .parseStream(stream, { headers: true })
        .on("data", async (row) => {
          // console.log('row is:', row);
          csvstream.pause();

          const transaction = { ...row };

          csvData.push(transaction);

          // const walletAddress = row['From'].toLowerCase().trim();

          // const fetchUserDetails = await UserModel.findOne({
          //   walletAddress: walletAddress,
          // });

          // if (fetchUserDetails) {
          //   const fetchSecondartyWallet = await NetworkWalletModel.findOne({
          //     networkId: fetchWalletData._id,
          //     userId: { $in: [fetchUserDetails._id] },
          //   });

          //   if (fetchSecondartyWallet) {
          //     transaction[`${fetchWalletData.networkName}`] =
          //       fetchSecondartyWallet.walletAddress;
          //   } else {
          //     transaction[`${fetchWalletData.networkName}`] = '-';
          //   }
          // } else {
          //   transaction[`${fetchWalletData.networkName}`] = '-';
          // }

          // csvData.push(transaction);

          csvstream.resume();
        })
        .on("end", async () => {
          console.log("WE are done");
          for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const walletAddress = row["From"].toLowerCase().trim();

            const fetchUserDetails = await UserModel.findOne({
              walletAddress: walletAddress,
            });

            if (fetchUserDetails) {
              const fetchSecondartyWallet = await NetworkWalletModel.findOne({
                networkId: fetchWalletData._id,
                userId: { $in: [fetchUserDetails._id] },
              });

              if (fetchSecondartyWallet) {
                csvData[i][`${fetchWalletData.networkName}`] =
                  fetchSecondartyWallet.walletAddress;
                if (
                  fetchWalletData.networkName.toLowerCase().trim() === "solana"
                ) {
                  csvData[i].isValid = await Utils.checkAddressForSolana(
                    fetchSecondartyWallet.walletAddress
                  );
                }
                csvData[i]["Created At"] = fetchSecondartyWallet.createdAt;
                csvData[i]["Updated At"] = fetchSecondartyWallet.updatedAt;
              } else {
                csvData[i][`${fetchWalletData.networkName}`] = "-";
                if (
                  fetchWalletData.networkName.toLowerCase().trim() === "solana"
                ) {
                  csvData[i].isValid = false;
                }
                csvData[i]["Created At"] = "-";
                csvData[i]["Updated At"] = "-";
              }
            } else {
              csvData[i][`${fetchWalletData.networkName}`] = "-";
              if (
                fetchWalletData.networkName.toLowerCase().trim() === "solana"
              ) {
                csvData[i].isValid = false;
              }
              csvData[i]["Created At"] = "-";
              csvData[i]["Updated At"] = "-";
            }
          }

          const csv = new ObjectsToCsv(csvData);
          const fileData = `${fileName}_${+new Date()}_${
            fetchWalletData.networkName
          }`;
          await csv.toDisk(`./lottery/${fileName}.csv`);

          Utils.sendSmapshotEmail(
            `./lottery/${fileName}.csv`,
            fileData,
            `Secondary Wallet Address of user Created at ${+new Date()}`,
            `Secondary Wallet Address of user`,
            "csv"
          );

          return res.status(200).json({
            message: "Your Request Received",
            status: true,
          });
        })
        .on("error", function (error) {
          console.log(error);
        });
    } else {
      return res.status(400).json({
        message: "Invalid Wallet Id",
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog("error in genrating gtroup data   ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

UserCtr.listAllUniqueCountries = async (req, res) => {
  try {
    const getDistinctRecords = await UserModel.find().distinct("country");
    if (getDistinctRecords) {
      return res.status(200).json({
        message: "Country List",
        status: true,
        data: getDistinctRecords,
      });
    } else {
      return res.status(200).json({
        message: "Country List",
        status: true,
        data: [],
      });
    }
  } catch (err) {
    Utils.echoLog("error in genrating country list   ", err);
    return res.status(500).json({
      message: "DB_ERROR",
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

UserCtr.subscribe = async (req, res) => {
  const { userId, projectId } = req.body;
  try {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    const project = await projectsModel.findOne({ _id: projectId });
    if (project.subscribedUsers.includes(user._id)) {
      return res.status(201).json({
        status: false,
        message: `Already subscribed for ${project.name}`,
      });
    }
    project.subscribedUsers.push(user._id);
    project.save();
    return res.status(200).json({
      status: true,
      message: `Successfully subscribed for ${project.name}`,
    });
  } catch (err) {
    Utils.echoLog("error in subscribing users for project  ", err);
    return res.status(500).json({
      status: false,
      message: "DB_ERROR",
      err: err.message ? err.message : err,
    });
  }
};

// script to add kyc users for community testing
// only for staging
UserCtr.addCommunityTesters = async (req, res) => {
  const files = req.files.csv;

  if (files) {
    const jsonArray = await CSV().fromFile(files.path);
    fs.unlink(files.path, () => {
      console.log("remove csv from temp : >> ");
    });
    jsonArray.forEach(async (user, index) => {
      console.log("user.name :>> ", user.name);
      const newUser = new UserModel({
        name: user.name,
        email: `${user.name.toLowerCase()}@mailinator.com`,
        recordId: `123456-${index}`,
        walletAddress: user.walletAddress.toLowerCase(),
        isActive: true,
        kycStatus: "approved",
        timestamp: Date.now(),
        approvedTimestamp: Date.now(),
        tier: "tier1",
      });
      await newUser.save();
    });
    res.json({
      status: true,
      data: jsonArray,
    });
  }
};
// Find Duplicate users against wallet address
UserCtr.findDupUsers = async (req, res) => {
  try {
    const users = await UserModel.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$walletAddress",
          data: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      // {$project:{"_id":1}},
      // {$group:{"_id":null,"dupWalletAdd":{$push:"$_id"}}},
    ]);
    let csvData = [];
    let keepUsers = [];
    let removeUsers = [];
    // users.forEach((user) => {
    // });
    users.forEach((wallet) => {
      keepUsers.push(wallet.data.shift())
      removeUsers = [...removeUsers, ...wallet.data];
    });

    keepUsers = keepUsers.map((user) => ({
      walletAddress: user.walletAddress,
      "Record Id": user.recordId,
      "kyc status": user.kycStatus,
      Name: user.name,
      Email: user.email,
      Country: user.country,
      "kyc Approved Date":
        user.approvedTimestamp != 0
          ? new Date(user.approvedTimestamp * 1000).toUTCString()
          : "--",
      "Created At": new Date(user.createdAt).toUTCString(),
    }));
    removeUsers = removeUsers.map((user) => ({
      walletAddress: user.walletAddress,
      "Record Id": user.recordId,
      "kyc status": user.kycStatus,
      Name: user.name,
      Email: user.email,
      Country: user.country,
      "kyc Approved Date":
        user.approvedTimestamp != 0
          ? new Date(user.approvedTimestamp * 1000).toUTCString()
          : "--",
      "Created At": new Date(user.createdAt).toUTCString(),
    }));
    const keepCsv = new ObjectsToCsv(keepUsers);
    const removeCsv = new ObjectsToCsv(removeUsers);
    const fileName = Date.now();
    await keepCsv.toDisk(`./lottery/keepDuplicateUser_${fileName}.csv`);
    Utils.sendSmapshotEmail(
      `./lottery/keepDuplicateUser_${fileName}.csv`,
      `keepDuplicateUser_${fileName}`,
      `Duplicate Records of users taken at ${new Date().toUTCString()}`,
      `Duplicate users list to keep`,
      "csv"
    );
    await removeCsv.toDisk(`./lottery/removeDuplicateUser_${fileName}.csv`);
    Utils.sendSmapshotEmail(
      `./lottery/removeDuplicateUser_${fileName}.csv`,
      `removeDuplicateUser_${fileName}`,
      `Duplicate Records of users taken at ${new Date().toUTCString()}`,
      `Duplicate users list to remove`,
      "csv"
    );
    res.json({
      status: true,
      keepUsers: keepUsers,
      removeUsers: removeUsers,
      message: "Please check your mail",
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
    });
  }
};
UserCtr.genCsv = async (req, res)=>{
  // debugger
  // const keep = req.files.keep;
  const remove = req.files.remove;
  // const keepData = await CSV().fromFile(keep.path);
  const removeData = await CSV().fromFile(remove.path);
  // fs.unlink(keep.path, () => {
  //   console.log("remove csv keepData from temp : >> ");
  // });
  fs.unlink(remove.path, () => {
    console.log("remove csv removeData from temp : >> ");
  });
  const recordIds = removeData.map((data)=>data['Record Id']);
  const users = await  UserModel.find({recordId : {$in : recordIds}}, { balObj : 0, __v : 0}).lean()
  const net = await networkWalletModel.find({userId : users.map((user)=>user._id)})
  var removeArrFinal = []
  const remoCsv = new ObjectsToCsv(users);
  const fileName = Date.now();
  await remoCsv.toDisk(`./lottery/removeListFinal${fileName}.csv`);
  Utils.sendSmapshotEmail(
    `./lottery/removeListFinal${fileName}.csv`,
    `removeListFinal${fileName}`,
    `Duplicate Records of users to remove taken at ${new Date().toUTCString()}`,
    `Duplicate users list to remove`,
    "csv"
  );
  res.json({
    data : removeArrFinal,
    len : users.length,
    net : net,
    recordIds : recordIds,
    users : users
  })
}
module.exports = UserCtr;
