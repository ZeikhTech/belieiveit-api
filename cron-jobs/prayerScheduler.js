const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/prayerScheduler");

module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting  Prayer Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
