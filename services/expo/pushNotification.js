const { Expo } = require("expo-server-sdk");

const expo = new Expo();

async function sendPushNotifications(notifications) {
  if (!Array.isArray(notifications)) notifications = [notifications];

  let chunks = expo.chunkPushNotifications(notifications);

  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Expo Push Notifications error", error);
    }
  }
}

exports.sendPushNotifications = sendPushNotifications;
