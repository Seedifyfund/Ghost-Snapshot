const express = require('express');
const ClaimCtr = require('./claimController');
const ClaimMiddleware = require('./claimMiddleware');
const Auth = require('../../helper/auth');
const multipart = require('connect-multiparty');
const { usersPoolList } = require('./claimController');
const multipartMiddleware = multipart();
const claimRoute = express.Router();
// get roles
const addNewClaim = [
  Auth.isAuthenticatedUser,
  ClaimMiddleware.validateAdd,
  ClaimCtr.addNewClaim,
];
claimRoute.post('/add', addNewClaim);

const editClaim = [
  Auth.isAuthenticatedUser,
  ClaimCtr.editClaim,
];
claimRoute.post('/edit', editClaim);

// add all records in claim dump
const addClaimDump = [
  Auth.isAuthenticatedUser,
  multipartMiddleware,
  ClaimMiddleware.validateAdd,
  ClaimCtr.addClaimDump,
];
claimRoute.post('/add-dump', addClaimDump);

// edit dump vesting
const editVesting = [
  Auth.isAuthenticatedUser,
  ClaimCtr.editVesting,
]
claimRoute.post('/edit-vesting', editVesting);

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

const editDump = [Auth.isAuthenticatedUser, ClaimCtr.editDump]
claimRoute.post('/edit-dump', editDump);
claimRoute.post('/topup-vesting', ClaimCtr.topupVestings);

// login admin
const list = [ClaimCtr.list];
claimRoute.get('/list', list);
claimRoute.get('/users-pools', usersPoolList);


claimRoute.get('/dump-list', ClaimCtr.getClaimDumpList);

// get single pool details
const getSingle = [Auth.isAuthenticatedUser, ClaimCtr.getSinglePool];
claimRoute.get('/single/:id', ClaimCtr.getSinglePool);
claimRoute.get('/create-hexproof', ClaimCtr.createHexProof);
// claimRoute.get('/check', ClaimCtr.checkTransactionStatus);

module.exports = claimRoute;
