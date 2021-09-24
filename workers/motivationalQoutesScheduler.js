const moment = require("moment");
const User = require("../models/User");
const Qoutation = require("../models/Qoutation");

const ScheduledNotification = require("../models/ScheduledNotification");

const getScheduleForNotifications = require("../helpers/getScheduleForNotifications");

const scheduleMotivationlQoutes = async (user) => {
  const { notificationSettings, timezone } = user;

  if (!notificationSettings.motivationalQoutes.state) return;

  const schedule = getScheduleForNotifications({
    ...notificationSettings.motivationalQoutes,
    timezone,
  });

  const scheduledNotifs = [];
  for (let i = 0; i < schedule.length; ++i) {
    const qoutations = await Qoutation.aggregate([{ $sample: { size: 1 } }]);
    if (qoutations.length === 0) return;

    scheduledNotifs.push({
      type: "motivational_qoute_notification",
      reciever: user._id,
      qoutation: qoutations[0],
      dispatchAt: schedule[i],
    });
  }
  //saving scheduled notification;
  await ScheduledNotification.insertMany(scheduledNotifs);
};

const cronWorker = async (timezone) => {
  const users = await User.find({
    timezone,
    "notificationSettings.motivationalQoutes.state": true,
    "notificationSettings.motivationalQoutes.numberOfNotifications": { $gt: 0 },
  }).select("notificationSettings.motivationalQoutes timezone");

  users.forEach(scheduleMotivationlQoutes);
};

module.exports = {
  cronWorker,
  scheduleMotivationlQoutes,
};
