const utils = require('./utils');
const AdminModel = require('../modules/admin/adminModel');
const UserModel = require('../modules/kycUsers/usersModel');
const errorUtil = require('./error');
const jwtUtil = require('./jwtUtils');

const auth = {};
// check authentication
auth.isAuthenticatedUser = async (req, res, next) => {
  let token = req.headers && req.headers['x-auth-token'];

  if (utils.empty(token)) {
    token = req.body && req.body['x-auth-token'];
  }
  const userTokenData = jwtUtil.decodeAuthToken(token);

  if (utils.empty(userTokenData)) {
    return errorUtil.notAuthenticated(res, req);
  }

  const fetchAdminDetails = await AdminModel.findById(userTokenData._id);

  if (fetchAdminDetails && fetchAdminDetails.isActive) {
    req.userData = fetchAdminDetails;
    return next();
  } else {
    return errorUtil.notAuthenticated(res, req);
  }

  return errorUtil.notAuthenticated(res, req);
};

auth.checkIsAutheticated = async (req, res, next) => {
  let token = req.headers && req.headers['x-auth-token'];

  if (utils.empty(token)) {
    token = req.body && req.body['x-auth-token'];
  }
  const userTokenData = jwtUtil.decodeAuthToken(token);

  if (utils.empty(userTokenData)) {
    return next();
  }

  const fetchAdminDetails = await AdminModel.findById(userTokenData._id);

  if (fetchAdminDetails && fetchAdminDetails.isActive) {
    req.userData = fetchAdminDetails;
    return next();
  } else {
    return next();
  }
};

auth.userAuthetication = async (req, res, next) => {
  let token = req.headers && req.headers['x-auth-token'];

  if (utils.empty(token)) {
    token = req.body && req.body['x-auth-token'];
  }
  const userTokenData = jwtUtil.decodeAuthToken(token);
  req.userDetails = userTokenData;

  if (utils.empty(userTokenData)) {
    return errorUtil.notAuthenticated(res, req);
  }
  return next();
};

module.exports = auth;
