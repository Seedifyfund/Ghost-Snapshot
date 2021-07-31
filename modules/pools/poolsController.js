const PoolsModel = require('./poolsModel');
const Utils = require('../../helper/utils');
const { find } = require('lodash');
const e = require('express');

const poolCtr = {};

// add new pool
poolCtr.addNewPool = async (req, res) => {
  try {
    const addNewPool = new PoolsModel({
      poolName: req.body.poolName,
      contractAddress: req.body.contractAddress,
      tokenAddress: req.body.tokenAddress,
      loyalityPoints: req.body.loyalityPoints,
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
        findPool.contractAddress = req.body.contractAddress;
      }
      if (req.body.tokenAddress) {
        findPool.tokenAddress = req.body.tokenAddress;
      }

      if (req.body.loyalityPoints) {
        findPool.loyalityPoints = req.body.loyalityPoints;
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

module.exports = poolCtr;
