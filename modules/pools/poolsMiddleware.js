const Joi = require('joi');
const validate = require('../../helper/validateRequest');

const Utils = require('../../helper/utils');
const PoolsModel = require('./poolsModel');

const poolsMiddleware = {};

poolsMiddleware.validateCheck = async (req, res, next) => {
  const schema = Joi.object({
    poolName: Joi.string().required(),
    contractAddress: Joi.string().required(),
    tokenAddress: Joi.string().required(),
    loyalityPoints: Joi.number().required(),
    contractType: Joi.string().valid('staking', 'farming').required(),
    lptokenAddress: Joi.string().allow(null),
    url: Joi.string().uri().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

poolsMiddleware.validateUpdateCheck = async (req, res, next) => {
  const schema = Joi.object({
    poolName: Joi.string(),
    contractAddress: Joi.string(),
    tokenAddress: Joi.string(),
    loyalityPoints: Joi.number(),
    contractType: Joi.string().valid('staking', 'farming'),
    lptokenAddress: Joi.string().allow(null),
    url: Joi.string().uri().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

poolsMiddleware.checkContractAlreadyExists = async (req, res, next) => {
  try {
    const checkPoolAlreadyExists = await PoolsModel.findOne({
      contractAddress: req.body.contractAddress.toLowerCase(),
    });

    if (!checkPoolAlreadyExists) {
      return next();
    }
    return res.status(400).json({
      status: false,
      message: 'Pool Already exists',
    });
  } catch (err) {
    Utils.echoLog(`Error in checkContractAlreadyExists Pool ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

module.exports = poolsMiddleware;
