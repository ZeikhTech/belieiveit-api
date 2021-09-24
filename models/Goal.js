const mongoose = require("mongoose");

const GoalCategory = require("./GoalCategory");
const ImageMedia = require("./media/ImageMedia");
const AudioMedia = require("./media/AudioMedia");

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  preDefinedGoalRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "predefinedgoal",
  },

  goalCategory: GoalCategory.schema,

  iAm: {
    type: String,
    trim: true,
  },

  accomplishingDate: {
    type: Date,
  },

  afterAccomplishment: {
    type: String,
    trim: true,
  },

  importanceOfGoal: {
    type: String,
    trim: true,
  },

  members: [
    new mongoose.Schema({
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      status: {
        type: String,
        enum: ["accepted", "requested"],
      },
    }),
  ],

  completion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  totalScore: {
    type: Number,
    default: 0,
  },

  image: ImageMedia.schema,

  audio: AudioMedia.schema,

  song: AudioMedia.schema,

  toPlay: {
    type: String,
    enum: ["song", "audio", "both"],
  },

  isCompleted: {
    type: Boolean,
    default: false,
  },

  isPublic: {
    type: Boolean,
    default: true,
  },
  articleSuggestions: {
    type: Boolean,
    default: true,
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

const Goal = mongoose.model("goal", goalSchema);

module.exports = Goal;
