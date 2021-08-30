const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const web3Helper = require('../../helper/web3Helper');
// const fs = require('fs');

const syncHelper = {};

syncHelper.getSeddifyContractDetails = async (
  data,
  address,
  endBlock,
  contractType
) => {
  return new Promise((resolve, reject) => {
    try {
      const result = [];
      const blockData = data;

      if (blockData.length) {
        console.log('block data', blockData.length);
        const itreateBlocks = async (i) => {
          console.log('i is:', i);
          if (i < blockData.length) {
            const fromAddress = blockData[i].from.trim();
            // const requiredAddress = fromAddress.substring(
            //   2,
            //   fromAddress.length
            // );

            // // get balance for seedify token

            // const data = {
            //   jsonrpc: '2.0',
            //   method: 'eth_call',
            //   params: [
            //     {
            //       to: address,
            //       data: `0x70a08231000000000000000000000000${requiredAddress}`,
            //     },
            //     `0x${endBlock.toString(16).toUpperCase()}`,
            //   ],
            //   id: 67,
            // };
            // const config = {
            //   method: 'post',
            //   url: 'https://bsc-private-dataseed1.nariox.org',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   data: JSON.stringify(data),
            // };
            // const fetchDetails = await axios(config);

            // if (!fetchDetails.data.error) {
            //   const weiBalance = parseInt(fetchDetails.data.result, 16);
            //   let seedifyBalance = (weiBalance / Math.pow(10, 18)).toFixed(2);

            // if (contractType === "liquidity") {
            //   seedifyBalance *= 20.54;
            // }

            var config = {
              method: 'get',
              url: `https://api.bscscan.com/api?module=account&action=tokenbalancehistory&contractaddress=${address}&address=${fromAddress}&blockno=${endBlock}&apikey=${process.env.BSC_API_KEY}`,
              headers: {},
            };

            const getSfundBal = await axios(config);

            if (getSfundBal.status === 200) {
              const data = getSfundBal.data;

              let seedifyBalance = (+data.result / Math.pow(10, 18)).toFixed(2);

              console.log('sfund balance is:', seedifyBalance);

              result.push({
                address: blockData[i].from.toLowerCase(),
                balance: +seedifyBalance > 0 ? +seedifyBalance : 0,
                tier: await syncHelper.getUserTier(
                  +seedifyBalance > 0 ? +seedifyBalance : 0
                ),
              });
            } else {
              result.push({
                address: blockData[i].from.toLowerCase(),
                balance: 0,
                tier: 'tier0',
              });
            }

            setTimeout(function () {
              itreateBlocks(i + 1);
            }, 1000);
          } else {
            resolve(result);
          }
        };
        itreateBlocks(0);
      } else {
        resolve(result);
      }
    } catch (err) {
      console.log('err is:', err);
      reject(err);
    }
  });
};

syncHelper.getUserTier = (balance) => {
  if (+balance >= 250 && +balance <= 999.999) {
    return 'tier1';
  } else if (+balance >= 1000 && +balance <= 2499.999) {
    return 'tier2';
  } else if (+balance >= 2500 && +balance <= 4999.999) {
    return 'tier3';
  } else if (+balance >= 5000 && +balance <= 7499.999) {
    return 'tier4';
  } else if (+balance >= 7500 && +balance <= 9999.999) {
    return 'tier5';
  } else if (+balance >= 10000 && +balance <= 24999.999) {
    return 'tier6';
  } else if (+balance >= 25000 && +balance <= 49999.999) {
    return 'tier7';
  } else if (+balance >= 50000 && +balance <= 99999.999) {
    return 'tier8';
  } else if (+balance >= 100000) {
    return 'tier9';
  } else {
    return 'tier0';
  }
};

syncHelper.getFarmingDetails = (data, totalSupply, totalBalance) => {
  return new Promise((resolve, reject) => {
    const finalValues = [];
    try {
      if (data.length) {
        for (let i = 0; i < data.length; i++) {
          const address = data[i].topics[1];
          const userAddress = address
            ? `0x${address.substring(26, address.length)}`
            : null;

          const transactionData = data[i].data.substring(2, 66);

          const transactionCount =
            parseInt(transactionData, 16) / Math.pow(10, 18);

          const totalSupplyCount = transactionCount / totalSupply;

          const transaction = totalSupplyCount * totalBalance;

          if (finalValues.length) {
            const checkAddressAvalaible = finalValues.findIndex(
              (x) => x.address === userAddress.toLocaleLowerCase().trim()
            );
            if (checkAddressAvalaible > 0) {
              const balance =
                finalValues[checkAddressAvalaible].balance + transaction;
              finalValues[checkAddressAvalaible].balance = +balance;
              finalValues.tier = syncHelper.getUserTier(+balance);
            } else {
              finalValues.push({
                address: userAddress.toLowerCase(),
                balance: +transaction,
                tier: syncHelper.getUserTier(transaction),
              });
            }
          } else {
            finalValues.push({
              address: userAddress.toLowerCase(),
              balance: +transaction,
              tier: syncHelper.getUserTier(transaction),
            });
          }
        }
        resolve(finalValues);
      } else {
        console.log('IN ELSE');
        resolve(finalValues);
      }
    } catch (err) {
      reject(err);
    }
  });
};

// get seddify balance from start block to end block

syncHelper.getSeedifyBalance = (start, end) => {
  return new Promise(async (resolve, reject) => {
    try {
      const address = '0x477bc8d23c634c154061869478bce96be6045d12';
      const startBlock = 5172421;
      const endBlock = end;

      const finalData = await syncHelper.getDataFromBScScanForSeedify(
        startBlock,
        endBlock,
        address
      );

      let seedifyDataFromBSc = [];

      seedifyDataFromBSc = await syncHelper.getSeddifyContractDetails(
        finalData,
        address,
        endBlock,
        'seedify'
      );

      // let data = JSON.stringify(seedifyDataFromBSc);
      // fs.writeFileSync("./csv/seedify.json", data);

      resolve(seedifyDataFromBSc);

      // Utils.sendEmail(
      //   seedifyDataFromBSc,
      //   `Seedify fund balance from block ${startBlock} to ${endBlock}`,
      //   emailId
      // );
    } catch (err) {
      console.log('error is:', err);
      resolve([]);
      // return res.status(500).send({
      //   message: "Something went wrong",
      //   err: `${err.message}?${err.message}:${null}`,
      //   status: false,
      // });
    }
  });
};

// get liquidity balance

syncHelper.getLiquidityBalance = (start, end) => {
  return new Promise(async (resolve, reject) => {
    try {
      const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';
      const startBlock = 6801618;
      const endBlock = end;

      const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${address}&apikey=${process.env.BSC_API_KEY}`;
      const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${address}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      const url = `${process.env.BSC_API_URL}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${process.env.BSC_API_KEY}`;

      let seedifyDataFromBSc = [];

      const getTotalSupply = await axios.get(getTotalSupplyUrl);
      const getTokenBalance = await axios.get(tokenBalanceUrl);

      const getDataFromBSc = await syncHelper.getDataFromBScScanForLiquidiy(
        startBlock,
        endBlock,
        address
      );

      seedifyDataFromBSc = await syncHelper.getSeddifyContractDetails(
        getDataFromBSc,
        address,
        endBlock,
        'liquidity'
      );

      if (seedifyDataFromBSc.length) {
        const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
        const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

        const itreateSeedifyBalance = (i) => {
          if (i < seedifyDataFromBSc.length) {
            const transactionCount =
              seedifyDataFromBSc[i].balance / tokenSupply;
            const total = transactionCount * tokenBalance;
            // seedifyDataFromBSc[i].liquidity = seedifyDataFromBSc[i].balance;
            seedifyDataFromBSc[i].balance = total;
            seedifyDataFromBSc[i].tier = syncHelper.getUserTier(total);
            itreateSeedifyBalance(i + 1);
          } else {
            // save it to json file
            // let data = JSON.stringify(seedifyDataFromBSc);
            // fs.writeFileSync("./csv/liquidity.json", data);
            resolve(seedifyDataFromBSc);
          }
        };
        itreateSeedifyBalance(0);
      } else {
        resolve([]);
      }
    } catch (err) {
      resolve([]);
      // return res.status(500).send({
      //   message: "Something went wrong",
      //   err: `${err.message}?${err.message}:${null}`,
      //   status: false,
      // });
    }
  });
};

// farming contract

syncHelper.getFarmingBalance = (start, end) => {
  console.log('get farmig called');
  return new Promise(async (resolve, reject) => {
    try {
      const address = process.env.FARMING_ADDRESS;
      const liquidityAddress = process.env.LIQUIDITY_ADDRESS;
      const startBlock = +process.env.FARMING_BLOCK;
      const endBlock = end;

      //api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=0x33338c4fdb9a4a18c5c280c30338acda1b244425&apikey=YourApiKeyToken

      const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${liquidityAddress}&apikey=${process.env.BSC_API_KEY}`;
      const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${liquidityAddress}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      // const url = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0xdd2a19c3bdd089cbe77c04f5655f83de0504d6140d12c8667646f55d0557c4dc&sort=desc&apikey=${process.env.BSC_API_KEY}`;
      // const farmingUrl = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0x933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef&sort=desc&apikey=${process.env.BSC_API_KEY}`;

      const getTotalSupply = await axios.get(getTotalSupplyUrl);
      const getTokenBalance = await axios.get(tokenBalanceUrl);
      const farmingData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        true
      );

      const withdrawData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        false
      );

      const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
      const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

      const getFarmingData = await syncHelper.getFarmingDetails(
        farmingData,
        tokenSupply,
        tokenBalance
      );
      const getwithDrawnData = await syncHelper.getFarmingDetails(
        withdrawData,
        tokenSupply,
        tokenBalance
      );

      if (getwithDrawnData.length) {
        for (let i = 0; i < getwithDrawnData.length; i++) {
          const checkAddress = getFarmingData.findIndex(
            (x) =>
              x.address ===
              getwithDrawnData[i].address.toLocaleLowerCase().trim()
          );

          if (checkAddress >= 0) {
            getFarmingData[checkAddress].balance -= getwithDrawnData[i].balance;
          }
        }

        for (let j = 0; j < getFarmingData.length; j++) {
          getFarmingData[j].tier = syncHelper.getUserTier(
            getFarmingData[j].balance
          );
        }
      }

      resolve(getFarmingData);

      // return res.status(200).send({
      //   data: getFarmingData,
      //   message: "farming contract details",
      //   status: true,
      // });
    } catch (err) {
      console.log('err is:', err);
      resolve([]);
    }
  });
};

syncHelper.getDataFromBScScanForSeedify = (startBlock, endBlock, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      let start = startBlock;
      let end = endBlock;

      console.log('start is:', start, end);

      const finalData = [];

      const getResults = async (i) => {
        console.log('I is', i);
        const url = `${process.env.BSC_API_URL}?module=account&action=txlist&address=${address}&startblock=${start}&endblock=${end}&sort=desc&apikey=${process.env.BSC_API_KEY}`;

        const getResult = await axios.get(url);
        if (getResult.status === 200) {
          const seedifyData = getResult.data.result;

          if (seedifyData.length) {
            finalData.push(...seedifyData);

            if (
              seedifyData.length >= 10000 &&
              seedifyData[seedifyData.length - 1].blockNumber + 1 > startBlock
            ) {
              start = startBlock;
              end = seedifyData[seedifyData.length - 1].blockNumber;

              console.log('start and end is:', start, end);
              getResults(i + 1);
            } else {
              // console.log("final data is:", _.uniq(finalData, "from"));

              const dedupThings = Array.from(
                finalData.reduce((m, t) => m.set(t.from, t), new Map()).values()
              );

              resolve(dedupThings);
            }
          } else {
            resolve(finalData);
          }
        } else {
          resolve([]);
        }
      };
      getResults(0);
    } catch (err) {
      resolve([]);
    }
  });
};

syncHelper.getDataFromBScScanForLiquidiy = (startBlock, endBlock, address) => {
  return new Promise(async (resolve, reject) => {
    try {
      let start = startBlock;
      let end = endBlock;
      const finalData = [];

      const getResults = async (i) => {
        const url = `${process.env.BSC_API_URL}?module=account&action=txlist&address=${address}&startblock=${start}&endblock=${end}&sort=desc&apikey=${process.env.BSC_API_KEY}`;

        const getResult = await axios.get(url);
        if (getResult.status === 200) {
          const seedifyData = getResult.data.result;

          if (seedifyData.length) {
            finalData.push(...finalData, ...seedifyData);

            if (
              seedifyData.length >= 10000 &&
              seedifyData[seedifyData.length - 1].blockNumber + 1 > startBlock
            ) {
              start = startBlock;
              end = seedifyData[seedifyData.length - 1].blockNumber;
              getResults(i + 1);
            } else {
              const dedupThings = Array.from(
                finalData.reduce((m, t) => m.set(t.from, t), new Map()).values()
              );

              resolve(dedupThings);
            }
          } else {
            resolve(finalData);
          }
        } else {
          resolve([]);
        }
      };
      getResults(0);
    } catch (err) {
      resolve([]);
    }
  });
};

syncHelper.getDataFromBScScanForFarming = (
  startBlock,
  endBlock,
  address,
  status
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let start = startBlock;
      let end = endBlock;
      const finalData = [];

      const getResults = async (i) => {
        const url = status
          ? `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${start}&toBlock=${end}&topic0=0x6363655a3c7ace10eb7a32098436bd120788e6c01329bb863799624f11b575f3&sort=desc&apikey=${process.env.BSC_API_KEY}`
          : `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${start}&toBlock=${end}&topic0=0x933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef&sort=desc&apikey=${process.env.BSC_API_KEY}`;

        const getResult = await axios.get(url);

        if (getResult.status === 200) {
          const seedifyData = getResult.data.result;

          if (seedifyData.length) {
            finalData.push(...finalData, ...seedifyData);

            if (
              seedifyData.length >= 1000 &&
              parseInt(seedifyData[seedifyData.length - 1].blockNumber, 16) +
                1 <
                endBlock
            ) {
              start =
                parseInt(seedifyData[seedifyData.length - 1].blockNumber, 16) +
                1;
              // end = parseInt(seedifyData[0].blockNumber, 16) + 1;
              // getResults(i + 1);

              end = endBlock;

              getResults(i + 1);
            } else {
              resolve(_.uniq(finalData, 'from'));
            }
          } else {
            resolve(_.uniq(finalData, 'from'));
          }
        } else {
          resolve([]);
        }
      };
      getResults(0);
    } catch (err) {
      console.log('error is:', err);
      resolve([]);
    }
  });
};

syncHelper.getBakeryFarmBalance = (start, end) => {
  return new Promise(async (resolve, reject) => {
    try {
      const address = process.env.FARMING_BAKERY;
      const liquidityAddress = process.env.LIQUIDITY_ADDRESS;
      const startBlock = process.env.FARMING_BAKERY_BLOCK;
      const endBlock = end;

      //api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=0x33338c4fdb9a4a18c5c280c30338acda1b244425&apikey=YourApiKeyToken

      const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${liquidityAddress}&apikey=${process.env.BSC_API_KEY}`;
      const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${liquidityAddress}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      // const url = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0xdd2a19c3bdd089cbe77c04f5655f83de0504d6140d12c8667646f55d0557c4dc&sort=desc&apikey=${process.env.BSC_API_KEY}`;
      // const farmingUrl = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0x933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef&sort=desc&apikey=${process.env.BSC_API_KEY}`;

      const getTotalSupply = await axios.get(getTotalSupplyUrl);
      const getTokenBalance = await axios.get(tokenBalanceUrl);
      const farmingData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        true
      );
      const withdrawData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        false
      );

      const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
      const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

      const getFarmingData = await syncHelper.getFarmingDetails(
        farmingData,
        tokenSupply,
        tokenBalance
      );
      const getwithDrawnData = await syncHelper.getFarmingDetails(
        withdrawData,
        tokenSupply,
        tokenBalance
      );

      if (getwithDrawnData.length) {
        for (let i = 0; i < getwithDrawnData.length; i++) {
          const checkAddress = getFarmingData.findIndex(
            (x) =>
              x.address ===
              getwithDrawnData[i].address.toLocaleLowerCase().trim()
          );

          if (checkAddress >= 0) {
            getFarmingData[checkAddress].balance -= getwithDrawnData[i].balance;
          }
        }

        for (let j = 0; j < getFarmingData.length; j++) {
          getFarmingData[j].tier = syncHelper.getUserTier(
            getFarmingData[j].balance
          );
        }
      }

      resolve(getFarmingData);

      // return res.status(200).send({
      //   data: getFarmingData,
      //   message: "farming contract details",
      //   status: true,
      // });
    } catch (err) {
      resolve([]);
    }
  });
};

// get toshdish details

syncHelper.getToshDishDetails = (data, status) => {
  try {
    return new Promise((resolve, reject) => {
      const finalValues = [];
      try {
        if (data.length) {
          // get data  length
          for (let i = 0; i < data.length; i++) {
            const address = data[i].topics[1];
            const userAddress = address
              ? `0x${address.substring(26, address.length)}`
              : null;
            const transactionData = data[i].data.substring(2, 66);
            let rewards = 0;
            const lastChar = data[i].data.substring(data[i].data.length - 1);

            if (+lastChar === 1 && status) {
              const rewardsData = data[i].data.substring(2, 130);
              rewards = parseInt(rewardsData, 16) / Math.pow(10, 18);
            }

            const transaction =
              parseInt(transactionData, 16) / Math.pow(10, 18);

            const totalBal = transaction ? +transaction + +rewards : rewards;

            if (finalValues.length) {
              const checkAddressAvalaible = finalValues.findIndex(
                (x) => x.address === userAddress.toLocaleLowerCase().trim()
              );
              if (checkAddressAvalaible >= 0) {
                const balance =
                  +finalValues[checkAddressAvalaible].balance + +totalBal;
                finalValues[checkAddressAvalaible].balance += totalBal;
                // finalValues['rewards'] += rewards;
                finalValues.tier = syncHelper.getUserTier(+balance);
                // itreateBlocks(i + 1);
              } else {
                finalValues.push({
                  address: userAddress.toLowerCase(),
                  balance: totalBal,
                  // rewards: rewards,
                  tier: syncHelper.getUserTier(transaction),
                });
                // itreateBlocks(i + 1);
              }
            } else {
              finalValues.push({
                address: userAddress.toLowerCase(),
                balance: totalBal,
                // rewards: rewards,
                tier: syncHelper.getUserTier(transaction),
              });
              // itreateBlocks(i + 1);
            }
          }

          resolve(finalValues);
          // const itreateBlocks = (i) => {
          //   if (i < data.length) {
          //     const address = data[i].topics[1];
          //     const userAddress = address
          //       ? `0x${address.substring(26, address.length)}`
          //       : null;
          //     const transactionData = data[i].data.substring(2, 66);
          //     let rewards = 0;
          //     const lastChar = data[i].data.substring(data[i].data.length - 1);

          //     if (+lastChar === 1 && status) {
          //       const rewardsData = data[i].data.substring(2, 130);
          //       rewards = parseInt(rewardsData, 16) / Math.pow(10, 18);
          //     }

          //     const transaction =
          //       parseInt(transactionData, 16) / Math.pow(10, 18);

          //     const totalBal = transaction ? +transaction + +rewards : rewards;

          //     if (finalValues.length) {
          //       const checkAddressAvalaible = finalValues.findIndex(
          //         (x) => x.address === userAddress.toLocaleLowerCase().trim()
          //       );
          //       if (checkAddressAvalaible >= 0) {
          //         const balance =
          //           +finalValues[checkAddressAvalaible].balance + +totalBal;
          //         finalValues[checkAddressAvalaible].balance += totalBal;
          //         // finalValues['rewards'] += rewards;
          //         finalValues.tier = syncHelper.getUserTier(+balance);
          //         itreateBlocks(i + 1);
          //       } else {
          //         finalValues.push({
          //           address: userAddress.toLowerCase(),
          //           balance: totalBal,
          //           // rewards: rewards,
          //           tier: syncHelper.getUserTier(transaction),
          //         });
          //         itreateBlocks(i + 1);
          //       }
          //     } else {
          //       finalValues.push({
          //         address: userAddress.toLowerCase(),
          //         balance: totalBal,
          //         // rewards: rewards,
          //         tier: syncHelper.getUserTier(transaction),
          //       });
          //       itreateBlocks(i + 1);
          //     }
          //   } else {
          //     resolve(finalValues);
          //   }
          // };
          // itreateBlocks(0);
        } else {
          resolve(finalValues);
        }
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {}
};

// get tosh Dish

syncHelper.getToshFarmBalance = async (start, end) => {
  try {
    return new Promise(async (resolve, reject) => {
      const address = process.env.STAKING_TOSDIS;
      const startBlock = +process.env.STAKING_TOSDIS_BLOCK;
      const endBlock = +end;

      const farmingData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        true
      );

      const withdrawData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        false
      );

      const getFarmingData = await syncHelper.getToshDishDetails(
        farmingData,
        true
      );

      const getwithDrawnData = await syncHelper.getToshDishDetails(
        withdrawData,
        false
      );

      if (getwithDrawnData.length) {
        for (let i = 0; i < getwithDrawnData.length; i++) {
          const checkAddress = getFarmingData.findIndex(
            (x) =>
              x.address.toLowerCase().trim() ===
              getwithDrawnData[i].address.toLocaleLowerCase().trim()
          );

          if (checkAddress >= 0) {
            const farmingBalance = +getFarmingData[checkAddress].balance
              ? +getFarmingData[checkAddress].balance
              : 0;
            const withDrawnBalance = +getwithDrawnData[i].balance
              ? +getwithDrawnData[i].balance
              : 0;
            const balance = farmingBalance - withDrawnBalance;
            getFarmingData[checkAddress].balance = balance ? balance : 0;
            getFarmingData.tier = await syncHelper.getUserTier(balance);
          }
        }

        for (let j = 0; j < getFarmingData.length; j++) {
          getFarmingData[j].tier = syncHelper.getUserTier(
            getFarmingData[j].balance
          );
        }
      }

      resolve(getFarmingData);
    });
  } catch (err) {
    resolve([]);
  }
};

syncHelper.slpBalance = (start, end) => {
  console.log('SLP FUNCTION CALLED ===>');
  return new Promise(async (resolve, reject) => {
    try {
      const address = process.env.FARMING_SLP;
      const liquidityAddress = process.env.LIQUIDITY_ADDRESS;
      const startBlock = +process.env.FARMING_SLP_BLOCK;
      const endBlock = end;

      //api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=0x33338c4fdb9a4a18c5c280c30338acda1b244425&apikey=YourApiKeyToken

      const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${liquidityAddress}&apikey=${process.env.BSC_API_KEY}`;
      const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${liquidityAddress}&tag=latest&apikey=${process.env.BSC_API_KEY}`;
      // const url = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0xdd2a19c3bdd089cbe77c04f5655f83de0504d6140d12c8667646f55d0557c4dc&sort=desc&apikey=${process.env.BSC_API_KEY}`;
      // const farmingUrl = `${process.env.BSC_API_URL}?module=logs&action=getLogs&address=${address}&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0x933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef&sort=desc&apikey=${process.env.BSC_API_KEY}`;

      const getTotalSupply = await axios.get(getTotalSupplyUrl);
      const getTokenBalance = await axios.get(tokenBalanceUrl);
      const farmingData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        true
      );
      const withdrawData = await syncHelper.getDataFromBScScanForFarming(
        startBlock,
        endBlock,
        address,
        false
      );

      const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
      const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

      const getFarmingData = await syncHelper.getFarmingDetails(
        farmingData,
        tokenSupply,
        tokenBalance
      );
      const getwithDrawnData = await syncHelper.getFarmingDetails(
        withdrawData,
        tokenSupply,
        tokenBalance
      );

      if (getwithDrawnData.length) {
        for (let i = 0; i < getwithDrawnData.length; i++) {
          const checkAddress = getFarmingData.findIndex(
            (x) =>
              x.address ===
              getwithDrawnData[i].address.toLocaleLowerCase().trim()
          );

          if (checkAddress >= 0) {
            getFarmingData[checkAddress].balance -= getwithDrawnData[i].balance;
          }
        }

        for (let j = 0; j < getFarmingData.length; j++) {
          getFarmingData[j].tier = syncHelper.getUserTier(
            getFarmingData[j].balance
          );
        }
      }

      resolve(getFarmingData);

      // return res.status(200).send({
      //   data: getFarmingData,
      //   message: "farming contract details",
      //   status: true,
      // });
    } catch (err) {
      resolve([]);
    }
  });
};

// syncHelper.getTosdisStakingBalance = async (walletAddress) => {

//   try {
//     const fetchStakedBalance = await web3Helper.getTosdisStakingBal(
//       walletAddress
//     );

//   } catch (err) {}
// };

module.exports = syncHelper;
