const moment = require("moment");
const User = require("../models/User");
const Prayer = require("../models/Prayer");

const ScheduledNotification = require("../models/ScheduledNotification");

const getScheduleForNotifications = require("../helpers/getScheduleForNotifications");

const schedulePrayers = async (user) => {
  const { notificationSettings, timezone } = user;

  if (!notificationSettings.prayers) return;

  const today = moment.tz(timezone).format("dddd").toLocaleLowerCase();

  const schedule = getScheduleForNotifications({
    ...notificationSettings.prayers,
    timezone,
  });

  const scheduledNotifs = [];
  for (let i = 0; i < schedule.length; ++i) {
    const prayers = await Prayer.aggregate([
      { $match: { prayerDays: { $in: [today, "anytime"] } } },
      { $sample: { size: 1 } },
    ]);
    if (prayers.length === 0) return;

    scheduledNotifs.push({
      type: "prayer_notification",
      reciever: user._id,
      prayer: prayers[0],
      dispatchAt: schedule[i],
    });
  }

  //saving scheduled notification;
  await ScheduledNotification.insertMany(scheduledNotifs);
};

const cronWorker = async (timezone) => {
  const users = await User.find({
    $or: [{ ethnicity: /.*muslim.*/i }, { ethnicity: /.*islam.*/i }],
    timezone,
    "notificationSettings.prayers.state": true,
    "notificationSettings.prayers.numberOfNotifications": { $gt: 0 },
  }).select("notificationSettings.prayers timezone");

  users.forEach(schedulePrayers);
};
module.exports = {
  cronWorker,
  schedulePrayers,
};
