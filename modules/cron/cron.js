const cron = require('node-cron');
const DailyCron = require('./getDailyData');
const BlockPassCtr = require('../../modules/blockpass/blockpassCtr');

// cron.schedule('0 */24 * * *', (req, res) => {
//   DailyCron.getContractsData(req, res);
// });

// cron.schedule('0 */4 * * *', (req, res) => {
//   BlockPassCtr.getApprovedUserList(req, res);
// });
