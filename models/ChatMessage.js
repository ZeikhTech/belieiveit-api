const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatMessageSchema = new Schema({
  sender: {
    type: Schema.ObjectId,
    ref: "user",
    required: true,
  },

  chatRoom: {
    type: Schema.ObjectId,
    ref: "chatroom",
    required: true,
    index: true,
  },

  messageType: {
    type: String,
    default: "message",
    enum: ["message", "info"],
  },

  message: { type: String, default: "", trim: true },

  tags: [
    {
      startIndex: Number,
      endIndex: Number,
      user: {
        type: Schema.ObjectId,
        ref: "user",
      },
    },
  ],

  delivered: {
    type: Boolean,
    default: false,
  },

  seen: [
    {
      type: Schema.ObjectId,
      ref: "user",
    },
  ],

  isMessageModified: {
    type: Boolean,
    default: false,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  customIdentifier: {
    type: String,
    trim: true,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatMessage = mongoose.model("chatmessage", chatMessageSchema);
module.exports = ChatMessage;
