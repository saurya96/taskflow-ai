
const Project = require("../models/Project");

// 1. Create Project
const createProject = async (req, res) => {
  try {
    const { repository, branchPolicy, techStack } = req.body;

    const project = await Project.create({
      ownerId: req.user,
      repository,
      branchPolicy,
      techStack
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 2. Get All Projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      ownerId: req.user
    });

    res.status(200).json({
      success: true,
      projects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 3. Get Single Project
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 4. Update Project
const updateProject = async (req, res) => {
  try {
    const { repository, branchPolicy, techStack } = req.body;

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user
      },
      { repository, branchPolicy, techStack },
      { returnDocument: "after", runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 5. Delete Project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
