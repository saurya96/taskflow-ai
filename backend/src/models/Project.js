
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    repository: {
      type: String,
      required: true,
      trim: true
    },

    branchPolicy: {
      type: String,
      default: "feature-branch"
    },

    techStack: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
