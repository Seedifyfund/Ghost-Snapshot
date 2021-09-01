const ClaimModel = require('./claimModel');

const ClaimCtr = {};

ClaimCtr.addNewClaim = async (req, res) => {
  try {
    const {
      tokenAddress,
      networkName,
      networkId,
      networkSymbol,
      amount,
      name,
    } = req.body;
    const addNewClaim = new ClaimModel({
      tokenAddress: tokenAddress,
      networkName: networkName,
      networkSymbol: networkSymbol,
      networkId: networkId,
      amount: amount,
      name: name,
    });

    await addNewClaim.save();

    return res.status(200).json({
      message: 'Claim Added sucessfully',
      status: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'DB_ERROR',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

ClaimCtr.list = async (req, res) => {
  try {
    let query = {};
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    const list = await ClaimModel.find(query);

    return res.status(200).json({
      message: 'SUCCESS',
      status: true,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'DB_ERROR',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = ClaimCtr;