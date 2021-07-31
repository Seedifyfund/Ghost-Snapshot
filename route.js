const express = require('express');
// const bodyParser = require('body-parser');
const syncRoute = require('./modules/sync/syncRoute');
const blockPassRoute = require('./modules/blockpass/blockPassRoute');
const adminRoute = require('./modules/admin/adminRoute');
const userRoute = require('./modules/kycUsers/userRoute');
const poolRoute = require('./modules/pools/poolsRoute');
const poolsRoute = require('./modules/pools/poolsRoute');
// Routes Path

const app = express.Router();

// Routes
app.use('/api/v1/sync', syncRoute);
app.use('/api/v1/block', blockPassRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/pools', poolsRoute);
app.all('/*', (req, res) =>
  res.status(404).json({ message: 'Invalid Requests' })
);

module.exports = app;
