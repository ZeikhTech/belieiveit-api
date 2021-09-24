const mongoose = require("mongoose");

const clickReportSchema = new mongoose.Schema({
  link: {
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

clickReportSchema.index({ user: 1 });

const ClickReport = mongoose.model("clickreport", clickReportSchema);

module.exports = ClickReport;
