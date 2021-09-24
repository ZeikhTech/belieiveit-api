const mongoose = require("mongoose");

const mileStoneSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  preDefinedMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: "predefinedmilestone",
  },

  isActive: {
    type: Boolean,
    default: false,
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

const PreDefinedSubMilestone = mongoose.model(
  "predefinedsubmilestone",
  mileStoneSchema
);

module.exports = PreDefinedSubMilestone;
