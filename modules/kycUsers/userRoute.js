const express = require('express');
const UserCtr = require('./userController');
const UserMiddleware = require('./userMiddleware');

const Auth = require('../../helper/auth');
const auth = require('../../helper/auth');

const userRoute = express.Router();
// get roles
const listUser = [Auth.isAuthenticatedUser, UserCtr.list];
userRoute.get('/list', listUser);

// login admin
const getRandom = [
  Auth.isAuthenticatedUser,
  UserMiddleware.validateCheck,
  UserCtr.genrateLotteryNumbers,
];
userRoute.post('/genrateRandom', getRandom);

// genrate csv
const genrateCsv = [auth.isAuthenticatedUser, UserCtr.addCsv];
userRoute.get('/genrateCsv', genrateCsv);

// get snapshot data
const getSnapshotData = [
  auth.isAuthenticatedUser,
  UserCtr.getGenratedSnapshotData,
];
userRoute.get('/snapshotData', getSnapshotData);
module.exports = userRoute;
