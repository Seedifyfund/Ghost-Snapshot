const express = require('express');
global._ = require('lodash');
require('../modules/cron/cron');
require('./database.js');
require('./winston');
const cors = require('cors');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const app = express();

/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

function exitHandler(options) {
  mongoose.connection.close();
  process.exit();
}
process.on('SIGINT', exitHandler.bind(null, { cleanup: true }));

app.set('port', process.env.PORT);
app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '1gb' }));
app.use('/result', express.static('./result'));

var corsOptions = {
  origin: ['snapshot.seedify.fund', 'launchpad.seedify.fund'],
};

app.use(cors());

app.all('/*', (req, res, next) => {
  let origin = req.get('host');

  console.log('origin is:', origin);

  if (corsOptions.origin.indexOf(origin) === -1) {
    return res.status(400).json({
      message: 'Unauthrozed',
    });
  }
  res.header('Access-Control-Allow-Origin', 'https://snapshot.seedify.fund');
  res.header('Access-Control-Request-Headers', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Headers, x-auth-token, Cache-Control, timeout'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(require('../route.js'));

module.exports = app;
