const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const AdminModel = require('./adminModel');
const Utils = require('../../helper/utils');

const AdminMiddleware = {};

AdminMiddleware.validateAdd = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    username: Joi.string().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

AdminMiddleware.checkAlreadyAdded = async (req, res, next) => {
  try {
    const checkAlreadyAdded = await AdminModel.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });

    if (checkAlreadyAdded) {
      return res.status(400).json({
        message: 'Username or email already added',
        status: true,
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog('error in checkAlreadyAdded ', err);
    return res.status(500).json({
      message: 'Some thing went wrong',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

AdminMiddleware.validateLogin = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    password: Joi.string().required(),
    username: Joi.string(),
  });
  validate.validateRequest(req, res, next, schema);
};

module.exports = AdminMiddleware;
