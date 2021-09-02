const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const Utils = require('../../helper/utils');

const ClaimMiddleware = {};

ClaimMiddleware.validateAdd = async (req, res, next) => {
  const schema = Joi.object({
    tokenAddress: Joi.string().required(),
    networkName: Joi.string()
      .valid('polygon', 'binance', 'ethereum')
      .required(),
    networkSymbol: Joi.string().allow('BNB', 'ETH', 'MATIC').required(),
    networkId: Joi.string().required(),
    amount: Joi.number().required(),
    name: Joi.string().required(),
    timestamp: Joi.number().required(),
    phaseNo: Joi.number().required(),
    logo: Joi.string().uri().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

module.exports = ClaimMiddleware;
