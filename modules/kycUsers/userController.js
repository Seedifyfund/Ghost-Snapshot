const UserModel = require('./usersModel');
const Utils = require('../../helper/utils');
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
      totalbalance: 0,
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

module.exports = UserCtr;
