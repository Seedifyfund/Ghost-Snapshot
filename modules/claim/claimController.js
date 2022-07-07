const ClaimModel = require("./claimModel");
const AddClaimModel = require("./addClaimModel");
const csv = require("csvtojson");
const fs = require("fs");
const web3Helper = require("../../helper/web3Helper");
const momentTz = require("moment-timezone");
const utils = require("../../helper/utils");
const ClaimCtr = {};
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const util = require('util');
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
    if (req.query.isSnft) {
      query.isSnft = true;
    }
    if(req.query.search){
      query['name'] = new RegExp(`${req.query.search}`, 'i') 
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
          if(claim.networkSymbol == "SOL"){
            const wallet = claim.dumpId.uploadData.find(
              (wallet) =>
                req.query.walletAddress ==
                wallet.address
            );
            claim.isInvested = wallet ? wallet.amount : 0;
          }else{
            const wallet = claim.dumpId.uploadData.find(
              (wallet) =>
                req.query.walletAddress.toLowerCase() ==
                wallet.walletAddress.toLowerCase()
            );
            claim.isInvested = wallet ? wallet.eTokens : 0;
          }
          claim.dumpId = {
            _id: claim.dumpId._id,
            transactionHash: claim.dumpId.transactionHash,
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
    var fetchPool;
    if (req.query.csvData) {
      fetchPool = await ClaimModel.findOne({ _id: req.params.id })
        .populate("dumpId", "uploadData")
        .lean();
    } else {
      fetchPool = await ClaimModel.findOne({ _id: req.params.id }).lean();
    }

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
    const claimBeforeUpdt = await ClaimModel.findOne({ _id: req.body.claimId });
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
        message: `${
          req.userData.username ? req.userData.username : req.userData.email
        } Updated claim`,
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
    vestings,
    vestingType,
    startAmount,
    endTime,
    isSnft,
    vestingInfo
  } = req.body;
  const claimDump = await AddClaimModel.findOne({
    phaseNo: phaseNo,
    tokenAddress: tokenAddress.toLowerCase(),
    networkSymbol: networkSymbol.toUpperCase(),
  });
  if(!files){
    return res.status(200).json({
      message: "Please upload csv",
      status: false,
    });
  }
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
  let jsonArray;
  const dumpBody = {
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
    iteration: 0,
    vestingInfo : vestingInfo ? vestingInfo : null,
    prevIgoDate: new Date(),
    vestings:
      vestings && typeof vestings == "string" ? JSON.parse(vestings) : null,
    isSnft: isSnft == true || isSnft == "true" ? true : false,
  }
    if(files.type == "application/json"){
      const readFile = util.promisify(fs.readFile);
      jsonArray = await readFile(files.path, 'utf8')
      jsonArray = JSON.parse(jsonArray)
      dumpBody.uploadData = jsonArray
    }else{
      dumpBody.tokenAddress = dumpBody.tokenAddress.toLowerCase()
      dumpBody.contractAddress = dumpBody.contractAddress.toLowerCase()
      jsonArray = await csv().fromFile(files.path);
      dumpBody.data = jsonArray
    }
    fs.unlink(files.path, () => {
      console.log("remove csv from temp : >> ");
    });
    const addClaim = new AddClaimModel(dumpBody);
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
    if(networkSymbol == "SOL"){
      const body = addClaim.toJSON()
      const dumpId = body._id
      delete body._id
      delete body.createdAt
      delete body.updatedAt
      delete body.__v
      const newClaim = new ClaimModel({
        ...body,
        dumpId : dumpId,
      })
      await newClaim.save()
    }
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: addClaim,
    });

};

ClaimCtr.getClaimDumpList = async (req, res) => {
  try {
    let query = { $or: [{ pendingData: { $ne: [] } }, { data: { $ne: [] } }] };
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    let sort = { createdAt: -1 };
    if (req.query.vestingType == "monthly") {
      query.vestingType = "monthly";
      query["vestings.status"] = { $in: ["upcoming"], $nin: ["pending"] };
      sort = { "vestings.timestamp": -1 };
    }
    if (req.query.vestingType == "linear") {
      query.vestingType = "linear";
    }
    let page = req.query.page ? req.query.page : 1;
    let list = await AddClaimModel.find(query)
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT)
      .sort(sort)
      .lean();

    const totalCount = await AddClaimModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    list = list.map(({ uploadData, data, pendingData, ...rest }) => ({
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
        message: `${
          req.userData.username ? req.userData.username : req.userData.email
        } updated dump record`,
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
ClaimCtr.topupVestings = async (req, res) => {
  try {
    const dump = await AddClaimModel.findOne(
      { _id: req.body.dumpId },
      { uploadData: 0, pendingData: 0, data: 0 }
    );
    const vestingIndex = req.body.vestingIndex;
    const txnHash = req.body.txnHash;
    dump.vestings.forEach((vesting, index) => {
      if (vestingIndex.includes(index) && vesting.status != "pending") {
        vesting.status = "pending";
        vesting.txnHash = txnHash;
      }
    });
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
ClaimCtr.createHexProof = async(req, res)=>{
try{
  const {
    dumpId,
    walletAddress,
    vestingId
  } = req.query
  const dump = await AddClaimModel.findOne({_id : dumpId }).lean()
  const user = dump.uploadData.find((usr) => walletAddress.toLowerCase() == usr.walletAddress.toLowerCase())
  if(!user){
    return res.status(400).json({
      status: false,
      message: "User Not invested for this IGO",
    });
  }
  // const merkleTreeInstance = (userArr) =>{
    //   const leaf = userArr.map((claimToken) => call(claimToken));
    //   const merkleTree = new MerkleTree(leaf, keccak256, { sortPairs: true });
    //   return merkleTree;
    // }
    // const merkleTree = merkleTreeInstance(dump.uploadData)
    
    for (let i = 0; i< dump.vestings.length; i++){
      if(dump.vestings[i]._id == vestingId){
        let leaf = []
        for(let usr of dump.uploadData){
          const newTokens = await web3Helper.getVestingTokens(usr.eTokens, dump.vestings[i].vestingPercent)
          let data = await web3Helper.getSoliditySha3({eTokens : newTokens, walletAddress : usr.walletAddress })
          leaf.push(data)
        }
        const merkleTree = new MerkleTree(leaf, keccak256, { sortPairs: true });
        const eTokens = await web3Helper.getVestingTokens(user.eTokens, dump.vestings[i].vestingPercent)
      console.log('eTokens :>> ', eTokens);
      let hexProof = merkleTree.getHexProof(
        await web3Helper.getSoliditySha3({
          walletAddress,
          eTokens,
        })
      );
      dump.vestings[i].hexProof = hexProof
      }
  }
  return res.status(200).json({
    status: true,
    message : "SUCCESS",
    data: {
      vestings : dump.vestings,
    },
  });
}catch(error){
  return res.status(500).json({
    message: "Something Went Wrong ",
    status: false,
    err: error.message ? error.message : error,
  });
}
}
//cron service
ClaimCtr.checkTransactionStatus = async () => {
  try {
    // console.log("checkTransactionStatus cron called :>> ");$or
    console.log("checkTransactionStatus cron called :>> ");
    const dumpList = await AddClaimModel.find({
      $or: [
        { pendingData: { $ne: [] } },
        { "vestings.status": { $in: ["pending"] } },
      ],
    }).lean();
    console.log("dumpList.length :>> ", dumpList.length);
    dumpList.forEach(async (dump) => {
      console.log("dump._id :>> ", dump._id);
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
              const claim = await ClaimModel.findOne({
                phaseNo: dump.phaseNo,
                tokenAddress: dump.tokenAddress.toLowerCase(),
                networkSymbol: dump.networkSymbol.toUpperCase(),
              });
              if (!claim) {
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
                  vestingType: dump.vestingType,
                  endTime: dump.endTime,
                  startAmount: dump.startAmount,
                  dumpId: dump._id,
                  vestings: dump.vestings,
                  isSnft: dump.isSnft,
                });
                await addNewClaim.save();
              } else {
                claim.vestings = dump.vestings;
                claim.save();
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
      } else if (dump.vestings.length != 0) {
        dump.vestings.forEach(async (vesting) => {
          if (vesting.status === "pending" && vesting.txnHash) {
            const txn = await web3Helper.getTransactionStatus(
              vesting.txnHash,
              dump.networkName
            );
            console.log("txn vesting :>> ", txn);
            if (txn && txn.status == true) {
              console.log("uploaded :>> ");
              vesting.status = "uploaded";
            } else if (txn && txn.status == false) {
              vesting.status = "failed";
            }
            await AddClaimModel.findOneAndUpdate(
              { _id: dump._id },
              { $set: { vestings: dump.vestings } }
            );
            await ClaimModel.findOneAndUpdate(
              { dumpId: dump._id },
              { $set: { vestings: dump.vestings } }
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
    utils.echoLog("error in deleteDumprecord >>  ", error);
  }
};

module.exports = ClaimCtr;
