const express = require('express');
const BlockPassCtr = require('./blockpassCtr');

const webhookRoute = express.Router();

// block pass webhooks
const webhook = [BlockPassCtr.getWebhooks];
webhookRoute.post('/webhook', webhook);

module.exports = webhookRoute;
