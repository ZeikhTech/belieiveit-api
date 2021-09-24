const moment = require("moment-timezone");
const User = require("../models/User");

const ScheduledNotification = require("../models/ScheduledNotification");

const scheduleGoalPlanReminder = async (user) => {
  const { goalPlan } = user.notificationSettings;

  if (!goalPlan.state) return;

  await new ScheduledNotification({
    type: "goal_plan_reminder_notification",
    reciever: user._id,
    dispatchAt: moment
      .tz(goalPlan.reminderTime, "HH:mm", user.timezone)
      .toDate(),
  }).save();
};
const cronWorker = async (timezone) => {
  const users = await User.find({
    "notificationSettings.goalPlan.state": true,
    timezone,
  }).select("notificationSettings.goalPlan");

  users.forEach(scheduleGoalPlanReminder);
};
module.exports = {
  cronWorker,
  scheduleGoalPlanReminder,
};
