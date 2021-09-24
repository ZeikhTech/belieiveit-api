const mongoose = require("mongoose");

const goalCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
});

const GoalCategory = mongoose.model("goalcategory", goalCategorySchema);

module.exports = GoalCategory;
