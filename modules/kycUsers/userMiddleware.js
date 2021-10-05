const Joi = require('joi');
const validate = require('../../helper/validateRequest');

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

module.exports = UserMiddleware;
