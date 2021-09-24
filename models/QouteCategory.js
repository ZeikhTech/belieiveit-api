const mongoose = require("mongoose");

const qouteCategory = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  isFree: {
    type: Boolean,
    default: true,
  },
});

const QouteCategory = mongoose.model("qoutecategory", qouteCategory);

module.exports = QouteCategory;
