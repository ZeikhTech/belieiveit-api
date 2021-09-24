const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "affirmationCount",
  "concentrateAndVisualize",
  "howConfident",
  "thinkAboutPastSuccess",
  "recentCriticism",
  "thinkPositivelyToday",
  "thinkNegativelyToday",
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
    default: 7,
  },

  totalStrengthScore: {
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

const StrengthOfBelief = mongoose.model("strengthofbelief", goalPlanSchema);

module.exports = StrengthOfBelief;
