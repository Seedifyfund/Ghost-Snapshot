const express = require('express');
const ClaimCtr = require('./claimController');
const ClaimMiddleware = require('./claimMiddleware');
const Auth = require('../../helper/auth');

const claimRoute = express.Router();
// get roles
const addNewClaim = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateAdd,
  ClaimCtr.addNewClaim,
];
claimRoute.post('/add', addNewClaim);

// login admin
const list = [ClaimCtr.list];
claimRoute.post('/list', list);

module.exports = claimRoute;
