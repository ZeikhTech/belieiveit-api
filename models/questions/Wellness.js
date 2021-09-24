const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "satisfiedWithSleep",
  "regularExerciseParticipation",
  "lastTwoWeeksSubstanceUsage",
  "lastMonthMood",
  "tolarantTowardsChange",
  "gratefullFor",
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

const wellnessSchema = new mongoose.Schema({
  ...schemaObject,

  questionsCount: {
    type: Number,
    default: 6,
  },

  totalWellnessScore: {
    type: Number,
    default: 0,
  },

  answeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
});

const Wellness = mongoose.model("wellness", wellnessSchema);

module.exports = Wellness;
