const express = require('express');
const networkCtr = require('./networkCtr');
const networkMiddleware = require('./networkMiddleware');
const Auth = require('../../helper/auth');

const networkRoute = express.Router();

// add new network
const addNewNetwork = [
  Auth.isAuthenticatedUser,
  networkMiddleware.validateRequest,
  networkMiddleware.checkAlreadyAdded,
  networkCtr.addNewNetwork,
];
networkRoute.post('/add', addNewNetwork);

// update the network
const updateNetwork = [
  Auth.isAuthenticatedUser,
  networkMiddleware.validateUpdateRequest,
  networkCtr.updateNetwork,
];
networkRoute.put('/update/:id', updateNetwork);

// get network List

const list = [Auth.checkIsAutheticated, networkCtr.listNetworks];
networkRoute.get('/list', list);

module.exports = networkRoute;
