const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();

const Utils = require('../../helper/utils');

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

UserMiddleware.checkProcessPending = async (req, res, next) => {
  try {
    const checkAlreadyPending = await client.get('snapshot');
    console.log('checkAlreadyPending', checkAlreadyPending);

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

module.exports = UserMiddleware;
