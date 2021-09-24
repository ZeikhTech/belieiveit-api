const cron = require("node-cron");
const cronTime = require("cron-time-generator");

const scheduledNotificationDispatcher = require("../workers/scheduledNotificationDispatcher");

module.exports = () => {
  //every 5 minutes
  const timeExpression = cronTime.every(5).minutes();
  cron.schedule(timeExpression, () => {
    scheduledNotificationDispatcher();
  });
};
