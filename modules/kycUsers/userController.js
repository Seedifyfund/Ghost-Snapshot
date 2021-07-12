const UserModel = require('./usersModel');
const Utils = require('../../helper/utils');
const web3Helper = require('../../helper/web3Helper');
const lotteryModel = require('../lottery/lotteryModel');
const SnapshotModel = require('../snapshot/snapshotModel');
const ObjectsToCsv = require('objects-to-csv');
const crypto = require('crypto');
const fs = require('fs');

const UserCtr = {};

UserCtr.list = async (req, res) => {
  try {
    const page = +req.query.page || 1;

    const query = { isActive: true };

    if (req.query.tier) {
      query.tier = req.query.tier;
    }

    const totalCount = await UserModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const list = await UserModel.find(query, {
      recordId: 0,

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
      let looteryNumbers = [];

      // recursive loop
      const itreate = async (no) => {
        console.log('Number is:', num);

        if (num > 1 && num <= 100) {
          num = num + 5;
        } else if (num > 100 && num <= 1000) {
          num = Math.ceil(num + num * 0.1);
        } else {
          num = Math.ceil(num + num * 0.15);
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

module.exports = UserCtr;
