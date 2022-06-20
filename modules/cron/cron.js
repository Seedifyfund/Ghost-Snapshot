const cron = require('node-cron');
const DailyCron = require('./getDailyData');
const UserCtr = require('../kycUsers/userController');
const BlockPassCtr = require('../../modules/blockpass/blockpassCtr');
const ClaimCtr = require('../claim/claimController');
const poolCtr = require('../pools/poolsController');

// cron.schedule('0 */24 * * *', (req, res) => {
//   DailyCron.getContractsData(req, res);
// });

cron.schedule('0 */12 * * *', (req, res) => {
  BlockPassCtr.getApprovedUserList(req, res);
});

// cron.schedule('0 */13 * * *', (req, res) => {
//   UserCtr.getUserBalances(req, res);
// });
cron.schedule('0 0 */23 * * *', (req, res) => {
  ClaimCtr.deleteDumprecords()
});
cron.schedule('0 */2 * * * *', (req, res) => {
    ClaimCtr.checkTransactionStatus()
});
// cron.schedule('0 */5 * * * *', (req, res) => {
//   poolCtr.blockSyncPool()
// });
// cron.schedule('0 13 * * *', (req, res) => {
//   console.log('runnig stk snapshot cron at 13 UTC :>> ');
//   UserCtr.seedStakingSnapshot(req, res)
// });
