const Goal = require("../models/Goal");

//marks
const Wellness = require("../models/questions/Wellness");
const ClarityOnPurpose = require("../models/questions/ClarityOnPurpose");
const DefinedGoal = require("../models/questions/DefinedGoal");
const GoalPlan = require("../models/questions/GoalPlan");
const KnowledgeAndCollab = require("../models/questions/KnowledgeAndCollab");
const StrengthOfBelief = require("../models/questions/StrengthOfBelief");
const WillPower = require("../models/questions/WillPower");

//categoryCalculator
const claculateCategoryAverageScore = require("./claculateCategoryAverageScore");

module.exports = async (id, calculateCategoryScore = true) => {
  const goal = await Goal.findById(id);

  if (!goal) return;

  let totalScore = 0;

  //wellness
  // let wellness = await Wellness.findOne({ answeredBy: goal.createdBy });
  // if (wellness) {
  //   totalScore += wellness.totalWellnessScore;
  // }

  // //clarityOnPurpose
  // let clarityOnPurpose = await ClarityOnPurpose.findOne({
  //   answeredBy: goal.createdBy,
  // });
  // if (clarityOnPurpose) {
  //   totalScore += clarityOnPurpose.totalClarityScore;
  // }

  //definedGoal
  let definedGoal = await DefinedGoal.findOne({
    goal: goal._id,
    answeredBy: goal.createdBy,
  });
  if (definedGoal) {
    totalScore += definedGoal.totalDefinedGoalScore;
  }

  //goalPlan
  let goalPlan = await GoalPlan.findOne({
    goal: goal._id,
    answeredBy: goal.createdBy,
  });

  if (goalPlan) {
    totalScore += goalPlan.totalGoalPlanScore;
  }

  //knowledgeAndCollab
  let knowledgeAndCollab = await KnowledgeAndCollab.findOne({
    goal: goal._id,
    answeredBy: goal.createdBy,
  });

  if (knowledgeAndCollab) {
    totalScore += knowledgeAndCollab.totalKnowledgeAndCollabScore;
  }

  //strengthOfBelief
  let strengthOfBelief = await StrengthOfBelief.findOne({
    goal: goal._id,
    answeredBy: goal.createdBy,
  });

  if (strengthOfBelief) {
    totalScore += strengthOfBelief.totalStrengthScore;
  }

  //willPower
  let willPower = await WillPower.findOne({
    goal: goal._id,
    answeredBy: goal.createdBy,
  });

  if (willPower) {
    totalScore += willPower.totalWillPowerScore;
  }

  goal.totalScore = totalScore;

  await goal.save();

  if (calculateCategoryScore) claculateCategoryAverageScore(goal.createdBy);
  return goal;
};
