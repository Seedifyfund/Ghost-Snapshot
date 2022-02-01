const express = require('express');
const projectCtr = require('./projectsController');
const projectRoute = express.Router();
const Auth = require('../../helper/auth');

projectRoute.post('/add', [Auth.apiKeyAuthentication, projectCtr.addNewProject])
projectRoute.get('/list', [projectCtr.list])

module.exports = projectRoute;
