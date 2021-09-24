const mongoose = require("mongoose");

const affirmationCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  isFree: {
    type: Boolean,
    default: true,
  },

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "affirmationcategory",
    default: null,
  },
  hasChildren: {
    type: Boolean,
    default: false,
  },
});

const AffirmationCategory = mongoose.model(
  "affirmationcategory",
  affirmationCategorySchema
);

module.exports = AffirmationCategory;
