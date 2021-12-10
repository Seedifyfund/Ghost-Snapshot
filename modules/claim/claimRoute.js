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

// add all records in claim dump
const addClaimDump = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateAdd,
  ClaimCtr.addClaimDump,
];
claimRoute.post('/add-dump', addClaimDump);

// update dump record for each iteration and enter record in main claim model
const updateDump = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateDumpUdate,
  ClaimCtr.updateDump,
];

claimRoute.post('/update-dump', updateDump);
// get single dump details
const getClaimDump = [Auth.isAuthenticatedUser, ClaimCtr.getClaimDump];
claimRoute.get('/get-dump/:dumpId', getClaimDump);

// login admin
const list = [ClaimCtr.list];
claimRoute.get('/list', list);
claimRoute.get('/dump-list', ClaimCtr.getClaimDumpList);

// get single pool details
const getSingle = [Auth.isAuthenticatedUser, ClaimCtr.getSinglePool];
claimRoute.get('/single/:id', getSingle);

module.exports = claimRoute;
