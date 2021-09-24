const User = require("../models/User");
const Goal = require("../models/Goal");
const GoalCategory = require("../models/GoalCategory");

module.exports = async (id) => {
  const user = await User.findById(id);
  if (!user) return;

  const goalCategories = await GoalCategory.find();

  const scoreObj = {};

  for (let i = 0; i < goalCategories.length; ++i) {
    const category = goalCategories[i];
    if (!category) continue;

    const thisCategoryGoals = await Goal.find({
      createdBy: user._id,
      "goalCategory._id": category._id,
      isCompleted: false,
    });

    let total = 0;
    thisCategoryGoals.forEach((g) => (total += g.totalScore));

    if (thisCategoryGoals.length === 0 || total === 0) {
      scoreObj[`${category._id}`] = 0;
      continue;
    }

    const average = total / thisCategoryGoals.length;

    scoreObj[`${category._id}`] = average <= 0 ? 0 : Math.round(average);
  }

  user.categoryScore = scoreObj;

  await user.save();
};
