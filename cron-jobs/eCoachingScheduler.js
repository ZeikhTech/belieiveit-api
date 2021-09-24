const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/eCoachingScheduler");
module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting E-Coaching Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
