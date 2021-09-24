const path = require("path");
const express = require("express");
const axios = require("axios");
const moment = require("moment");
const { google } = require("googleapis");
const authorize = require("../../middlewares/authorize");

const _ = require("lodash");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const androidpublisher = google.androidpublisher("v3");

const { FREE, MONTHLY, YEARLY } = require("../../enums/subscription_plans");
const requestValidator = require("../../middlewares/requestValidator");

const {
  stirpePaymentSchema,
  googlePaySchema,
  applePaySchema,
} = require("../../validators/subscription");

const applePayValidationUrl =
  process.env.APPLE_PAY_MODE === "sandbox"
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

const router = express.Router();

router.post("/subscribe_free_plan", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const currentDate = Date.now();

  const plan = {
    type: FREE.name,
    isTrial: false,
    isUnlimited: FREE.isUnlimited,
    subscriptionStart: currentDate,
    subscriptionEnd: null,
    maxActiveGoals: FREE.maxActiveGoals,
  };

  user.subscription = plan;
  await user.save();
  res.send(_.pick(user, ["subscription"]));
});

router.post(
  "/subscribe_monthly_plan/stripe",
  requestValidator(stirpePaymentSchema),
  authorize(),
  async (req, res) => {
    const { user } = req.authSession;
    const { stripePaymentToken } = _.pick(req.body, ["stripePaymentToken"]);

    if (!user.stripeCustomerId) {
      // create customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        source: stripePaymentToken,
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }

    //
    const charge = await stripe.charges.create({
      amount: MONTHLY.price * 100,
      currency: "usd",

      description: "User subscribed to monthly plan.",
      metadata: {
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
      },
      customer: user.stripeCustomerId,
    });

    const startDate = moment();
    const endDate = moment().add(1, "months");
    if (user.subscription && user.subscription.type === MONTHLY.name) {
      user.subscription.type = MONTHLY.name;
      user.subscription.subscriptionStart = startDate.toDate();
      user.subscription.subscriptionEnd = endDate.toDate();
      user.subscription.isUnlimited = MONTHLY.isUnlimited;
      user.subscription.isTrial = false;
      user.subscription.maxActiveGoals = MONTHLY.maxActiveGoals;
    } else {
      user.subscription = {
        type: MONTHLY.name,
        subscriptionStart: startDate.toDate(),
        subscriptionEnd: endDate.toDate(),
        isUnlimited: MONTHLY.isUnlimited,
        isTrial: false,
        maxActiveGoals: MONTHLY.maxActiveGoals,
      };
    }

    await user.save();
    res.send(_.pick(user, ["subscription"]));
  }
);

router.post(
  "/subscribe_plan_google_pay",
  requestValidator(googlePaySchema),
  authorize(),
  async (req, res) => {
    const { purchaseToken, subscriptionId } = _.pick(req.body, [
      "purchaseToken",
      "subscriptionId",
    ]);

    const packageName = "me.believeit.www";
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "../../google_service_account.json"),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    // Acquire an auth client, and bind it to all future calls
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const googleSubRes = await androidpublisher.purchases.subscriptions.get({
      // The package name of the application for which this subscription was purchased (for example, 'com.some.thing').
      packageName,
      // The purchased subscription ID (for example, 'monthly001').
      subscriptionId,
      // The token provided to the user's device when the subscription was purchased.
      token: purchaseToken,
    });

    const paymentObj = googleSubRes.data;

    // giving user previlleges

    const { user } = req.authSession;
    const startDate = moment();
    let endDate = moment().add(1, "months");
    if (subscriptionId === "bi_premium_yearly") {
      endDate = moment().add(1, "year");
    }

    const SUB = subscriptionId === "bi_premium_yearly" ? YEARLY : MONTHLY;
    if (user.subscription && user.subscription.type === SUB.name) {
      user.subscription.paymentMethod = "google_pay";
      user.subscription.paymentToken = purchaseToken;
      user.subscription.subscriptionId = subscriptionId;
      user.subscription.type = SUB.name;
      user.subscription.subscriptionStart = startDate.toDate();
      user.subscription.subscriptionEnd = endDate.toDate();
      user.subscription.isUnlimited = SUB.isUnlimited;
      user.subscription.isTrial = false;
      user.subscription.maxActiveGoals = SUB.maxActiveGoals;
    } else {
      user.subscription = {
        paymentMethod: "google_pay",
        paymentToken: purchaseToken,
        subscriptionId: subscriptionId,
        type: SUB.name,
        subscriptionStart: startDate.toDate(),
        subscriptionEnd: endDate.toDate(),
        isUnlimited: SUB.isUnlimited,
        isTrial: false,
        maxActiveGoals: SUB.maxActiveGoals,
      };
    }
    await user.save();
    ///acknowledge
    const googleAckRes =
      await androidpublisher.purchases.subscriptions.acknowledge({
        // The package name of the application for which this subscription was purchased (for example, 'com.some.thing').
        packageName,
        // The purchased subscription ID (for example, 'monthly001').
        subscriptionId,
        // The token provided to the user's device when the subscription was purchased.
        token: purchaseToken,
      });

    res.send(user.subscription);
  }
);

router.post(
  "/subscribe_plan_apple_pay",
  requestValidator(applePaySchema),
  authorize(),
  async (req, res) => {
    const {
      reciptData,
      password,
      excludeOldTransactions = true,
      subscriptionType,
    } = _.pick(req.body, [
      "reciptData",
      "password",
      "excludeOldTransactions",
      "subscriptionType",
    ]);

    const applePayRes = await axios.post(applePayValidationUrl, {
      "receipt-data": reciptData,
      password,
      "exclude-old-transactions": excludeOldTransactions,
    });

    if (applePayRes.status !== 200)
      return res
        .status(400)
        .send({ error: { message: "Invalid Recipt data!" } });

    //
    const latestRecipt = applePayRes.data.latest_receipt_info[0];

    // const expiryDate = latestRecipt.expires_date;
    //give accesss

    const { user } = req.authSession;
    const startDate = moment();
    // const endDate = moment(expiryDate);

    const SUB = subscriptionType === "yearly" ? YEARLY : MONTHLY;
    if (user.subscription && user.subscription.type === SUB.name) {
      user.subscription.paymentMethod = "apple_pay";
      user.subscription.paymentToken = reciptData;
      user.subscription.type = SUB.name;
      user.subscription.subscriptionStart = startDate.toDate();
      // user.subscription.subscriptionEnd = endDate.toDate();
      user.subscription.isUnlimited = SUB.isUnlimited;
      user.subscription.isTrial = false;
      user.subscription.maxActiveGoals = SUB.maxActiveGoals;
    } else {
      user.subscription = {
        paymentMethod: "apple_pay",
        paymentToken: reciptData,
        subscriptionId: subscriptionType,
        type: SUB.name,
        subscriptionStart: startDate.toDate(),
        // subscriptionEnd: endDate.toDate(),
        isUnlimited: SUB.isUnlimited,
        isTrial: false,
        maxActiveGoals: SUB.maxActiveGoals,
      };
    }
    await user.save();
    res.send(user.subscription);
  }
);
module.exports = router;
