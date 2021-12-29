const logsModel = require("./logsModel");

const LogsCtr = {};

LogsCtr.list = async (req, res) => {
  try {
    let query = {};
    let page = req.query.page ? req.query.page : 1;
    const list = await logsModel
      .find(query)
      .populate("createdBy", "username email")
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT)
      .sort({ createdAt: -1 })
      .lean();
    const totalCount = await logsModel.countDocuments(query);
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
LogsCtr.getSingleLog = async (req, res) => {
  try {
    const id = req.params.id;
    const logs = await logsModel.findOne({ _id: req.params.id });
    return res.status(200).json({
      message: "SUCCESS",
      status: true,
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({
      message: "DB_ERROR",
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
module.exports = LogsCtr;
