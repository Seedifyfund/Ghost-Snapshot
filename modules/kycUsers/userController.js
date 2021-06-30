const UserModel = require('./usersModel');
const Utils = require('../../helper/utils');
const web3Helper = require('../../helper/web3Helper');
const lotteryModel = require('../lottery/lotteryModel');
const ObjectsToCsv = require('objects-to-csv');

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

    const fetchRecords = await UserModel.find(
      { tier: tier, isActive: true },
      { name: 1, walletAddress: 1, email: 1, tier: 1 }
    );

    console.log('records length ', fetchRecords.length);

    if (num > records.length) {
      return res.status(400).json({
        status: false,
        message: 'Number cant excedd no of records',
      });
    }

    if (fetchRecords && fetchRecords.length) {
      res.status(200).json({
        status: true,
        message: 'Request received ',
      });

      const recordsLength = fetchRecords.length;
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
            const userRecords = fetchRecords[index];

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
          let userIds = [];

          // fetch records
          for (let j = 0; j < fetchRecords.length; i++) {
            userIds.push({
              _id: fetchRecords[j]._id,
              walletAddress: fetchRecords[j].walletAddress,
            });
          }

          const addNewLottery = new lotteryModel({
            requestId: req.body.requestId,
            walletAddress: JSON.stringify(userIds),
            lotteryNumbers: looteryNumbers,
            lotteryUsers: req.body.num,
            totalRecords: fetchRecords.length,
            noOfRecordsAdded: num,
          });

          await addNewLottery.save();
        }
      };
      itreate(req.body.num);
    }
  } catch (err) {
    Utils.echoLog(`error in genrateLotteryNumbers ${err}`);
  }
};

module.exports = UserCtr;
