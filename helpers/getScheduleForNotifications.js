const moment = require("moment-timezone");

const MIN_INTERVAL = 1;

module.exports = ({ startTime, endTime, numberOfNotifications, timezone }) => {
  const current = moment.tz(timezone);
  const start = moment.tz(startTime, "HH:mm", timezone);
  const end = moment.tz(endTime, "HH:mm", timezone);

  let diff = Math.round(end.diff(start, "minute") / numberOfNotifications);

  diff = diff < MIN_INTERVAL ? MIN_INTERVAL : diff;

  const schedule = [];

  for (let i = 0; i < numberOfNotifications; ++i) {
    schedule.push(start.toDate());
    start.add(diff || MIN_INTERVAL, "minutes");
  }

  return schedule.filter((s) => {
    return s.getTime() > current.toDate().getTime();
  });
};
