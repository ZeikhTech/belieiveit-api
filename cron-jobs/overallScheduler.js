const cron = require("node-cron");
const cronTime = require("cron-time-generator");

const User = require("../models/User");

const reScheduleNotifications = require("../helpers/reScheduleNotifications");

module.exports = () => {
  //every 3 hours
  const timeExpression = cronTime.every(1).hours();
  cron.schedule(timeExpression, async () => {
    const users = await User.find({});

    for (let i = 0; i < users.length; ++i) {
      if (users[i]) {
        await reScheduleNotifications(users[i]);
      }
    }
  });
};
