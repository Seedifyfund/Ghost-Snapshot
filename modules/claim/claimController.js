const ClaimModel = require("./claimModel");
const AddClaimModel = require("./addClaimModel");
const csv = require("csvtojson");
const fs = require("fs");
const web3Helper = require("../../helper/web3Helper");
const momentTz = require("moment-timezone");
const utils = require("../../helper/utils");
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
    let page = req.query.page ? req.query.page : 1;
    query.isSnft = { $ne: true };
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    if (req.query.isDisabledBit) {
      query.isDisabledBit = { $ne: true };
    }
    if (req.query.vestingType) {
      query.vestingType = { $in: req.query.vestingType };
    }
    if(req.query.isSnft){
      query.isSnft = true;
    }
    let list;
    if (req.query.walletAddress) {
      list = await ClaimModel.find(query)
        .populate("dumpId", "uploadData transactionHash")
        .skip((+page - 1 || 0) * +process.env.LIMIT)
        .limit(+process.env.LIMIT)
        .sort({ createdAt: -1 })
        .lean();
      list.forEach((claim) => {
        if (claim.dumpId && claim.dumpId.uploadData.length) {
          const wallet = claim.dumpId.uploadData.find(
            (wallet) => req.query.walletAddress.toLowerCase() == wallet.walletAddress.toLowerCase()
          );
          claim.isInvested = wallet ? true : false;
          claim.dumpId = {
            _id : claim.dumpId._id,
            transactionHash : claim.dumpId.transactionHash
          };
        }
      });
    } else {
      list = await ClaimModel.find(query)
        .populate("dumpId", "transactionHash")
        .skip((+page - 1 || 0) * +process.env.LIMIT)
        .limit(+process.env.LIMIT)
        .sort({ createdAt: -1 })
        .lean();
    }
    const totalCount = await ClaimModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: list,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};


// claim pool list for single user 
ClaimCtr.usersPoolList = async(req, res)=>{
  try {
    let page = req.query.page ? req.query.page : 1;
    const walletAddress = req.query.walletAddress
    let query = {
      "uploadData.walletAddress" : walletAddress
    };
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    let list;
    list = await AddClaimModel.find(query, { _id : 1})
    .skip((+page - 1 || 0) * +process.env.LIMIT)
    .limit(+process.env.LIMIT)
    .sort({ createdAt: -1 })
    .lean();
    list =  await ClaimModel.find({dumpId : {$in : list.map((id)=>id)}})
    .populate("dumpId", "uploadData")
    .sort({createdAt : -1})
    .lean();
  list.forEach((claim) => {
    if (claim.dumpId && claim.dumpId.uploadData.length) {
      const wallet = claim.dumpId.uploadData.find(
        (wallet) => req.query.walletAddress.toLowerCase() == wallet.walletAddress.toLowerCase()
      );
      claim.isInvested = wallet ? true : false;
      claim.allocation = +wallet.eTokens
      delete claim.dumpId
    }
  });
    const totalCount = await AddClaimModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: list,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
}

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
ClaimCtr.editClaim = async (req, res) => {
  try {
    const claimBeforeUpdt = await ClaimModel.findOne({_id: req.body.claimId })
    const claim = await ClaimModel.findOneAndUpdate(
      { _id: req.body.claimId },
      { $set: req.body },
      { new: true }
    );
    if (claimBeforeUpdt && typeof claimBeforeUpdt.log === "function") {
      console.log("req.userData._id :>> " + req.userData._id);
      const data = {
        action: "update-claim",
        category: "claim/edit",
        createdBy: req.userData._id,
        message: `${req.userData.username ? req.userData.username : req.userData.email} Updated claim`,
      };
      claimBeforeUpdt.log(data);
    }
    return res.status(200).json({
      status: "SUCCESS",
      data: claim,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong ",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

ClaimCtr.addClaimDump = async (req, res) => {
  const files = req.files.csv;
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
    vestingType,
    startAmount,
    endTime,
    isSnft,
  } = req.body;
  const claimDump = await AddClaimModel.findOne({
    phaseNo: phaseNo,
    tokenAddress: tokenAddress.toLowerCase(),
    networkSymbol: networkSymbol.toUpperCase(),
  });
  if (claimDump) {
    if (files) {
      fs.unlink(files.path, () => {
        console.log("remove csv from temp : >> ");
      });
    }
    return res.status(200).json({
      message: "Please complete the pending Claim first",
      status: false,
    });
  }
  if (files) {
    const jsonArray = await csv().fromFile(files.path);
    fs.unlink(files.path, () => {
      console.log("remove csv from temp : >> ");
    });
    const iterationCount = Math.ceil(jsonArray.length / 600);
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
      vestingType,
      startAmount,
      endTime,
      data: jsonArray,
      iteration: 0,
      totalIterationCount: iterationCount,
      isSnft: (isSnft == true || isSnft == 'true') ? true : false,
    });
    if (addClaim && typeof addClaim.log === "function") {
      console.log("req.userData._id :>> " + req.userData._id);
      const data = {
        action: "create-dump",
        category: "claim/add-dump",
        createdBy: req.userData._id,
        message: `Claim record created for ${addClaim.name} IGO`,
      };
      addClaim.log(data);
    }
    await addClaim.save();
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: addClaim,
    });
  } else {
    return res.status(200).json({
      message: "Please upload csv",
      status: false,
    });
  }
};

ClaimCtr.getClaimDumpList = async (req, res) => {
  try {
    let query = {$or : [{pendingData: { $ne: [] }}, {data: { $ne: [] }}]};
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    let page = req.query.page ? req.query.page : 1;
    let list = await AddClaimModel.find(query)
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT)
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = await AddClaimModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    list = list.map(({uploadData, data, pendingData, ...rest}) => ({
      ...rest,
      uploadData : uploadData && uploadData.length ? uploadData.length : 0,
      pendingData : pendingData &&  pendingData.length ? pendingData.length : 0,
      data : data && data.length ? data.length : 0,
    }))
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: list,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
ClaimCtr.getClaimDump = async (req, res) => {
  try {
    const dump = await AddClaimModel.findOne({ _id: req.params.dumpId });
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: dump,
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
ClaimCtr.updateDump = async (req, res) => {
  const { transactionHash, dumpId, numberOfRecords } = req.body;
  try {
    const dump = await AddClaimModel.findOne({ _id: dumpId });
    if (dump.transactionHash.includes(transactionHash)) {
      return res.status(200).json({
        message: "Transaction hash is already updated",
        status: true,
      });
    }
    dump.transactionHash.push(transactionHash);
    dump.iteration = dump.iteration + 1;
    const claimData = dump.data.splice(0, numberOfRecords);
    dump.pendingData.push({
      data: claimData,
      transactionHash: transactionHash,
    });
    if (dump && typeof dump.log === "function") {
      console.log("req.userData._id :>> " + req.userData._id);
      const data = {
        action: "update-dump",
        category: "claim/update-dump",
        createdBy: req.userData._id,
        message: `${req.userData.username ? req.userData.username : req.userData.email} updated dump record`,
      };
      dump.log(data);
    }
    dump.save();
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: dump,
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
// edit dump(claim) records 
ClaimCtr.editDump = async (req, res) => {
  try {
    const dump = await AddClaimModel.findOne({ _id: req.body.dumpId });
    dump.isDisabledBit = req.body.isDisabledBit;
    const claim = await ClaimModel.findOneAndUpdate(
      { dumpId: dump._id },
      { isDisabledBit: req.body.isDisabledBit }
    );
    dump.save();
    return res.status(200).json({
      status: "SUCCESS",
      data: dump,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong ",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
//cron service
ClaimCtr.checkTransactionStatus = async () => {
  try {
    console.log("checkTransactionStatus cron called :>> ");
    const dumpList = await AddClaimModel.find({ pendingData: { $ne: [] } });
    dumpList.forEach((dump) => {
      console.log('dump._id :>> ', dump._id);
      if (dump.pendingData.length != 0) {
        dump.pendingData.forEach(async (pendingData) => {
          const txn = await web3Helper.getTransactionStatus(
            pendingData.transactionHash,
            dump.networkName
          );
          console.log("txn :>> ", txn);
          if (txn && txn.status == true) {
            dump.pendingData = dump.pendingData.filter(
              (dt) => dt.transactionHash != pendingData.transactionHash
            );
            dump.uploadData = dump.uploadData.concat(pendingData.data);
            if (dump.data.length == 0 && dump.pendingData.length == 0) {
              const checkClaimAlreadyAdded = await ClaimModel.findOne({
                phaseNo: dump.phaseNo,
                tokenAddress: dump.tokenAddress.toLowerCase(),
                networkSymbol: dump.networkSymbol.toUpperCase(),
              });
              if (!checkClaimAlreadyAdded) {
                const addNewClaim = new ClaimModel({
                  tokenAddress: dump.tokenAddress,
                  contractAddress: dump.contractAddress,
                  networkName: dump.networkName,
                  networkSymbol: dump.networkSymbol,
                  networkId: dump.networkId,
                  amount: dump.amount,
                  name: dump.name,
                  timestamp: dump.timestamp,
                  phaseNo: dump.phaseNo,
                  logo: dump.logo,
                  vestingType : dump.vestingType,
                  endTime : dump.endTime,
                  startAmount : dump.startAmount,
                  dumpId: dump._id,
                  isSnft: dump.isSnft,
                });
                await addNewClaim.save();
              }
            }
            await AddClaimModel.findOneAndUpdate(
              { _id: dump._id },
              {
                $set: {
                  pendingData: dump.pendingData,
                  uploadData: dump.uploadData,
                },
              }
            );
          } else if (txn && txn.status == false) {
            dump.pendingData = dump.pendingData.filter(
              (dt) => dt.transactionHash != pendingData.transactionHash
            );
            dump.data = dump.data.concat(pendingData.data);
            await AddClaimModel.findOneAndUpdate(
              { _id: dump._id },
              { $set: { pendingData: dump.pendingData, data: dump.data } }
            );
          }
        });
      }
    });
  } catch (error) {
    utils.echoLog('error in checkTransactionStatus cron  ', error.message);
  }
};
// cron service for deleting dump records
ClaimCtr.deleteDumprecords = async () => {
  try {
    const currentDate = momentTz.utc().subtract(24, "hours").format();
    console.log("deleteDumprecords cron called :>> ");
    const dumpList1 = await AddClaimModel.find({
      transactionHash: [],
      updatedAt: { $lte: currentDate },
    });
    dumpList1.forEach(async (dump) => {
      await AddClaimModel.findOneAndDelete({ _id: dump._id });
    });
  } catch (error) {
    utils.echoLog('error in deleteDumprecord >>  ', err);
  }
};


module.exports = ClaimCtr;
