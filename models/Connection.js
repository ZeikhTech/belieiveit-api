let mongoose = require("mongoose");
const Schema = mongoose.Schema;

const membersSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: "user",
  },
});

const connectionSchema = new Schema({
  members: [
    {
      type: membersSchema,
      unique: true,
    },
  ],

  initiator_id: {
    type: Schema.ObjectId,
    ref: "user",
    required: true,
  },

  status: {
    type: String,
    enum: ["requested", "accepted"],
    required: true,
    index: true,
  },

  acceptedAt: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// mongo supposedly automatically creates a multi-key index in the case that the field is an array?
connectionSchema.index({ "members.user": 1 });

const Connection = mongoose.model("connection", connectionSchema);
module.exports = Connection;
