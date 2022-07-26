const express = require('express');
const AdminCtr = require('./adminController');
const AdminMiddleware = require('./adminMiddleware');
const Auth = require('../../helper/auth');
const rateLimit = require('express-rate-limit');

const adminRoute = express.Router();
const reqLimiter = rateLimit({ max: 10, windowMS: 1000 * 60 * 10 }) // 10 request per 10 minutes

// get roles
const addNewAdmin = [
  Auth.isAuthenticatedUser,
  AdminMiddleware.validateAdd,
  AdminMiddleware.checkAlreadyAdded,
  AdminCtr.addNewAdmin,
];
adminRoute.post('/add', addNewAdmin);

// login admin
const login = [reqLimiter ,AdminMiddleware.validateLogin, AdminCtr.login];
adminRoute.post('/login', login);

module.exports = adminRoute;
