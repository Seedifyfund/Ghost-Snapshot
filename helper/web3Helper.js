const Web3 = require('web3');
const lotteryAbi = require('../abi/lautry.json');
const StakingContract = require('../abi/staking.json');

provider =
  process.env.NODE_ENV === 'development'
    ? `https://bsc-dataseed.binance.org/`
    : `https://bsc-dataseed.binance.org/`;

const web3Helper = {};

web3Helper.getRandomNumber = async (requestNo, noOfAddress, Outof) => {
  try {
    web3 = new Web3(new Web3.providers.HttpProvider(provider));
    const lotteryContract = new web3.eth.Contract(
      lotteryAbi,
      process.env.CONTRACT_ADDRESS
    );

    const getRandomNumbers = await lotteryContract.methods
      .expand(+requestNo, +noOfAddress, +Outof)
      .call();

    return getRandomNumbers;
  } catch (err) {
    console.log('error in contract ', err);
  }
};

web3Helper.getUserStakedBalance = async (walletAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === 'development'
          ? 'https://data-seed-prebsc-1-s1.binance.org:8545/'
          : 'https://data-seed-prebsc-1-s1.binance.org:8545/';

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(
        StakingContract,
        process.env.STAKING_ADDRESS
      );

      const getStakedBalance = await contract.methods
        .stakeOf(walletAddress)
        .call();

      resolve(getStakedBalance);
    } catch (err) {
      console.log('error in web3 data ', err);

      resolve(0);
    }
  });
};

module.exports = web3Helper;
