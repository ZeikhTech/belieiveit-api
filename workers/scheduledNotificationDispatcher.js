const moment = require("moment");
const _ = require("lodash");

const ScheduledNotification = require("../models/ScheduledNotification");
const Notification = require("../models/Notification");
const User = require("../models/User");

const getPushTokens = require("../helpers/getPushTokens");

const { sendPushNotifications } = require("../services/expo/pushNotification");

module.exports = async () => {
  const scheduledNotifications = await ScheduledNotification.find({
    dispatchAt: { $lte: moment().toDate() },
  });

  scheduledNotifications.forEach(async (scheduledNotif) => {
    //creating notification in database

    const { reciever, type, prayer, eCoaching, goal, qoutation, affirmation } =
      scheduledNotif;

    const notificationBody = {
      reciever,
      type,
    };

    switch (type) {
      case "prayer_notification":
        notificationBody.prayer = prayer;
        break;
      case "e_coaching_notification":
        notificationBody.eCoaching = eCoaching;
        break;
      case "affirmation_reminder_notification":
        notificationBody.goal = goal;
        break;

      case "extra_affirmation_notification":
        notificationBody.affirmation = affirmation;
        break;
      case "motivational_qoute_notification":
        notificationBody.qoutation = qoutation;
        break;
    }

    //creating notification
    const notification = await new Notification(notificationBody).save();
    //deleting scheduled notification
    await ScheduledNotification.findByIdAndDelete(scheduledNotif._id);

    //updating user notificadtion count
    const user = await User.findByIdAndUpdate(
      reciever,
      { $inc: { notificationCount: 1 } },
      { new: true }
    );
    //sending a push notificaton
    const pushtokens = await getPushTokens(reciever.toHexString());

    //construct push notification
    const push_notification = {
      to: pushtokens,
      sound: "default",
    };
    switch (type) {
      case "prayer_notification":
        push_notification.title = prayer.name;
        push_notification.body = prayer.prayer;
        push_notification.data = _.pick(prayer, [
          "_id",
          "name",
          "prayer",
          "translation",
          "type",
        ]);
        break;
      case "e_coaching_notification":
        push_notification.title = "E-Coaching Notification";
        push_notification.body = eCoaching;
        push_notification.data = {
          eCoachingMessage: eCoaching,
        };
        break;
      case "affirmation_reminder_notification":
        push_notification.title = "Affirmation Reminder";
        push_notification.body = "Say Affirmation for " + goal.title;
        push_notification.data = {
          goal: {
            title: goal.title,
            _id: `${goal._id}`,
          },
        };
        break;
      case "motivational_qoute_notification":
        push_notification.title = "Motivational Quote";
        push_notification.body = qoutation.qoutation;
        push_notification.data = {
          qoutation: {
            qoutation: qoutation.qoutation,
            _id: `${qoutation._id}`,
          },
        };
        break;

      case "extra_affirmation_notification":
        push_notification.title = "Extra Affirmatioin";
        push_notification.body = affirmation.affirmation;
        push_notification.data = {
          affirmation: {
            affirmation: affirmation.affirmation,
            _id: `${affirmation._id}`,
          },
        };
        break;

      case "goal_plan_reminder_notification":
        push_notification.title = "Goal Plan Reminder";
        push_notification.body =
          "Work on your goal plans, complete today's Milestones and say Affirmations.";
        break;
    }
    if (!push_notification.data) push_notification.data = {};
    push_notification.data.type = type;
    sendPushNotifications(push_notification);
  });
};
