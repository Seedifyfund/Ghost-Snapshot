const express = require('express');
// const bodyParser = require('body-parser');
const syncRoute = require('./modules/sync/syncRoute');
const blockPassRoute = require('./modules/blockpass/blockPassRoute');
const adminRoute = require('./modules/admin/adminRoute');
const userRoute = require('./modules/kycUsers/userRoute');
const claimRoute = require('./modules/claim/claimRoute');
const poolsRoute = require('./modules/pools/poolsRoute');
const networkRoute = require('./modules/network/networkRoute');
const farmRoute = require('./modules/farm/farmRoute');

// Routes Path

const app = express.Router();

// Routes
app.use('/api/v1/sync', syncRoute);
app.use('/api/v1/block', blockPassRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/pools', poolsRoute);
app.use('/api/v1/claim', claimRoute);
app.use('/api/v1/network', networkRoute);
app.use('/api/v1/farm', farmRoute);
app.all('/*', (req, res) =>
  res.status(404).json({ message: 'Invalid Requests' })
);

module.exports = app;
