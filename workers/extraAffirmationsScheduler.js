const User = require("../models/User");
const Affirmation = require("../models/Affirmation");

const ScheduledNotification = require("../models/ScheduledNotification");

const getScheduleForNotifications = require("../helpers/getScheduleForNotifications");

const scheduleExtraAffirmations = async (user) => {
  const { notificationSettings, timezone } = user;

  if (!notificationSettings.extraAffirmations.state) return;

  const schedule = getScheduleForNotifications({
    ...notificationSettings.extraAffirmations,
    timezone,
  });

  const scheduledNotifs = [];
  for (let i = 0; i < schedule.length; ++i) {
    const afffirmations = await Affirmation.aggregate([
      { $sample: { size: 1 } },
    ]);
    if (afffirmations.length === 0) return;

    scheduledNotifs.push({
      type: "extra_affirmation_notification",
      reciever: user._id,
      affirmation: afffirmations[0],
      dispatchAt: schedule[i],
    });
  }

  //saving scheduled notification;
  await ScheduledNotification.insertMany(scheduledNotifs);
};

const cronWorker = async (timezone) => {
  const users = await User.find({
    timezone,
    "notificationSettings.extraAffirmations.state": true,
    "notificationSettings.extraAffirmations.numberOfNotifications": { $gt: 0 },
  }).select("notificationSettings.extraAffirmations timezone");

  users.forEach(scheduleExtraAffirmations);
};

module.exports = { cronWorker, scheduleExtraAffirmations };
