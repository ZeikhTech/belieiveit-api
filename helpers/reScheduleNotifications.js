const ScheduledNotification = require("../models/ScheduledNotification");

const {
  scheduleAffirmation,
} = require("../workers/affirmationReminderScheduler");
const { scheduleEcoaching } = require("../workers/eCoachingScheduler");
const {
  scheduleExtraAffirmations,
} = require("../workers/extraAffirmationsScheduler");
const {
  scheduleGoalPlanReminder,
} = require("../workers/goalPlanReminderScheduler");
const {
  scheduleMotivationlQoutes,
} = require("../workers/motivationalQoutesScheduler");
const { schedulePrayers } = require("../workers/prayerScheduler");

module.exports = async (user) => {
  await ScheduledNotification.deleteMany({ reciever: user._id });

  const tasks = [
    scheduleAffirmation,
    scheduleEcoaching,
    scheduleExtraAffirmations,
    scheduleGoalPlanReminder,
    scheduleMotivationlQoutes,
    schedulePrayers,
  ];

  for (let i = 0; i < tasks.length; ++i) {
    const task = tasks[i];
    if (task) await task(user);
  }
};
