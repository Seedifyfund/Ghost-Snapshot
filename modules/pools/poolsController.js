const PoolsModel = require('./poolsModel');
const Utils = require('../../helper/utils');
const Web3Helper = require('../../helper/web3Helper');
const poolCtr = {};

// add new pool
poolCtr.addNewPool = async (req, res) => {
  let contractData = {
    endDate: 0,
    startDate: 0,
    withdrawDate: 0,
  };
  if (req.body.contractType === 'farming') {
    contractData = await Web3Helper.getFarmingContractEndDate(
      req.body.contractAddress.trim()
    );
  }

  try {
    const addNewPool = new PoolsModel({
      poolName: req.body.poolName,
      contractAddress: req.body.contractAddress,
      tokenAddress: req.body.tokenAddress,
      loyalityPoints: req.body.loyalityPoints,
      contractType: req.body.contractType,
      endDate: contractData.endDate,
      startDate: contractData.startDate,
      withdrawDate: contractData.withdrawDate,
      lpTokenAddress: req.body.lpTokenAddress,
      url: req.body.url,
    });

    await addNewPool.save();

    return res.status(200).json({
      status: true,
      message: 'Pool Added Sucessfully',
    });
  } catch (err) {
    Utils.echoLog(`Error in adding new Pool`);
    res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

// update exsiting pool
poolCtr.updatePool = async (req, res) => {
  try {
    const findPool = await PoolsModel.findOne({ _id: req.params.poolId });
    if (findPool) {
      if (req.body.poolName) {
        findPool.poolName = req.body.poolName;
      }
      if (req.body.contractAddress) {
        let contractData = {
          endDate: 0,
          startDate: 0,
          withdrawDate: 0,
        };
        if (findPool.contractType === 'farming') {
          contractData = await Web3Helper.getFarmingContractEndDate(
            req.body.contractAddress
          );
        }
        findPool.endDate = contractData.endDate;
        findPool.startDate = contractData.startDate;
        findPool.withdrawDate = contractData.withdrawDate;
        findPool.contractAddress = req.body.contractAddress;
      }
      if (req.body.tokenAddress) {
        findPool.tokenAddress = req.body.tokenAddress;
      }

      if (req.body.lpTokenAddress) {
        findPool.lpTokenAddress = req.body.lpTokenAddress;
      }

      if (req.body.url) {
        findPool.url = req.body.url;
      }

      if (req.body.loyalityPoints) {
        findPool.loyalityPoints = req.body.loyalityPoints;
      }

      if (req.body.contractType) {
        findPool.contractType = req.body.contractType;
      }

      await findPool.save();

      return res.status(200).json({
        status: true,
        message: 'Pool Updated Successfuly',
      });
    } else {
      return res.status(400).json({
        status: false,
        message: 'Invalid Pool Id',
      });
    }
  } catch (err) {
    Utils.echoLog(`Error in adding new Pool`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

// delete existing pools
poolCtr.deleteExistingPools = async (req, res) => {
  try {
    const deletePool = await PoolsModel.deleteOne({
      _id: req.params.poolId,
    });
    if (deletePool) {
      return res.status(200).json({
        status: true,
        message: 'Pool Deleted  Successfuly',
      });
    }
  } catch (err) {
    Utils.echoLog(`Error in deleting  Pool ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

// list pools
poolCtr.listPools = async (req, res) => {
  try {
    const query = {};
    if (req.params.poolId) {
      query._id = req.params.poolId;
    }

    if (req.params.poolId) {
      const listPool = await PoolsModel.findOne(query);

      return res.status(200).json({
        status: true,
        message: 'Pool List',
        data: listPool,
      });
    } else {
      const listPool = await PoolsModel.find(query);
      return res.status(200).json({
        status: true,
        message: 'Pool List',
        data: listPool,
      });
    }
  } catch (err) {
    Utils.echoLog(`Error in listing  Pool ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

// list pools for user
poolCtr.listPoolsForUser = async (req, res) => {
  try {
    const query = {};
    if (req.query.pools) {
      query.contractType = req.query.pools.toLowerCase().trim();
    }

    const listPool = await PoolsModel.find(query);
    return res.status(200).json({
      status: true,
      message: 'Pool List',
      data: listPool,
    });
  } catch (err) {
    Utils.echoLog(`Error in listing  Pool ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

// list farming pools
poolCtr.listFarmingPools = async (req, res) => {
  try {
    let query = {
      contractType: 'farming',
      withdrawDate: { $gte: Math.floor(Date.now() / 1000) },
    };
    if (req.query.status === 'closed') {
      query.withdrawDate = { $lte: Math.floor(Date.now() / 1000) };
    }
    const getPools = await PoolsModel.find(query);

    return res.status(200).json({
      status: true,
      message: 'Pool List',
      data: getPools,
    });
  } catch (err) {
    Utils.echoLog(`Error in listing  Pool ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong ',
      error: err.message ? err.message : err,
    });
  }
};

module.exports = poolCtr;
