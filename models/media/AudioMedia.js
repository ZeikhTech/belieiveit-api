const mongoose = require("mongoose");

const audioMediaSchema = new mongoose.Schema({
  audio: {
    type: String,
  },

  audioUrl: {
    type: String,
  },

  isUsed: {
    type: Boolean,
    default: false,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AudioMedia = mongoose.model("audiomedia", audioMediaSchema);

module.exports = AudioMedia;
