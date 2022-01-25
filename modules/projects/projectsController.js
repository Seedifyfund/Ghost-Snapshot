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
      status: true,
      message: "Something Went Wrong ",
      err: err.message ? err.message : err,
    });
  }
};
module.exports = projectsCtr;
