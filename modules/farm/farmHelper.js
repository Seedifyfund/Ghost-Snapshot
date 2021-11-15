const tokenAbi = require('../../abi/token.json');
const abi = require('../../abi/farm.json');
const Web3 = require('web3');
const farmHelper = {};

farmHelper.checkForDuplicate = async (walletAddress, startBlock, end) => {
  console.log('check for duplicated called =======>');
  return new Promise(async (resolve, reject) => {
    try {
      let start = 12286325;
      const provider = new Web3(
        'https://speedy-nodes-nyc.moralis.io/f2ff35212084cb186b876027/bsc/mainnet/archive'
      );
      const web = new Web3(provider);

      const contract = new web.eth.Contract(
        tokenAbi,
        '0x74fA517715C4ec65EF01d55ad5335f90dce7CC87'
      );
      const farmContract = new web.eth.Contract(
        abi,
        '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0'
      );
      const totalStaked = await farmContract.methods.stakedBalance().call();
      console.log('Staked balance ', web.utils.fromWei(totalStaked));

      const defaultStaus = { status: false, value: 0 };

      const fetchBlocks = async (startBlock, endBlock) => {
        console.log('start block duplicate:', startBlock);
        console.log('end Block  duplicate', endBlock);

        if (startBlock <= end) {
          const result = await contract.getPastEvents('Transfer', {
            filter: {
              from: '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0',
              to: walletAddress,
            },
            fromBlock: startBlock,
            toBlock: endBlock,
          });

          const mapList = await result.map((x) => {
            return [x.returnValues.to, x.blockNumber];
          });

          const test = async (mapList) => {
            console.log('maplist called');
            let i;
            for (i = 0; i < mapList.length; i++) {
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
              const newUserStake = await farmContract.methods
                .userDeposits(userAddress)
                .call(undefined, currentBlock + 1);
              let userAccShare;
              if (i > 0) {
                userAccShare = await farmContract.methods
                  .accShare()
                  .call(undefined, mapList[i - 1][1] - 1);
              } else {
                let key =
                  '0x000000000000000000000000' + userAddress.substr(2, 42);
                let newKey = Web3.utils.soliditySha3(
                  { type: 'bytes32', value: key },
                  { type: 'uint', value: '15' }
                );
                function addHexColor(c1, c2) {
                  var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(
                    16
                  );
                  return hexStr;
                }
                newKey =
                  newKey.substr(0, 63) + addHexColor(newKey.substr(63, 66), 3);

                userAccShare = await web.eth.getStorageAt(
                  '0x7439bCF0B97ecd7f3A11c35Cc2304F01Eaf04fC0',
                  newKey,
                  currentBlock
                );
                userAccShare = parseInt(userAccShare, 16);
              }
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
                console.log(
                  'userstaked amount',
                  userStakedAmount,
                  userAccShare
                );
                let rew = (userStakedAmount * newAccShare) / 1000000 - rewDebt;
                console.log(noOfBlocks, rewards, newAccShare, rewDebt, rew);
                return rew;
              };
              const rew = calculate(
                userAccShare,
                +accShare,
                +lastRewardBlock,
                +currentBlock,
                +stakedBalance,
                userStake[0]
              );

              console.log('newUserStake', newUserStake);
              if (+web.utils.fromWei(newUserStake[0]) > 0) {
                console.log(
                  'Still farming',
                  userAddress,
                  currentBlock,
                  web.utils.fromWei(value),
                  web.utils.fromWei(userStake[0]),
                  web.utils.fromWei(rew.toString()),
                  web.utils.fromWei(newUserStake[0])
                );

                defaultStaus.status = false;
                defaultStaus.value = 0;
                defaultStaus.rewards = '0';
              } else {
                console.log(
                  userAddress,
                  currentBlock,
                  web.utils.fromWei(value),
                  web.utils.fromWei(userStake[0]),
                  web.utils.fromWei(rew.toString()),
                  web.utils.fromWei(newUserStake[0])
                );
                defaultStaus.status = true;
                defaultStaus.value = web.utils.fromWei(value);
                defaultStaus.rewards = rew.toString();
              }

              // return [userAddress, currentBlock, web.utils.fromWei(value), web.utils.fromWei(userStake[0]), web.utils.fromWei(rew.toString())];
            }
          };

          await test(mapList);

          if (endBlock + 1000 >= end) {
            await fetchBlocks(endBlock, end + 1);
          } else {
            fetchBlocks(endBlock, endBlock + 1000);
          }
        } else {
          console.log('IN ELSE STATUS ++++++++++', defaultStaus);
          resolve(defaultStaus);
        }
      };
      fetchBlocks(start, end - start > 1000 ? start + 1000 : end);
    } catch (err) {
      console.log('err in check for duplicate:', err);
      reject(err);
    }
  });
};

module.exports = farmHelper;
