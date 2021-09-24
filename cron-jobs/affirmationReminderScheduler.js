const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/affirmationReminderScheduler");

module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting  Affirmation Reminder Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
