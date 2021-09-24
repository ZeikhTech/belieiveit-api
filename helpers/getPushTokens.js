const moment = require("moment");
const AuthSession = require("../models/AuthSession");

module.exports = async (ids = []) => {
  const lastActivity = moment().subtract(1, "months").toDate();

  const query = {
    user: Array.isArray(ids) ? { $in: ids } : ids,
    isExpired: false,
    pushNotificationToken: { $exists: true },
    // lastActivity: {
    //   $gte: lastActivity,
    // },
  };

  const sessions = await AuthSession.find(query)
    .select("pushNotificationToken")
    .sort("-lastActivity")
    .limit(1);
  return sessions.map((session) => session.pushNotificationToken);
};
