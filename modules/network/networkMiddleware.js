const Joi = require('joi');
const NetworkModel = require('./networkModel');
const validate = require('../../helper/validateRequest');
const networkMiddleware = {};

networkMiddleware.validateRequest = (req, res, next) => {
  const schema = Joi.object({
    networkName: Joi.string().required(),
    logo: Joi.string(),
  });
  validate.validateRequest(req, res, next, schema);
};

networkMiddleware.checkAlreadyAdded = async (req, res, next) => {
  try {
    const checkAlreadyAdded = await NetworkModel.findOne({
      networkName: req.body.networkName.toLowerCase().trim(),
    });

    if (checkAlreadyAdded) {
      return res.status(400).json({
        message: 'Network Already Added ',
        status: false,
      });
    } else {
      return next();
    }
  } catch (err) {
    return res.status(500).json({
      message: 'Something Went Wrong ',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

networkMiddleware.validateUpdateRequest = (req, res, next) => {
  const schema = Joi.object({
    networkName: Joi.string(),
    logo: Joi.string(),
    isActive: Joi.boolean(),
  });
  validate.validateRequest(req, res, next, schema);
};

module.exports = networkMiddleware;
