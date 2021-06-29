const express = require('express');
const UserCtr = require('./userController');

const Auth = require('../../helper/auth');

const userRoute = express.Router();
// get roles
const listUser = [Auth.isAuthenticatedUser, UserCtr.list];
userRoute.get('/list', listUser);

// login admin
// const login = [AdminMiddleware.validateLogin, AdminCtr.login];
// adminRoute.post('/login', login);

module.exports = userRoute;
