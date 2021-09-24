const mongoose = require("mongoose");

const ImageMedia = require("./media/ImageMedia");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },

  type: {
    type: String,
    enum: ["youtube_video", "blog"],
    default: "youtube_video",
    trim: true,
  },

  youtubeVideo: {
    type: String,
    trim: true,
  },

  image: ImageMedia.schema,

  description: {
    type: String,
    trim: true,
  },

  link: {
    type: String,
    trim: true,
  },

  htmlContent: {
    type: String,
    trim: true,
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

const Post = mongoose.model("post", postSchema);

module.exports = Post;
