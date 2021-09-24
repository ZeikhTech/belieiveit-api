const momentTimezone = require("moment-timezone");
const cron = require("node-cron");
const cronTime = require("cron-time-generator");

const timezones = momentTimezone.tz.names();
module.exports = (task) => {
  //every day at 12:05 am
  const timeExpression = cronTime.everyDayAt(0, 5);

  timezones.forEach((timezone) => {
    cron.schedule(
      timeExpression,
      () => {
        task(timezone);
      },
      { timezone }
    );
  });
};
