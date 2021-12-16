const ClaimModel = require("./claimModel");
const AddClaimModel = require("./addClaimModel");
const csv = require("csvtojson");
const fs = require("fs");
const web3Helper = require("../../helper/web3Helper");

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
    let query = { isDisabledBit : { $ne : true } };
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    const list = await ClaimModel.find(query).sort({ createdAt: -1 }).populate("dumpId", 'uploadData').lean();
    if(req.query.walletAddress){
      list.forEach((claim)=>{
        if(claim.dumpId && claim.dumpId.uploadData.length){
          const wallet = claim.dumpId.uploadData.find((wallet)=> req.query.walletAddress == wallet.walletAddress)
          claim.isInvested = wallet ? true : false
          claim.dumpId = claim.dumpId._id
        }

      })
    }     
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
ClaimCtr.editClaim = async (req, res) =>{
  try{
    const claim = await ClaimModel.findOne({_id : req.body.claimId});
    claim.logo = req.body.logo ? req.body.logo : claim.logo
    claim.name = req.body.name ? req.body.name : claim.name
    claim.save();
    return  res.status(200).json({
      status : "SUCCESS",
      data : claim
    })
  }catch(err){
    return res.status(500).json({
      message: "Something Went Wrong ",
      status: true,
      err: err.message ? err.message : err,
    });
  }
}

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
  } = req.body;
  const claimDump = await AddClaimModel.findOne({
    phaseNo: phaseNo,
    tokenAddress: tokenAddress.toLowerCase(),
    networkSymbol: networkSymbol.toUpperCase(),
  });
  if (claimDump) {
    if(files){
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
      data: jsonArray,
      iteration: 0,
      totalIterationCount : iterationCount
    });
    await addClaim.save();
     return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: addClaim
    });
  } else {
    return res.status(200).json({
      message: "Please upload csv",
      status: false,
    });
  }
};

ClaimCtr.getClaimDumpList = async (req, res)=>{
  try {
    let query = {};
    if (req.query.network) {
      query.networkSymbol = req.query.network.toUpperCase();
    }
    let page = req.query.page ? req.query.page : 1
    const list = await AddClaimModel.find(query)
    .skip((+page - 1 || 0) * +process.env.LIMIT)
    .limit(+process.env.LIMIT)
    .sort({ createdAt: -1 });

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
      }
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
}
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

}
ClaimCtr.updateDump = async (req, res) => {
  const {
    transactionHash,
    dumpId,
    numberOfRecords,
  } = req.body
  try{
    const dump = await AddClaimModel.findOne({ _id: dumpId });
    if(dump.transactionHash.includes(transactionHash)){
      return res.status(200).json({
        message : "Transaction hash is already updated",
        status : true
      })
    }
    dump.transactionHash.push(transactionHash)
    dump.iteration = dump.iteration + 1
    const claimData = dump.data.splice(0, numberOfRecords)
    dump.pendingData.push({data : claimData, transactionHash : transactionHash})
    // dump.uploadData = dump.uploadData.concat(claimData)
    dump.save();
    // if(dump.data.length == 0){
    //   const checkClaimAlreadyAdded = await ClaimModel.findOne({
    //     phaseNo: dump.phaseNo,
    //     tokenAddress: dump.tokenAddress.toLowerCase(),
    //     networkSymbol: dump.networkSymbol.toUpperCase(),
    //   });
    //   if(!checkClaimAlreadyAdded){
    //     const addNewClaim = new ClaimModel({
    //       tokenAddress: dump.tokenAddress,
    //       contractAddress: dump.contractAddress,
    //       networkName: dump.networkName,
    //       networkSymbol: dump.networkSymbol,
    //       networkId: dump.networkId,
    //       amount: dump.amount,
    //       name: dump.name,
    //       timestamp : dump.timestamp,
    //       phaseNo : dump.phaseNo ,
    //       logo : dump.logo,
    //       dumpId : dump._id
    //     });
    //     await addNewClaim.save();
    //   }
    // }
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data : dump,
    });
  } catch (err) {
  return res.status(500).json({
    message: "DB_ERROR",
    status: true,
    err: err.message ? err.message : err,
  });
}
}

ClaimCtr.editDump = async (req, res) =>{
  try{
    const dump = await AddClaimModel.findOne({_id : req.body.dumpId});
    dump.isDisabledBit = req.body.isDisabledBit
    const claim = await ClaimModel.findOneAndUpdate({dumpId : dump._id}, { isDisabledBit : req.body.isDisabledBit })
    dump.save();
    return  res.status(200).json({
      status : "SUCCESS",
      data : dump
    })
  }catch(err){
    return res.status(500).json({
      message: "Something Went Wrong ",
      status: true,
      err: err.message ? err.message : err,
    });
  }
}
//cron service
ClaimCtr.checkTransactionStatus = async () => {
  try{
    console.log('checkTransactionStatus cron called :>> ');
    const dumpList = await AddClaimModel.find({ pendingData : {$ne : []} })
    console.log('dumpList.length :>> ', dumpList.length);
      dumpList.forEach((dump)=>{
        if(dump.pendingData.length !=0){
          dump.pendingData.forEach( async (pendingData)=>{
            const txn = await web3Helper.getTransactionStatus(pendingData.transactionHash, dump.networkName)
            console.log('txn :>> ', txn)
            if(txn && txn.status == true){
              dump.pendingData = dump.pendingData.filter((dt)=> dt.transactionHash != pendingData.transactionHash)
              dump.uploadData.push(pendingData.data)
              if(dump.data.length == 0 && dump.pendingData.length == 0){
                const checkClaimAlreadyAdded = await ClaimModel.findOne({
                  phaseNo: dump.phaseNo,
                  tokenAddress: dump.tokenAddress.toLowerCase(),
                  networkSymbol: dump.networkSymbol.toUpperCase(),
                });
                if(!checkClaimAlreadyAdded){
                  const addNewClaim = new ClaimModel({
                    tokenAddress: dump.tokenAddress,
                    contractAddress: dump.contractAddress,
                    networkName: dump.networkName,
                    networkSymbol: dump.networkSymbol,
                    networkId: dump.networkId,
                    amount: dump.amount,
                    name: dump.name,
                    timestamp : dump.timestamp,
                    phaseNo : dump.phaseNo ,
                    logo : dump.logo,
                    dumpId : dump._id
                  });
                  await addNewClaim.save();
                }
              }
              dump.save()
            }else if (txn && txn.status == false){
              dump.pendingData = dump.pendingData.filter((dt)=> dt.transactionHash != pendingData.transactionHash)
              dump.data.push(pendingData.data)
              dump.save()
            }
          })
        }
      })
  }catch(error){
    console.log("error >>", error.message)
  }
}

module.exports = ClaimCtr;
