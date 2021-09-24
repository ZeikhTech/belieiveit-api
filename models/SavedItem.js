const mongoose = require("mongoose");

const savedItemSchema = new mongoose.Schema({
  content: {
    type: mongoose.Schema.Types.ObjectId,
  },
  type: {
    type: String,
    trim: true,
    enum: ["qoutation", "post", "affirmation"],
  },
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

savedItemSchema.index({ content: 1, savedBy: 1 });

const SavedItem = mongoose.model("saveditem", savedItemSchema);

module.exports = SavedItem;
