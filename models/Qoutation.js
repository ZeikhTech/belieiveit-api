const mongoose = require("mongoose");
const QouteCategory = require("./QouteCategory");

const qoutationSchema = new mongoose.Schema({
  qoutation: {
    type: String,
    trim: true,
  },
  category: {
    type: QouteCategory.schema,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Qoutatuin = mongoose.model("qoutation", qoutationSchema);

module.exports = Qoutatuin;
