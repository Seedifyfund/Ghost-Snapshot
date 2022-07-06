const express = require('express');
const Auth = require('../../helper/auth');
const settingCtr = require('./settingController');
const settingRoute = express.Router();

settingRoute.post('/add-snapshot-email', [Auth.isAuthenticatedUser, settingCtr.addSnapshotEmailCtr]);
settingRoute.post('/add-cc-email', [Auth.isAuthenticatedUser, settingCtr.addccEmailCtr]);

module.exports = settingRoute;
