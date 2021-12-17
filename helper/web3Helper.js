const Web3 = require("web3");
const lotteryAbi = require("../abi/lautry.json");
const StakingContract = require("../abi/staking.json");
const FarmingContract = require("../abi/farming.json");
const PanCakeSwapAbi = require("../abi/pancakeswap.json");
const TosdisStakingAbi = require("../abi/tosdisStaking.json");
const TosdisFarmingAbi = require("../abi/tosdisFarming.json");
const ApeFarmingAbi = require("../abi/apeFarming.json");
const sfundAbi = require("../abi/sfund.json");
const Utils = require("../helper/utils");

provider =
  process.env.NODE_ENV === "development"
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
    console.log("error in contract ", err);
  }
};

web3Helper.getUserStakedBalance = async (walletAddress, ContractAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(StakingContract, ContractAddress);

      const getStakedBalance = await contract.methods
        .userDeposits(walletAddress)
        .call();

      resolve(getStakedBalance);
    } catch (err) {
      console.log("error in web3 stacked data ", err);

      resolve(0);
    }
  });
};

web3Helper.getFarmingContractEndDate = async (contractAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
          : "https://data-seed-prebsc-2-s1.binance.org:8545/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(FarmingContract, contractAddress);

      const getEndDate = await contract.methods.stakingEnd().call();
      const startDate = await contract.methods.stakingStart().call();
      const withdrawDate = await contract.methods.withdrawStart().call();

      resolve({
        endDate: getEndDate,
        startDate: startDate,
        withdrawDate: withdrawDate,
      });
    } catch (err) {
      console.log("Error in getting end date", err);

      resolve({ endDate: 0, startDate: 0, withdrawDate: 0 });
    }
  });
};

web3Helper.getUserFarmedBalance = async (walletAddress, ContractAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(FarmingContract, ContractAddress);

      const getStakedBalance = await contract.methods
        .userDeposits(walletAddress)
        .call();

      let harvestedValue = 0;

      const value = Utils.convertToEther(getStakedBalance["0"]);
      // if (value > 0) {
      //   const getSfundHarvested = await contract.methods
      //     .calculate(walletAddress)
      //     .call();

      //   harvestedValue = Utils.convertToEther(getSfundHarvested);
      // }

      resolve({ farm: value, harvest: harvestedValue });
    } catch (err) {
      console.log("error in web3 farming ", err);

      resolve({ farm: 0, harvest: 0 });
    }
  });
};

// pancake swap
web3Helper.getPanCakeSwapFarmBalance = async (walletAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(
        PanCakeSwapAbi,
        "0x73feaa1eE314F8c655E354234017bE2193C9E24E"
      );

      const getStakedBalance = await contract.methods
        .userInfo(450, walletAddress)
        .call();
      // console.log('getStakedBalance', getStakedBalance['amount']);
      const value = Utils.convertToEther(getStakedBalance["amount"]);
      resolve(value);
    } catch (err) {
      resolve(0);
      console.log("error in getPanCakeSwapFarmBalance", err);
    }
  });
};

// tosdis staking
web3Helper.getTosdisStakingBal = async (walletAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(
        TosdisStakingAbi,
        process.env.STAKING_TOSDIS
      );

      const getStakedBalance = await contract.methods
        .getUserInfo(walletAddress)
        .call();

      const value = Utils.convertToEther(getStakedBalance["0"]);
      resolve(value);
    } catch (err) {
      resolve(0);
      console.log("error in getPanCakeSwapFarmBalance", err);
    }
  });
};

// tosdis farming

web3Helper.getTosdisFarmingBal = async (walletAddress, contractAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(TosdisFarmingAbi, contractAddress);

      const getStakedBalance = await contract.methods
        .getUserInfo(walletAddress)
        .call();

      const value = Utils.convertToEther(getStakedBalance["0"]);
      resolve(value);
    } catch (err) {
      console.log("error in farming", err);
      resolve(0);
    }
  });
};

// ape Farming
web3Helper.getApeFarmingBalance = async (walletAddress, contractAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(ApeFarmingAbi, contractAddress);

      const getStakedBalance = await contract.methods
        .userInfo("123", walletAddress)
        .call();
      const value = Utils.convertToEther(getStakedBalance["0"]);
      resolve(value);
    } catch (err) {
      console.log("error in ape farming", err);
      resolve(0);
    }
  });
};

// sfund balance

web3Helper.sfundBalance = async (walletAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(sfundAbi, process.env.SFUND_TOKEN);

      const getStakedBalance = await contract.methods
        .balanceOf(walletAddress)
        .call();

      const value = Utils.convertToEther(getStakedBalance);
      resolve(value);
    } catch (err) {
      console.log("error in farming", err);
      resolve(0);
    }
  });
};

web3Helper.getTosdisStakingBalWithContract = async (
  walletAddress,
  contractAddress
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =
        process.env.NODE_ENV === "development"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";

      const web3 = new Web3(new Web3.providers.HttpProvider(provider));

      const contract = new web3.eth.Contract(TosdisStakingAbi, contractAddress);

      const getStakedBalance = await contract.methods
        .getUserInfo(walletAddress)
        .call();

      const value = Utils.convertToEther(getStakedBalance["0"]);
      resolve(value);
    } catch (err) {
      resolve(0);
      console.log("error in getPanCakeSwapFarmBalance", err);
    }
  });
};

web3Helper.getTransactionStatus = async (transactionHash, networkName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const testNetProvider =
        networkName == "polygon"
          ? "https://rpc-mumbai.maticvigil.com/"
          : networkName == "binance"
          ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
          : "https://data-seed-prebsc-1-s1.binance.org:8545/";
      const mainNetProvider =
        networkName == "polygon"
          ? "https://polygon-rpc.com/"
          : networkName == "binance"
          ? "https://bsc-dataseed.binance.org/"
          : "https://bsc-dataseed.binance.org/";
      const provider =
        process.env.NODE_ENV === "development"
          ? testNetProvider
          : mainNetProvider;
      const web3 = new Web3(new Web3.providers.HttpProvider(provider));
      const trxnReciept = await web3.eth.getTransactionReceipt(transactionHash);
      console.log(
        `trxnReciept.status :>>  ${
          trxnReciept != null ? trxnReciept.status : "null"
        }`
      );

      if (trxnReciept) {
        resolve({
          status: trxnReciept.status,
        });
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(null);
      console.log("error in getTransactionStatus", err);
    }
  });
};
module.exports = web3Helper;
