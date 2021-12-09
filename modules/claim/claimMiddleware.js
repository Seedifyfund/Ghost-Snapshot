const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const Utils = require('../../helper/utils');

const ClaimMiddleware = {};

ClaimMiddleware.validateAdd = async (req, res, next) => {
  const schema = Joi.object({
    contractAddress: Joi.string().required(),
    tokenAddress: Joi.string().required(),
    networkName: Joi.string()
      .valid('polygon', 'binance', 'ethereum', 'solana', 'avalanche')
      .required(),
    networkSymbol: Joi.string()
      .allow('BNB', 'ETH', 'MATIC', 'SOL', 'AVAX')
      .required(),
    networkId: Joi.string().required(),
    amount: Joi.number().required(),
    name: Joi.string().required(),
    timestamp: Joi.number().required(),
    phaseNo: Joi.number().required(),
    logo: Joi.string().uri().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

ClaimMiddleware.validateDumpUdate = async (req, res, next) => {
  const schema = Joi.object({
    transactionHash: Joi.string().required(),
    dumpId: Joi.string().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

module.exports = ClaimMiddleware;
