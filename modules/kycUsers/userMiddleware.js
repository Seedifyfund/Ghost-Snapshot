const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const asyncRedis = require('async-redis');
const NetworkModel = require('../networkWallet/networkWalletModel');
const UserModel = require('../kycUsers/usersModel');
const client = asyncRedis.createClient();

const Utils = require('../../helper/utils');
const { flatMap } = require('lodash');

const UserMiddleware = {};

UserMiddleware.validateCheck = async (req, res, next) => {
  const schema = Joi.object({
    requestNo: Joi.number().required(),
    snapshotId: Joi.string().required(),
    num: Joi.number().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

UserMiddleware.loginCheck = async (req, res, next) => {
  const schema = Joi.object({
    nonce: Joi.string().required(),
    signature: Joi.string().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

UserMiddleware.validateAddWallet = async (req, res, next) => {
  const schema = Joi.object({
    walletAddress: Joi.string().required(),
    networkId: Joi.string().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

UserMiddleware.checkWalletAlreadyAdded = async (req, res, next) => {
  try {
    const fetchUsers = await UserModel.find({
      walletAddress: req.userDetails.walletAddress.toLowerCase(),
    });

    if (fetchUsers.length) {
      let userId = [];
      for (let i = 0; i < fetchUsers.length; i++) {
        userId.push(fetchUsers[i]._id);
      }

      const checkAlreadyAdded = await NetworkModel.findOne({
        networkId: req.body.networkId,
        userId: { $in: userId },
      });

      if (checkAlreadyAdded) {
        return res.status(400).json({
          message: 'Netwrok Wallet Already Added',
          status: false,
        });
      } else {
        return next();
      }
    } else {
      return res.status(400).json({
        message: 'No User found',
        status: false,
      });
    }
  } catch (err) {
    console.log('err is:', err);
    return res.status(500).json({
      message: 'DB_ERROR',
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

UserMiddleware.checkProcessPending = async (req, res, next) => {
  try {
    const checkAlreadyPending = await client.get('snapshot');

    await client.del('snapshot');
    if (checkAlreadyPending) {
      return res.status(400).json({
        status: false,
        message: 'Snapshot is under process please wait to get it completed ',
      });
    } else {
      return next();
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      err: err.message ? err.message : err,
    });
  }
};

UserMiddleware.validateUpdateWallet = async (req, res, next) => {
  const schema = Joi.object({
    walletAddress: Joi.string().required(),
    walletId: Joi.string().required(),
    nonce: Joi.string().required(),
    signature: Joi.string().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

UserMiddleware.checkWalletAddress = async (req, res, next) => {
  try {
  } catch (err) {
    return res.status(500).json({
      message: 'DB_ERROR',
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = UserMiddleware;
