const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "isDefiniteGoal",
  "presistentlyWorkOnGoal",
  "oftenThingAboutGoal",
  "clearIdea",
  "dedicatingEnough",
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

const definedGoalSchema = new mongoose.Schema({
  ...schemaObject,

  questionsCount: {
    type: Number,
    default: 5,
  },

  totalDefinedGoalScore: {
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

const DefinedGoal = mongoose.model("definedgoal", definedGoalSchema);

module.exports = DefinedGoal;
