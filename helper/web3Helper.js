const Web3 = require('web3');
const lotteryAbi = require('../abi/lautry.json');

provider =
  process.env.NODE_ENV === 'development'
    ? `https://data-seed-prebsc-1-s1.binance.org:8545/`
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
      .expand(requestNo, noOfAddress, Outof)
      .call();

    console.log('get random numbers ', getRandomNumbers);

    return getRandomNumbers;
  } catch (err) {
    console.log('error in contract ', err);
  }
};

module.exports = web3Helper;
