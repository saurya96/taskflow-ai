
const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

// Protect all task routes
router.use(authMiddleware);

// Create task
router.post("/", createTask);

// Get all tasks of a project
router.get("/project/:projectId", getTasks);

// Get single task
router.get("/:id", getTaskById);

// Update task
router.put("/:id", updateTask);

// Delete task
router.delete("/:id", deleteTask);

module.exports = router;
