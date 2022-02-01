const ProjectModel = require("./projectsModel");

const projectsCtr = {};

projectsCtr.addNewProject = async (req, res) => {
  const { name } = req.body;
  try {
    const project = await ProjectModel.findOne({ name: name });
    if (project) {
      return res.status(400).json({
        status: false,
        message: "This Project Already Added",
      });
    }
    const newProject = new ProjectModel({
      name: name,
    });
    await newProject.save();
    return res.status(200).json({
      status: true,
      message: "Project Added Successfully!",
      data: {
        name: newProject.name,
        projectId: newProject._id,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong ",
      err: err.message ? err.message : err,
    });
  }
};
projectsCtr.list = async (req, res)=>{
  try {
    let query = {};
    if (req.query.search) {
      query.name = new RegExp(`${req.query.search}`, 'i');
    }
    let page = req.query.page ? req.query.page : 1;
    let list = await ProjectModel.find(query, {subscribedUsers : 0})
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT)
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = await ProjectModel.countDocuments(query);
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
module.exports = projectsCtr;
