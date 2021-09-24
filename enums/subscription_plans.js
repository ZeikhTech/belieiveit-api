module.exports = Object.freeze({
  FREE: {
    name: "FREE",
    maxActiveGoals: 1,
    price: 0, //in $s
    isUnlimited: true,
    googlePayId: "",
  },
  MONTHLY: {
    name: "MONTHLY",
    maxActiveGoals: 99999999,
    price: 4.99, //in $s
    isUnlimited: false,
    googlePayId: "bi_premium_monthly",
  },
  YEARLY: {
    name: "YEARLY",
    maxActiveGoals: 99999999,
    price: 49.99, //in $s
    isUnlimited: false,
    googlePayId: "bi_premium_yearly",
  },
});
