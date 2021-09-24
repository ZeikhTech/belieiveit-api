const mongoose = require("mongoose");
const ChatMessage = require("./ChatMessage");
const { Schema } = mongoose;
const ImageMedia = require("./media/ImageMedia");

const chatRoomSchema = new Schema({
  roomType: {
    type: String,
    enum: ["direct", "group"],
    required: true,
  },

  name: {
    type: String,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  image: ImageMedia.schema,

  membersCanAdd: {
    type: Boolean,
    default: false,
  },

  members: [
    new Schema({
      memberId: {
        type: Schema.ObjectId,
        ref: "user",
        index: true,
      },
      role: {
        type: String,
        enum: ["admin", "member", "join_requester"],
      },
      chatCount: {
        type: Number,
        default: 0,
      },
    }),
  ],

  isPublic: {
    type: Boolean,
    default: true,
  },
  lastMessage: {
    type: Schema.ObjectId,
    ref: "chatmessage",
    default: null,
  },

  lastActive: {
    type: Date,
    default: Date.now,
  },

  createdBy: {
    type: Schema.ObjectId,
    ref: "user",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatRoom = mongoose.model("chatroom", chatRoomSchema);

module.exports = ChatRoom;
