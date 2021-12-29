const express = require('express');
const LogsCtr = require('./logsController');
const Auth = require('../../helper/auth');
const logsRoute = express.Router();





// login admin
const list = [LogsCtr.list];
logsRoute.get('/list', LogsCtr.list);


// get single pool details
const getSingle = [Auth.isAuthenticatedUser, LogsCtr.getSingleLog];
logsRoute.get('/:id', getSingle);

module.exports = logsRoute;
