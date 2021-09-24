const mongoose = require("mongoose");

const subMilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: "milestone",
  },

  completedDates: {
    type: [String],
    default: [],
  },

  sortOrder: {
    type: Number,
    default: 0,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SubMilestone = mongoose.model("submilestone", subMilestoneSchema);

module.exports = SubMilestone;
