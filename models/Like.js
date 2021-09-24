const mongoose = require("mongoose");

const likeModelSchema = new mongoose.Schema({
  content: {
    type: mongoose.Schema.Types.ObjectId,
  },
  likedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

likeModelSchema.index({ content: 1, likedBy: 1 });

const Like = mongoose.model("like", likeModelSchema);

module.exports = Like;
