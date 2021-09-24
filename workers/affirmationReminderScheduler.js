const User = require("../models/User");
const Goal = require("../models/Goal");

const ScheduledNotification = require("../models/ScheduledNotification");

const getScheduleForNotifications = require("../helpers/getScheduleForNotifications");

const scheduleAffirmation = async (user) => {
  const { affirmationReminderTime } = user.notificationSettings;
  if (!affirmationReminderTime.state) return;

  const goals = await Goal.find({
    createdBy: user._id,
    isCompleted: false,
  });

  if (goals.length === 0) return;

  const schedule = getScheduleForNotifications({
    numberOfNotifications: goals.length,
    startTime: affirmationReminderTime.amTime,
    endTime: affirmationReminderTime.pmTime,
    timezone: user.timezone,
  });

  const scheduledNotifs = schedule.map((dispatchAt, index) => {
    const goal = goals[index];

    return {
      type: "affirmation_reminder_notification",
      reciever: user._id,
      goal,
      dispatchAt,
    };
  });

  //saving scheduled notification;
  await ScheduledNotification.insertMany(scheduledNotifs);
};

const cronWorker = async (timezone) => {
  const users = await User.find({
    "notificationSettings.affirmationReminderTime.state": true,
    timezone,
  }).select("notificationSettings.affirmationReminderTime timezone");

  users.forEach(scheduleAffirmation);
};

module.exports = {
  cronWorker,
  scheduleAffirmation,
};
