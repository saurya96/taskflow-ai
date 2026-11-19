
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const taskQueue = require("../services/taskQueue");

const createTask = async (req, res) => {
  const {
    title,
    description,
    projectId,
    inputText,
    operation,
    assignedTo,
    priority,
    dueDate
  } = req.body || {};
  const supportedOperations = ["uppercase", "lowercase", "reverse", "word_count"];

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "A non-empty title is required"
    });
  }

  if (typeof projectId !== "string" || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      success: false,
      message: "A valid projectId is required"
    });
  }

  if (typeof inputText !== "string") {
    return res.status(400).json({
      success: false,
      message: "inputText must be a string"
    });
  }

  if (!supportedOperations.includes(operation)) {
    return res.status(400).json({
      success: false,
      message: `operation must be one of: ${supportedOperations.join(", ")}`
    });
  }

  try {
    const project = await Project.findOne({
      _id: projectId,
      ownerId: req.user
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user,
      priority,
      dueDate,
      inputText,
      operation,
      status: "pending"
    });

    try {
      await taskQueue(task._id.toString());
    } catch (error) {
      console.error("Task was created but could not be queued:", error.name);
      return res.status(503).json({
        success: false,
        message: "Task was created but could not be added to the queue",
        taskId: task._id.toString()
      });
    }

    return res.status(201).json({
      success: true,
      message: "Task created and added to queue",
      task
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Task details are invalid"
      });
    }

    console.error("Task creation failed:", error.name);
    return res.status(500).json({
      success: false,
      message: "Unable to create task"
    });
  }
};

// 2. Get All Tasks of a Project
const getTasks = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      ownerId: req.user
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const tasks = await Task.find({
      projectId: req.params.projectId
    });

    res.status(200).json({
      success: true,
      tasks
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. Get Single Task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.status(200).json({
      success: true,
      task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. Update Task
const updateTask = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "priority",
      "assignedTo",
      "dueDate"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user
      },
      updates,
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 5. Delete Task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
