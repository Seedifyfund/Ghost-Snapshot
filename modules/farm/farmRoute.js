const express = require('express');
const farmCtr = require('./farmCtr');
const Auth = require('../../helper/auth');

const farmRoute = express.Router();

// add new network
const getFarmReport = [farmCtr.getUserBalances];
farmRoute.get('/getList', getFarmReport);

module.exports = farmRoute;
