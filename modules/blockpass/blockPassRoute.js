const express = require('express');
const BlockPassCtr = require('./blockpassCtr');

const blockPassRoute = express.Router();

// get block pass users
const getApprovedUsers = [BlockPassCtr.getApprovedUserList];
blockPassRoute.get('/approved', getApprovedUsers);

module.exports = blockPassRoute;
