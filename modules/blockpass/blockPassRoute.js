const express = require('express');
const BlockPassCtr = require('./blockpassCtr');

const blockPassRoute = express.Router();

// get block pass users
const getApprovedUsers = [BlockPassCtr.getApprovedUserList];
blockPassRoute.get('/approved', getApprovedUsers);

// check address is kyc verified or not
const checkIsVerified = [BlockPassCtr.checkKycVerified];
blockPassRoute.get('/check/:address', checkIsVerified);

// block pass webhooks
const webhook = [BlockPassCtr.getWebhooks];
blockPassRoute.post('/webhook', webhook);

module.exports = blockPassRoute;
