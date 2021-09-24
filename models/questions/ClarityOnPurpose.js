const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "foundLifePurpose",
  "frequentlyThinkingAboutLifePurpose",
  "goalAlignWithLifePurpose",
  "stuckInPastOrFuture",
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

const clarityOnPurposeSchema = new mongoose.Schema({
  ...schemaObject,
  questionsCount: {
    type: Number,
    default: 4,
  },

  totalClarityScore: {
    type: Number,
    default: 0,
  },

  answeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
});

const ClarityOnPurpose = mongoose.model(
  "clarityonpurpose",
  clarityOnPurposeSchema
);

module.exports = ClarityOnPurpose;
