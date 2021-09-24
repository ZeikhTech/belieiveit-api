const { FREE } = require("../enums/subscription_plans");

module.exports = (subscription) => {
  if (subscription.type === FREE.name) return false;
  try {
    const currentDate = new Date();
    const subscriptionEndDate = new Date(subscription.endDate);

    if (subscriptionEndDate < currentDate) return false;

    return true;
  } catch (err) {
    return false;
  }
};
