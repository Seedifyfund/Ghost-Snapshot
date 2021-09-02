const cron = require('node-cron');
const DailyCron = require('./getDailyData');
const UserCtr = require('../kycUsers/userController');
const BlockPassCtr = require('../../modules/blockpass/blockpassCtr');

// cron.schedule('0 */24 * * *', (req, res) => {
//   DailyCron.getContractsData(req, res);
// });

cron.schedule('0 */1 * * *', (req, res) => {
  BlockPassCtr.getApprovedUserList(req, res);
});

cron.schedule('0 */12 * * *', (req, res) => {
  UserCtr.getUserBalances(req, res);
});
