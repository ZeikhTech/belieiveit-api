const User = require("../models/User");
const Goal = require("../models/Goal");

const Wellness = require("../models/questions/Wellness");
const ClarityOnPurpose = require("../models/questions/ClarityOnPurpose");
const DefinedGoal = require("../models/questions/DefinedGoal");
const KnowledgeAndCollab = require("../models/questions/KnowledgeAndCollab");
const StrengthOfBelief = require("../models/questions/StrengthOfBelief");
const WillPower = require("../models/questions/WillPower");
const GoalPlan = require("../models/questions/GoalPlan");

const ScheduledNotification = require("../models/ScheduledNotification");

const e_coaching_tips = require("../enums/e_coaching_tips");
const e_coaching_tip_mapping = require("../enums/e_coaching_tip_mapping");

const getScheduleForNotifications = require("../helpers/getScheduleForNotifications");

const calculateGoalTips = async (goal) => {
  const wellness =
    (await Wellness.findOne({ answeredBy: goal.createdBy })) || {};

  const clarityOnPurpose =
    (await ClarityOnPurpose.findOne({
      answeredBy: goal.createdBy,
    })) || {};

  const definedGoal =
    (await DefinedGoal.findOne({
      answeredBy: goal.createdBy,
      goal: goal._id,
    })) || {};

  const knowledgeAndCollab =
    (await KnowledgeAndCollab.findOne({
      answeredBy: goal.createdBy,
      goal: goal._id,
    })) || {};

  const strengthOfBelief =
    (await StrengthOfBelief.findOne({
      answeredBy: goal.createdBy,
      goal: goal._id,
    })) || {};

  const willPower =
    (await WillPower.findOne({
      answeredBy: goal.createdBy,
      goal: goal._id,
    })) || {};

  const goalPlan =
    (await GoalPlan.findOne({
      answeredBy: goal.createdBy,
      goal: goal._id,
    })) || {};

  const marksObject = {
    //Wellness
    satisfiedWithSleep: wellness.satisfiedWithSleep || 0,
    regularExerciseParticipation: wellness.regularExerciseParticipation || 0,
    lastTwoWeeksSubstanceUsage: wellness.lastTwoWeeksSubstanceUsage || 0,
    lastMonthMood: wellness.lastMonthMood || 0,
    tolarantTowardsChange: wellness.tolarantTowardsChange || 0,
    gratefullFor: wellness.gratefullFor || 0,

    //clarity on purpose
    foundLifePurpose: clarityOnPurpose.foundLifePurpose || 0,
    frequentlyThinkingAboutLifePurpose:
      clarityOnPurpose.frequentlyThinkingAboutLifePurpose || 0,
    goalAlignWithLifePurpose: clarityOnPurpose.goalAlignWithLifePurpose || 0,
    stuckInPastOrFuture: clarityOnPurpose.stuckInPastOrFuture || 0,

    //Defined Goal
    isDefiniteGoal: definedGoal.isDefiniteGoal || 0,
    presistentlyWorkOnGoal: definedGoal.presistentlyWorkOnGoal || 0,
    oftenThingAboutGoal: definedGoal.oftenThingAboutGoal || 0,
    clearIdea: definedGoal.clearIdea || 0,
    dedicatingEnough: definedGoal.dedicatingEnough || 0,

    //knowledge and collab
    acquiringKnowledge: knowledgeAndCollab.acquiringKnowledge || 0,
    ownersPercent: knowledgeAndCollab.ownersPercent || 0,
    necessaryDirections: knowledgeAndCollab.necessaryDirections || 0,
    frequentInteraction: knowledgeAndCollab.frequentInteraction || 0,
    workInHarmony: knowledgeAndCollab.workInHarmony || 0,
    planApproved: knowledgeAndCollab.planApproved || 0,
    everyoneWorking: knowledgeAndCollab.everyoneWorking || 0,

    // Strength Of Belief
    affirmationCount: strengthOfBelief.affirmationCount || 0,
    concentrateAndVisualize: strengthOfBelief.concentrateAndVisualize || 0,
    howConfident: strengthOfBelief.howConfident || 0,
    thinkAboutPastSuccess: strengthOfBelief.thinkAboutPastSuccess || 0,
    recentCriticism: strengthOfBelief.recentCriticism || 0,
    thinkPositivelyToday: strengthOfBelief.thinkPositivelyToday || 0,
    thinkNegativelyToday: strengthOfBelief.thinkNegativelyToday || 0,

    //willPower
    sayAffirmation: willPower.sayAffirmation || 0,
    concentrateOnThoughts: willPower.concentrateOnThoughts || 0,
    pastDeadline: willPower.pastDeadline || 0,
    continueBuilding: willPower.continueBuilding || 0,
    acknowledgeMistake: willPower.acknowledgeMistake || 0,

    //goalPlan
    haveSolidPlan: goalPlan.haveSolidPlan || 0,
    startEndDates: goalPlan.startEndDates || 0,
    pastDeadlineItems: goalPlan.pastDeadlineItems || 0,
    continueBuilding: goalPlan.continueBuilding || 0,
    analyzeGoalPlan: goalPlan.analyzeGoalPlan || 0,
    shortcutToSuccess: goalPlan.shortcutToSuccess || 0,
  };

  lessMarksFields = [];

  for (let field in marksObject) {
    if (marksObject[field] < 100) {
      lessMarksFields.push(field);
    }
  }

  const calculatedTips = [];

  for (let field of lessMarksFields) {
    const tipReferences = e_coaching_tip_mapping[field];
    if (!tipReferences) continue;

    const tips = tipReferences.map((ref) => e_coaching_tips[ref]);
    calculatedTips.push(tips);
  }

  return calculatedTips;
};

const scheduleEcoaching = async (user) => {
  const { notificationSettings, timezone } = user;

  if (!notificationSettings.eCoaching.state) return;

  const schedule = getScheduleForNotifications({
    ...notificationSettings.eCoaching,
    timezone,
  });

  let goals = await Goal.find({
    isCompleted: false,
    createdBy: user._id,
  }).select("_id createdBy");

  if (goals.length === 0) return;

  const randomGoal = goals[Math.floor(Math.random() * goals.length)];

  const calculatedTips = (await calculateGoalTips(randomGoal)) || [];

  const scheduledNotifs = [];

  let tipCount = 0;

  while (tipCount < schedule.length && calculatedTips.length > 0) {
    const randomIndex = Math.floor(Math.random() * calculatedTips.length);
    const tips = calculatedTips[randomIndex];
    calculatedTips.splice(randomIndex, 1);

    const tip = tips[Math.floor(Math.random() * tips.length)];
    scheduledNotifs.push({
      type: "e_coaching_notification",
      reciever: user._id,
      eCoaching: tip,
      dispatchAt: schedule[tipCount],
    });
    tipCount++;
    // tips.forEach((tip) => {
    //   if (schedule[tipCount]) {
    //     scheduledNotifs.push({
    //       type: "e_coaching_notification",
    //       reciever: user._id,
    //       eCoaching: tip,
    //       dispatchAt: schedule[tipCount],
    //     });
    //   }
    //   tipCount++;
    // });
  }

  // saving scheduled notification;
  await ScheduledNotification.insertMany(scheduledNotifs);
};

const cronWorker = async (timezone) => {
  const users = await User.find({
    timezone,
    "notificationSettings.eCoaching.state": true,
    "notificationSettings.eCoaching.numberOfNotifications": { $gt: 0 },
  }).select("notificationSettings.eCoaching timezone");

  users.forEach(scheduleEcoaching);
};
module.exports = {
  cronWorker,
  scheduleEcoaching,
};
