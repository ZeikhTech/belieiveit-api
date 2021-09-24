const _ = require("lodash");

// const isPremium = require("../methods/isPremium");
module.exports = (user) => {
  const sanitized = _.pick(user, [
    "_id",
    "firstname",
    "lastname",
    "image",
    "email",
    "emailVerified",
    "subscription",
    "role",
    "chatCount",
    "notificationCount",
    "gender",
    "relationshipStatus",
    "employmentStatus",
    "numberOfchildrens",
    "topHobbies",
    "ethnicity",
    "notificationSettings",
    "dateOfBirth",
  ]);

  // if (user.subscription) sanitized.isPremium = isPremium(user.subscription);

  return sanitized;
};
