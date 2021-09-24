const mongoose = require("mongoose");

const mileStoneSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  goal: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: "goal",
  },

  startDate: {
    type: Date,
  },

  endDate: {
    type: Date,
  },

  frequency: {
    type: Number,
    default: 1,
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

  repeatingDates: {
    type: [String],
    default: [],
  },

  timeOfDay: {
    type: [String],
  },

  completedDates: {
    type: [String],
    default: [],
  },

  members: [
    new mongoose.Schema({
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    }),
  ],

  isCompleted: {
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

const Milestone = mongoose.model("milestone", mileStoneSchema);

module.exports = Milestone;
