const mongoose = require("mongoose");

const mileStoneSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  frequency: {
    type: Number,
    default: 1,
  },

  timeOfDay: {
    type: [String],
  },

  preDefinedGoal: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: "predefinedgoal",
  },

  repeatingDays: {
    type: [String],
    default: [],
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
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

const PreDefinedMilestone = mongoose.model(
  "predefinedmilestone",
  mileStoneSchema
);

module.exports = PreDefinedMilestone;
