const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "haveSolidPlan",
  "startEndDates",
  "pastDeadlineItems",
  "continueBuilding",
  "analyzeGoalPlan",
  "shortcutToSuccess",
];

const schemaObject = {};

fields.forEach((field) => {
  schemaObject[field] = {
    type: Number,
    default: 0,
  };
  schemaObject[field + "Value"] = {
    type: Mixed,
  };
});

const goalPlanSchema = new mongoose.Schema({
  ...schemaObject,

  questionsCount: {
    type: Number,
    default: 6,
  },

  totalGoalPlanScore: {
    type: Number,
    default: 0,
  },

  goal: {
    type: mongoose.Schema.ObjectId,
    ref: "goal",
    required: true,
  },
  answeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
});

const GoalPlan = mongoose.model("goalplan", goalPlanSchema);

module.exports = GoalPlan;
