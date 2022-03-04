const express = require('express');
const snftUsersRoute = express.Router();
const Auth = require('../../helper/auth');
const multipart = require('connect-multiparty');
const { addSnftUsers, getSingleUser } = require('./snftUsersController');
const multipartMiddleware = multipart();
snftUsersRoute.post('/add-users', [ multipartMiddleware, Auth.isAuthenticatedUser, addSnftUsers])
snftUsersRoute.get('/user/:id', [getSingleUser])

module.exports = snftUsersRoute;
