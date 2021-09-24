const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

const fields = [
  "acquiringKnowledge",
  "ownersPercent",
  "necessaryDirections",
  "frequentInteraction",
  "workInHarmony",
  "planApproved",
  "everyoneWorking",
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

const knowledgeAndCollabSchema = new mongoose.Schema({
  ...schemaObject,

  questionsCount: {
    type: Number,
    default: 7,
  },

  totalKnowledgeAndCollabScore: {
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

const KnowledgeAndCollab = mongoose.model(
  "knowledgeandcollab",
  knowledgeAndCollabSchema
);

module.exports = KnowledgeAndCollab;
