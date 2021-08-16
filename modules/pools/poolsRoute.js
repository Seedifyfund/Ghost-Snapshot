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
poolsRoute.post('/update/:poolId', updatePool);

// delete pool

const deletePool = [Auth.isAuthenticatedUser, PoolsCtr.deleteExistingPools];
poolsRoute.delete('/delete/:poolId', deletePool);

// list pools for add
const listPoolsForUser = [PoolsCtr.listPoolsForUser];
poolsRoute.get('/listForUser', listPoolsForUser);

// list farming pools
const listFarmingPools = [PoolsCtr.listFarmingPools];
poolsRoute.get('/farming', listFarmingPools);

module.exports = poolsRoute;
