const mongoose = require("mongoose");

const affirmationSubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "affirmationcategory",
  },
  isFree: {
    type: Boolean,
    default: true,
  },
});

const AffirmationSubCategory = mongoose.model(
  "affirmationsubcategory",
  affirmationSubCategorySchema
);

module.exports = AffirmationSubCategory;
