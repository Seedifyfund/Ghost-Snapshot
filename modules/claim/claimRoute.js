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

const addClaimDump = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateAdd,
  ClaimCtr.addClaimDump
]
claimRoute.post('/add', addNewClaim);
claimRoute.post('/add-claim-dump', ClaimCtr.addClaimDump);

// login admin
const list = [ClaimCtr.list];
claimRoute.get('/list', list);

// get single pool details
const getSingle = [Auth.isAuthenticatedUser, ClaimCtr.getSinglePool];
claimRoute.get('/single/:id', getSingle);

module.exports = claimRoute;
