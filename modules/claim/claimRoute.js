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
  ClaimCtr.addClaimDump,
];
const updateDump = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateDumpUdate,
  ClaimCtr.updateDump,
];
const getClaimDump = [Auth.isAuthenticatedUser, ClaimCtr.getClaimDump];
claimRoute.post('/add', addNewClaim);
claimRoute.post('/add-dump', addClaimDump);
claimRoute.post('/update-dump', updateDump);

// login admin
const list = [ClaimCtr.list];
claimRoute.get('/list', list);
claimRoute.get('/dump-list', ClaimCtr.getClaimDumpList);
claimRoute.get('/get-dump/:dumpId', getClaimDump);

// get single pool details
const getSingle = [Auth.isAuthenticatedUser, ClaimCtr.getSinglePool];
claimRoute.get('/single/:id', getSingle);

module.exports = claimRoute;
