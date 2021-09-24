const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "sayAffirmation",
  "concentrateOnThoughts",
  "pastDeadline",
  "continueBuilding",
  "acknowledgeMistake",
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

const willPowerSchema = new mongoose.Schema({
  ...schemaObject,

  questionsCount: {
    type: Number,
    default: 5,
  },

  totalWillPowerScore: {
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

const WillPower = mongoose.model("willpower", willPowerSchema);

module.exports = WillPower;
