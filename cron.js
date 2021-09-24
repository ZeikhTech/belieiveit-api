const notificationDispatcher = require("./cron-jobs/notificationDispatcher");
const eCoachingScheduler = require("./cron-jobs/eCoachingScheduler");
const prayerScheduler = require("./cron-jobs/prayerScheduler");
const affirmationReminderScheduler = require("./cron-jobs/affirmationReminderScheduler");
const motivationalQoutesScheduler = require("./cron-jobs/motivationalQoutesScheduler");

const extraAffirmationsScheduler = require("./cron-jobs/extraAffirmationsScheduler");

const overallScheduler = require("./cron-jobs/overallScheduler");

module.exports = () => {
  notificationDispatcher();

  // eCoachingScheduler();

  // prayerScheduler();

  // affirmationReminderScheduler();

  // motivationalQoutesScheduler();

  // extraAffirmationsScheduler();
  overallScheduler();
  console.log("Cron Jobs started");
};
