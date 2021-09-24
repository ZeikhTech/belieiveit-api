const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

collectionSchema.index({ user: 1 });

const Collection = mongoose.model("collection", collectionSchema);

module.exports = Collection;
