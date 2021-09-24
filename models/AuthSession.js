const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
    index: true,
  },

  pushNotificationToken: {
    type: String,
    trim: true,
  },

  lastActivity: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  expiredAt: {
    type: Date,
  },
});

const AuthSession = mongoose.model("authsession", authSessionSchema);

module.exports = AuthSession;
