const UserModal = require("../kycUsers/usersModel");
const SyncHelper = require("../sync/syncHelper");

const Utils = require("../../helper/utils");
const axios = require("axios");
const syncHelper = require("../sync/syncHelper");
// const BlockPassCtr = require('../blockPassUsers/blockPassCtr');
const blockPassCtr = {};

blockPassCtr.getApprovedUserList = async (req, res) => {
  console.log("Blockpass Cron Called ========>");
  try {
    // const getLatestBlockNoUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=CWZ1A15GW1ANBXEKUUE32Z2V2F4U1Q6TVA`;
    // const getLatestBlock = await axios.get(getLatestBlockNoUrl);
    // const latestBlock = parseInt(getLatestBlock.data.result, 16);

    // const getFarmingArray = await await SyncHelper.getFarmingBalance(
    //   0,
    //   latestBlock
    // );
    // const getBakeryArray = await SyncHelper.getBakeryFarmBalance(
    //   0,
    //   latestBlock
    // );
    // const getTosdisArray = await SyncHelper.getToshFarmBalance(0, latestBlock);
    let blockScheduled = [];
    // const getSlpArray = await SyncHelper.slpBalance(0, latestBlock);

    const getRecordsFromBlockPass = async (skip) => {
      const getRecords = await getDatafromBlockPass(skip);
      if (getRecords && getRecords.records.length) {
        console.log(
          "getRecords.records.length ====>",
          getRecords.records.length
        );

        for (let i = 0; i < getRecords.records.length; i++) {
          console.log(
            getRecords.records[i].identities.crypto_address_eth.value
          );

          const userAddress =
            getRecords.records[i].identities.crypto_address_eth.value;

          const balObj = {
            sfund: 0,
            liquidity: 0,
            farming: 0,
            bakery: 0,
            tosdis: 0,
            // slp: getSlp,
          };

          const total = 0;
          let approvedDate = 0;
          // getSlp;

          const email = getRecords.records[i].identities.email.value;
          const name = `${getRecords.records[i].identities.given_name.value}${getRecords.records[i].identities.family_name.value} `;
          const country = getRecords.records[i].identities?.address.value
            ? JSON.parse(getRecords.records[i].identities?.address.value)
            : null;
          const recordId = getRecords.records[i].recordId.toLowerCase().trim();
          const checkUserAvalaible = await UserModal.findOne({
            $or: [
              { recordId: getRecords.records[i].recordId },
              { walletAddress: userAddress.toLowerCase().trim() },
            ],
          });

          let countryCode = null;
          let state = null;
          if (country) {
            countryCode = country.country ? country.country : null;
            state = country.state ? country.state : null;
          }

          if (getRecords.records[i].status === "approved") {
            const approval = Date.parse(getRecords.records[i].approvedDate);
            approvedDate = Math.trunc(approval / 1000);
          }

          if (checkUserAvalaible) {
            // checkUserAvalaible.kycStatus = getRecords.records[i].status;
            // checkUserAvalaible.name = name;
            // checkUserAvalaible.email = email;
            // checkUserAvalaible.recordId = getRecords.records[i].recordId;
            // checkUserAvalaible.approvedTimestamp = approvedDate;
            // checkUserAvalaible.walletAddress = userAddress;
            // checkUserAvalaible.country = countryCode;

            const updateUser = await UserModal.updateOne(
              { _id: checkUserAvalaible._id },
              {
                kycStatus: getRecords.records[i].status,
                name: name,
                email: email,
                recordId: getRecords.records[i].recordId,
                approvedTimestamp: approvedDate,
                walletAddress: userAddress.toLowerCase().trim(),
                country: countryCode,
                state: state,
              }
            );

            // checkUserAvalaible.balObj = balObj;
            // checkUserAvalaible.totalbalance = total;
            // checkUserAvalaible.tier = syncHelper.getUserTier(0);
            // checkUserAvalaible.markModified('country');
            // await checkUserAvalaible.save();
            // itreateBlocks(i + 1);
          } else {
            const addNewUser = new UserModal({
              recordId: getRecords.records[i].recordId,
              walletAddress: userAddress.toLowerCase().trim(),
              email: email,
              name: name,
              totalbalance: total,
              balObj: balObj,
              kycStatus: getRecords.records[i].status,
              country: countryCode,
              approvedTimestamp: approvedDate,
              tier: syncHelper.getUserTier(0),
            });

            await addNewUser.save();
            // itreateBlocks(i + 1);
          }
        }

        console.log("total is:", getRecords.total);
        if (
          getRecords.total > getRecords.skip &&
          blockScheduled < getRecords.total
        ) {
          let skip = +getRecords.skip + 10;
          blockScheduled = skip;

          if (skip > getRecords.total) {
            skip = +getRecords.skip;
          }
          getRecordsFromBlockPass(skip);
        } else {
          console.log("Cron fired successfully");

          if (res) {
            res.status(200).JSON({
              message: "Cron fired successfully",
            });
          }
        }
      }
    };
    getRecordsFromBlockPass(0);

    // console.log('data is', data);
  } catch (err) {
    console.log("error in getting data", err);
    if (res) {
      res.status(500).JSON({
        message: "Something went wrong",
      });
    }
  }
};

// get data from block pass
async function getDatafromBlockPass(skip) {
  try {
    console.log("skip is:", skip);
    let url = `https://kyc.blockpass.org/kyc/1.0/connect/${process.env.BLOCKPASS_CLIENT_ID}/applicants?limit=10`;
    if (skip > 0) {
      url = `https://kyc.blockpass.org/kyc/1.0/connect/${process.env.BLOCKPASS_CLIENT_ID}/applicants?limit=10&skip=${skip}`;
    }

    var config = {
      method: "get",
      url: url,
      headers: {
        Authorization: `${process.env.BLOCKPASS_AUTHORIZATION}`,
      },
    };

    const getBlockPassData = await axios(config);
    if (getBlockPassData && getBlockPassData.status === 200) {
      // console.log(getBlockPassData.data.data);
      const data = getBlockPassData.data.data.records;
      const total = getBlockPassData.data.data.total;
      const skip = getBlockPassData.data.data.skip;

      return {
        records: data,
        total: total,
        skip: skip,
      };
    } else {
      return {
        records: [],
        total: 0,
        skip: 0,
      };
    }
  } catch (err) {
    console.log("Error in blockpass api ", err);
  }
}

// get sfund balance
async function getSfundBalance(address, userAddress, endBlock) {
  // try {
  //   const fromAddress = userAddress.trim();
  //   const requiredAddress = fromAddress.substring(2, fromAddress.length);

  //   const data = {
  //     jsonrpc: '2.0',
  //     method: 'eth_call',
  //     params: [
  //       {
  //         to: address,
  //         data: `0x70a08231000000000000000000000000${requiredAddress}`,
  //       },
  //       `0x${endBlock.toString(16).toUpperCase()}`,
  //     ],
  //     id: 67,
  //   };
  //   const config = {
  //     method: 'post',
  //     url: 'https://bsc-private-dataseed1.nariox.org',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     data: JSON.stringify(data),
  //   };
  //   const fetchDetails = await axios(config);

  //   if (!fetchDetails.data.error) {
  //     const weiBalance = parseInt(fetchDetails.data.result, 16);
  //     let seedifyBalance = (weiBalance / Math.pow(10, 18)).toFixed(2);
  //     console.log('seedifyBalance', seedifyBalance);
  //     return seedifyBalance;
  //   } else {
  //     return 0;
  //   }
  // } catch (err) {
  //   console.log('err in api for fetching balnce', err);
  // }

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

// get liquidity balance
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

blockPassCtr.checkKycVerified = async (req, res) => {
  try {
    const checkIsVerified = await UserModal.findOne(
      {
        walletAddress: req.params.address.toLowerCase(),
      },
      { name: 0, recordId: 0, country: 0, state: 0, email: 0 }
    )
      .populate({
        path: "networks",
        select: { createdAt: 0, updatedAt: 0, userId: 0 },
        populate: {
          path: "networkId",
          select: { _id: 1, networkName: 1, logo: 1 },
          model: "network",
        },
      })
      .sort({ createdAt: -1 });

    // console.log('checkIsVerified', checkIsVerified);
    if (checkIsVerified) {
      res.status(200).json({
        message: "Kyc Status",
        status: true,
        data: {
          kycStatus: checkIsVerified.kycStatus === "approved" ? true : false,
          status: checkIsVerified.kycStatus,
          data: {
            // name: checkIsVerified.name,
            userId: checkIsVerified._id,
            snapshot: checkIsVerified.balObj,
            tier: checkIsVerified.tier,
            timestamp: checkIsVerified.timestamp,
            networks: checkIsVerified.networks,
          },
        },
      });
    } else {
      res.status(200).json({
        message: "Kyc Status",
        status: true,
        data: {
          kycStatus: false,
          status: "NOT REGISTERED",
          data: {},
        },
      });
    }
  } catch (err) {
    Utils.echoLog(`error in getSfundBalance ${err}`);
    res.status(200).json({
      message: "Somethig went wrong please try again",
      status: true,
      err: err.message ? err.message : null,
    });
  }
};

blockPassCtr.getWebhooks = async (req, res) => {
  try {
    Utils.echoLog("Webhook received for user", JSON.stringify(req.body));
    const userDetails = req.body;
    res.status(200).json({
      status: true,
    });

    const url = `https://kyc.blockpass.org/kyc/1.0/connect/${process.env.BLOCKPASS_CLIENT_ID}/recordId/${userDetails.recordId}`;

    var config = {
      method: "get",
      url: url,
      headers: {
        Authorization: `${process.env.BLOCKPASS_AUTHORIZATION}`,
      },
    };

    const getBlockPassData = await axios(config);
    if (getBlockPassData && getBlockPassData.status === 200) {
      const getRecords = getBlockPassData.data.data;

      const userAddress = getRecords.identities.crypto_address_eth.value;

      const balObj = {
        sfund: 0,
        liquidity: 0,
        farming: 0,
        bakery: 0,
        tosdis: 0,
        // slp: getSlp,
      };

      const total = 0;
      let approvedDate = 0;
      // getSlp;

      const email = getRecords.identities.email.value;
      const name = `${getRecords.identities.given_name.value}${getRecords.identities.family_name.value} `;
      const country = getRecords.identities?.address.value
        ? JSON.parse(getRecords.identities?.address.value)
        : null;
      const recordId = getRecords.recordId.toLowerCase().trim();
      const checkUserAvalaible = await UserModal.findOne({
        $or : [
          {recordId: getRecords.recordId},
          {walletAddress : userAddress.toLowerCase().trim()}
        ]
      });

      let countryCode = null;
      let state = null;
      if (country) {
        countryCode = country.country ? country.country : null;
        state = country.state ? country.state : null;
      }

      if (getRecords.status === "approved") {
        const approval = Date.parse(getRecords.approvedDate);
        approvedDate = Math.trunc(approval / 1000);
      }

      if (checkUserAvalaible) {
        console.log("User avalaible ====>");
        const updateUser = await UserModal.updateOne(
          { _id: checkUserAvalaible._id },
          {
            kycStatus: getRecords.status,
            name: name,
            email: email,
            recordId: getRecords.recordId,
            approvedTimestamp: approvedDate,
            walletAddress: userAddress.toLowerCase().trim(),
            country: countryCode,
            state: state,
          },
          { upsert: true }
        );
      } else {
        const addNewUser = new UserModal({
          recordId: getRecords.recordId,
          walletAddress: userAddress.toLowerCase().trim(),
          email: email,
          name: name,
          totalbalance: total,
          balObj: balObj,
          kycStatus: getRecords.status,
          country: countryCode,
          approvedTimestamp: approvedDate,
          tier: syncHelper.getUserTier(0),
        });

        await addNewUser.save();
        // itreateBlocks(i + 1);
      }
    }
  } catch (err) {
    Utils.echoLog(`Error in webhooks ${err}`);
    console.log("error in webhook", err);
  }
};

module.exports = blockPassCtr;
