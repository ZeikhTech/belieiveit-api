const dailyScheduler = require("../helpers/dailyScheduler");
const { cronWorker } = require("../workers/motivationalQoutesScheduler");

module.exports = () => {
  dailyScheduler((TIMEZONE) => {
    console.log("Starting Motivational Qoutes Scheduler Task => ", TIMEZONE);
    cronWorker(TIMEZONE);
  });
};
