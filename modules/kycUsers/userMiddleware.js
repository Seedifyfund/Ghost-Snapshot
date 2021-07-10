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

module.exports = UserMiddleware;
