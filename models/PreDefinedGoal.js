const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  goalCategory: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "goalcategory",
  },

  isActive: {
    type: Boolean,
    default: false,
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

const PreDefinedGoal = mongoose.model("predefinedgoal", goalSchema);

module.exports = PreDefinedGoal;
