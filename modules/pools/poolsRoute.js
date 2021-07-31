const express = require('express');
const PoolsCtr = require('./poolsController');
const PoolsMiddleware = require('./poolsMiddleware');
const Auth = require('../../helper/auth');

const poolsRoute = express.Router();
// list pools
const listPools = [Auth.isAuthenticatedUser, PoolsCtr.listPools];
poolsRoute.get('/list', listPools);

// list specific pool
const listSinglePools = [Auth.isAuthenticatedUser, PoolsCtr.listPools];
poolsRoute.get('/list/:poolId', listSinglePools);

// add new pool
const addNewPool = [
  Auth.isAuthenticatedUser,
  PoolsMiddleware.validateCheck,
  PoolsMiddleware.checkContractAlreadyExists,
  PoolsCtr.addNewPool,
];
poolsRoute.post('/add', addNewPool);

// update existing pool
const updatePool = [
  Auth.isAuthenticatedUser,
  PoolsMiddleware.validateUpdateCheck,
  PoolsCtr.updatePool,
];
poolsRoute.put('/update/:poolId', updatePool);

// delete pool

const deletePool = [Auth.isAuthenticatedUser, PoolsCtr.deleteExistingPools];
poolsRoute.delete('/delete/:poolId', deletePool);

module.exports = poolsRoute;
