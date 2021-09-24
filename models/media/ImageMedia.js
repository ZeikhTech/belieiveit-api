const mongoose = require("mongoose");

const imageMediaSchema = new mongoose.Schema({
  image: {
    type: String,
  },

  imageUrl: {
    type: String,
  },

  thumbnail: {
    type: String,
  },

  thumbnailUrl: {
    type: String,
  },

  aspectRatio: {
    type: Number,
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

const ImageMedia = mongoose.model("imagemedia", imageMediaSchema);

module.exports = ImageMedia;
