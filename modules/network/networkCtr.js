const NetworkModel = require('./networkModel');
const networkCtr = {};

networkCtr.addNewNetwork = async (req, res) => {
  try {
    const addNewNetwork = new NetworkModel({
      networkName: req.body.networkName,
    });

    await addNewNetwork.save();

    return res.status(200).json({
      message: 'Network Added sucessfully',
      status: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Something Went Wrong ',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

networkCtr.listNetworks = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req && req.userData) {
      query = {};
    }
    const list = await NetworkModel.find(query);
    return res.status(200).json({
      message: 'Network List',
      status: true,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Something Went Wrong ',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

networkCtr.updateNetwork = async (req, res) => {
  try {
    const findNetwork = req.params.networkId;
    if (findNetwork) {
      if (req.body.isActive) {
        findNetwork.isActive = true;
      }
      if (req.body.isActive === false) {
        findNetwork.isActive = false;
      }
      if (req.body.networkName) {
        findNetwork.networkName = req.body.networkName;
      }
      if (req.body.logo) {
        findNetwork.logo = req.body.logo;
      }

      await findNetwork.save();
      return res.status(200).json({
        message: 'Network Updated sucessfully',
        status: true,
      });
    } else {
      return res.status(400).json({
        message: 'Invalid Network Id',
        status: false,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: 'Something Went Wrong ',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = networkCtr;
