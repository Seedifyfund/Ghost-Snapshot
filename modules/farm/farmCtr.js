const tokenAbi = require('../../abi/token.json');
const farmAbi = require('../../abi/farm.json');
const blockModel = require('./blockModel');
const farmHelper = require('./farmHelper');
const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const Utils = require('../../helper/utils');
const Web3 = require('web3');

const farmCtr = {};

farmCtr.getUserBalances = async (req, res) => {
  try {
    const provider = new Web3(
      'wss://speedy-nodes-nyc.moralis.io/567b6463b65baa3b72794aa0/bsc/mainnet/archive/ws'
    );
    const web = new Web3(provider);

    const contract = new web.eth.Contract(
      tokenAbi,
      '0x74fA517715C4ec65EF01d55ad5335f90dce7CC87'
    );

    const farmContract = new web.eth.Contract(
      farmAbi,
      '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0'
    );
    const totalStaked = await farmContract.methods.stakedBalance().call();
    console.log('Staked balance ', web.utils.fromWei(totalStaked));

    const fetchBlock = await blockModel.findOne({});

    const getLatestBlockNoUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=CWZ1A15GW1ANBXEKUUE32Z2V2F4U1Q6TVA`;
    const getLatestBlock = await axios.get(getLatestBlockNoUrl);
    // const latestBlock = parseInt(getLatestBlock.data.result, 16);
    // const latestBlock = 12372725;

    const latestBlock = 12689525;

    console.log('latestBlock', latestBlock);
    const farmUsers = [];
    const unfarmedUsers = [];

    const initialBlockNo = 12610926;

    const fetchBlocks = async (startBlock, endBlock) => {
      console.log('start block is:', startBlock);
      console.log('end Block is', endBlock);

      if (startBlock <= latestBlock) {
        const result = await contract.getPastEvents('Transfer', {
          filter: {
            from: '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0', //,
            // to: "0x8c8Ea652DE618a30348dCce6df70C8d2925E6814"
          },
          fromBlock: startBlock,
          toBlock: endBlock,
        });

        const filteredList = result.filter((x) => {
          if (+web.utils.fromWei(x.returnValues.value) < 14.8) {
            return +web.utils.fromWei(x.returnValues.value);
          }
        });

        const mapList = filteredList.map((x) => {
          return [x.returnValues.to, x.blockNumber];
        });

        for (let i = 0; i < mapList.length; i++) {
          const userAddress = mapList[i][0];
          const currentBlock = mapList[i][1] - 1;

          const value = await farmContract.methods
            .calculate(userAddress)
            .call(undefined, currentBlock);
          const accShare = await farmContract.methods
            .accShare()
            .call(undefined, currentBlock);
          const lastRewardBlock = await farmContract.methods
            .lastRewardBlock()
            .call(undefined, currentBlock);
          const stakedBalance = await farmContract.methods
            .stakedBalance()
            .call(undefined, currentBlock);
          const userStake = await farmContract.methods
            .userDeposits(userAddress)
            .call(undefined, currentBlock);

          let key = '0x000000000000000000000000' + userAddress.substr(2, 42);
          let newKey = Web3.utils.soliditySha3(
            { type: 'bytes32', value: key },
            { type: 'uint', value: '15' }
          );
          function addHexColor(c1, c2) {
            var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
            return hexStr;
          }
          newKey = newKey.substr(0, 63) + addHexColor(newKey.substr(63, 66), 3);

          let userAccShare = await web.eth.getStorageAt(
            '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0',
            newKey,
            currentBlock
          );

          const calculate = (
            userAccShare,
            currentAccShare,
            lastRewardBlock,
            currentBlock,
            stakedBalance,
            userStakedAmount
          ) => {
            let noOfBlocks = currentBlock - lastRewardBlock;
            let rewards = noOfBlocks * 810185185185185185;
            let newAccShare =
              currentAccShare + (rewards * 1000000) / stakedBalance;
            let rewDebt = (userStakedAmount * userAccShare) / 1000000;
            let rew = (userStakedAmount * newAccShare) / 1000000 - rewDebt;
            return rew;
          };

          const rew = calculate(
            parseInt(userAccShare, 16),
            +accShare,
            +lastRewardBlock,
            +currentBlock,
            +stakedBalance,
            userStake[0]
          );
          console.log(
            userAddress,
            currentBlock,
            web.utils.fromWei(value),
            web.utils.fromWei(userStake[0]),
            web.utils.fromWei(rew.toString())
          );

          const farmedBalance = +web.utils.fromWei(value);

          console.log('farmedBalance', farmedBalance);

          const checkBlockAlreadyAdded = farmUsers.findIndex(
            (x) => x.walletAddress === userAddress
          );

          const checkForUnframed = unfarmedUsers.findIndex(
            (x) => x.walletAddress === userAddress
          );

          if (checkBlockAlreadyAdded === -1 && checkForUnframed === -1) {
            farmUsers.push({
              walletAddress: userAddress,
              blockNo: currentBlock,
              rewardsFromContract: web.utils.fromWei(value),
              stakedBalance: web.utils.fromWei(userStake[0]),
              rewards: web.utils.fromWei(rew.toString()),
            });
          } else {
            unfarmedUsers.push({
              walletAddress: userAddress,
              blockNo: currentBlock,
              rewardsFromContract: web.utils.fromWei(value),
              stakedBalance: web.utils.fromWei(userStake[0]),
              rewards: web.utils.fromWei(rew.toString()),
            });

            if (checkBlockAlreadyAdded >= 0) {
              const getFarmedDetails = farmUsers[checkBlockAlreadyAdded];
              unfarmedUsers.push(getFarmedDetails);
              farmUsers.splice(checkBlockAlreadyAdded, 1);
            }
          }

          // } else {
          //   const checkForDuplicate = await farmHelper.checkForDuplicate(
          //     userAddress,
          //     currentBlock,
          //     latestBlock
          //   );

          //   console.log('check for updates ====>', checkForDuplicate);

          //   if (checkForDuplicate.status && +checkForDuplicate.value === 0) {
          //     console.log('IN IFFFFFF ========>');
          //     farmUsers[checkBlockAlreadyAdded].rewards =
          //       checkForDuplicate.rewards;
          //   } else {
          //     farmUsers.splice(checkBlockAlreadyAdded, 1);
          //   }
          // }
        }

        if (endBlock + 1000 >= latestBlock) {
          const delay = (ms) =>
            new Promise((resolve) => setTimeout(resolve, ms));
          await delay(5000); /// waiting 5 second.
          await fetchBlocks(endBlock, latestBlock + 1);
        } else {
          const delay = (ms) =>
            new Promise((resolve) => setTimeout(resolve, ms));
          await delay(5000); /// waiting 5 second.
          await fetchBlocks(endBlock, endBlock + 1000);
        }
        // fetchBlocks(endBlock, endBlock + 1000);
      } else {
        console.log('IN ELSE =================>');
        console.log('farm users', farmUsers.length);
        console.log('infarmer users', unfarmedUsers.length);
        const csv = new ObjectsToCsv(farmUsers);
        const fileName = `${+new Date()}_farm`;
        await csv.toDisk(`./lottery/${fileName}.csv`);

        const csvUnfarmed = new ObjectsToCsv(unfarmedUsers);
        const fileNameUnfarmed = `${+new Date()}_unfarm`;
        await csvUnfarmed.toDisk(`./lottery/${fileNameUnfarmed}.csv`);

        // Utils.sendSmapshotEmail(
        //   `./lottery/${fileName}.csv`,
        //   fileName,
        //   `Farming Result at  ${Math.floor(Date.now() / 1000)}   `,
        //   `Farming result from ${initialBlockNo} to ${latestBlock}`
        // );
      }
    };

    fetchBlocks(
      initialBlockNo,
      latestBlock - initialBlockNo > 1000 ? initialBlockNo + 1000 : latestBlock
    );
  } catch (err) {
    console.log('error is:', err);
  }
};

module.exports = farmCtr;

12302945;
