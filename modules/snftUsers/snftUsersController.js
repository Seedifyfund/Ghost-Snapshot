const SnftUsersModel = require("./snftUsersModel");
const fs = require("fs");
const csv = require("csvtojson");
module.exports.addSnftUsers = async (req, res) => {
  try {
    const files = req.files.csv;
    const snapshotName = req.body.snapshotName.toLowerCase();
    if (!files) {
      return res.status(500).json({
        message: "Please upload csv",
        status: false,
      });
    }
    const users = await csv().fromFile(files.path);
    fs.unlink(files.path, () => {
      console.log("remove users csv from temp : >> ");
    });
    users.forEach(async (user) => {
      const snftUser = await SnftUsersModel.findOne({
        walletAddress: user.walletAddress,
      }).lean();
      if (snftUser) {
        var index = snftUser.tokens.findIndex(
          (data) => data.snapshot === snapshotName
        );
        if (index === -1) {
          snftUser.tokens.push({
            snapshot: snapshotName,
            eTokens: Number(user.eTokens),
          });
        } else {
            snftUser.tokens[index].eTokens = snftUser.tokens[index].eTokens + Number(user.eTokens)
        }
        await SnftUsersModel.findOneAndUpdate({_id : snftUser._id}, {$set : snftUser});
      } else {
        const newSnftUser = new SnftUsersModel({
          walletAddress: user.walletAddress,
          tokens: [
            {
              snapshot: snapshotName,
              eTokens: Number(user.eTokens),
            },
          ],
        });
        await newSnftUser.save()
      }
    });
    res.status(200).json({
      status: true,
    //   data: users,
      snapshotName: snapshotName,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong ",
      err: err.message ? err.message : err,
    });
  }
};


module.exports.getSingleUser = async (req, res) => {
    try {
      const walletAddress = req.params.id;
      const fetchPool = await SnftUsersModel.findOne({ walletAddress });
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