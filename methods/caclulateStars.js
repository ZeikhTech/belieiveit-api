const User = require("../models/User");
const Goal = require("../models/Goal");
const GoalCategory = require("../models/GoalCategory");

module.exports = async (id) => {
  const user = await User.findById(id);
  if (!user) return;

  const goalCategories = await GoalCategory.find();

  const starsObj = {};

  for (let i = 0; i < goalCategories.length; ++i) {
    const category = goalCategories[i];
    if (!category) continue;

    const thisCategoryGoalsCount = await Goal.find({
      createdBy: user._id,
      "goalCategory._id": category._id,
      isCompleted: true,
    }).count();

    starsObj[`${category._id}`] = thisCategoryGoalsCount || 0;
  }

  user.categoryStars = starsObj;

  await user.save();
};
