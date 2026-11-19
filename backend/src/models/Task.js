
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    inputText: {
    type: String,
    required: true
    },

    operation: {
    type: String,
    enum: ["uppercase", "lowercase", "reverse", "word_count"],
    required: true
    },

    result: {
    type: String,
    default: ""
    },

    logs: {
    type: [String],
    default: []
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

     status: {
       type: String,
       enum: ["pending", "running", "success", "failed"],
        default: "pending"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    dueDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ projectId: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
taskSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
