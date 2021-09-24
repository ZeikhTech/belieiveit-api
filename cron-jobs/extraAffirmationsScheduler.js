const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/extraAffirmationsScheduler");

module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting Extra Affirmation Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
