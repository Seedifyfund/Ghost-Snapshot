const ClaimModel = require("./claimModel");
const AddClaimModel = require("./addClaimModel");
const csv = require("csvtojson");
const fs = require("fs");

const ClaimCtr = {};

ClaimCtr.addNewClaim = async (req, res) => {
  try {
    const {
      contractAddress,
      tokenAddress,
      networkName,
      networkId,
      networkSymbol,
      amount,
      name,
      timestamp,
      phaseNo,
      logo,
    } = req.body;

    const checkClaimAlreadyAdded = await ClaimModel.findOne({
      phaseNo: phaseNo,
      tokenAddress: tokenAddress.toLowerCase(),
      networkSymbol: networkSymbol.toUpperCase(),
    });

    if (checkClaimAlreadyAdded) {
      checkClaimAlreadyAdded.amount += +amount;
      // checkClaimAlreadyAdded.timestamp = +timestamp;
      await checkClaimAlreadyAdded.save();

      return res.status(200).json({
        message: "Claim Added sucessfully",
        status: true,
      });
    } else {
      const addNewClaim = new ClaimModel({
        tokenAddress: tokenAddress,
        contractAddress: contractAddress,
        networkName: networkName,
        networkSymbol: networkSymbol,
        networkId: networkId,
        amount: amount,
        name: name,
        timestamp,
        phaseNo,
        logo,
      });

      await addNewClaim.save();

      return res.status(200).json({
        message: "Claim Added sucessfully",
        status: true,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong ",
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
    const list = await ClaimModel.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

ClaimCtr.getSinglePool = async (req, res) => {
  try {
    const id = req.params.id;
    const fetchPool = await ClaimModel.findOne({ _id: req.params.id });

    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: fetchPool,
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
ClaimCtr.addClaimDump = async (req, res) => {
  const files = req.files;
  const {
    contractAddress,
    tokenAddress,
    networkName,
    networkId,
    networkSymbol,
    amount,
    name,
    timestamp,
    phaseNo,
    logo,
    transactionHash,
    _id,
    currentIteration,
  } = req.body;
  const claimDump = await AddClaimModel.findOne({
    phaseNo: phaseNo,
    tokenAddress: tokenAddress.toLowerCase(),
    networkSymbol: networkSymbol.toUpperCase(),
  });
  if (claimDump) {
    return res.status(200).json({
      message: "Please complete the pending Claim first",
      status: false,
    });
  }
  if (req.files.length != 0) {
    const jsonArray = await csv().fromFile(files[0].path);
    fs.unlink(files[0].path, () => {
      console.log("remove from temp : >> ");
    });
    const iterationCount = Math.ceil(jsonArray.length / 600);
    const data = iterationCount > 1 ? jsonArray.slice(0, 600) : jsonArray;
    const addClaim = new AddClaimModel({
      tokenAddress: tokenAddress,
      contractAddress: contractAddress,
      networkName: networkName,
      networkSymbol: networkSymbol,
      networkId: networkId,
      amount: amount,
      name: name,
      timestamp: timestamp,
      phaseNo,
      logo,
      data: jsonArray,
      loops: 1,
    });
    await addClaim.save();
    res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: {
        claimData: data,
        iterationCount: iterationCount,
        _id: addClaim._id,
      },
    });
  } else {
    const claimDump = await AddClaimModel.findOne({
      _id: _id,
    });
    claimDump.transactionHash.push(transactionHash);
    claimDump.loops = claimDump.loops + 1;
    claimDump.save();

    const respData = {
      claimData : claimDump.data.slice(
        600 * (currentIteration - 1),
        currentIteration * 600
      ),
      _id: _id,
    };
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: respData,
    });
  }
};
module.exports = ClaimCtr;
