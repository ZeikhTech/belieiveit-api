const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/goalPlanReminderScheduler");

module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting  Goal Plan Reminder Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
