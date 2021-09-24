const mongoose = require("mongoose");

const prayerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },

  prayer: {
    type: String,
    trim: true,
  },

  translation: {
    type: String,
    trim: true,
  },

  type: {
    type: String,
    trim: true,
    default: "text_prayer",
  },

  prayerDays: {
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
      "anytime",
    ],
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

const Prayer = mongoose.model("prayer", prayerSchema);

module.exports = Prayer;
