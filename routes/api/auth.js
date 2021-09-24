const path = require("path");
const express = require("express");
const _ = require("lodash");

const User = require("../../models/User");
const AuthSession = require("../../models/AuthSession");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const { FREE } = require("../../enums/subscription_plans");

const {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  passwordResetVerifiationSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updatePushNotificationSchema,
} = require("../../validators/auth");
const jwt = require("../../services/jwt");

const sendEmailVerificationEmail = require("../../helpers/sendEmailVerificationEmail");
const sendPasswordResetEmail = require("../../helpers/sendPasswordResetEmail");
const axios = require("axios");
const sanitizeUser = require("../../sanitizers/user");
const reScheduleNotifications = require("../../helpers/reScheduleNotifications");

const router = express.Router();

const { google } = require("googleapis");
const androidpublisher = google.androidpublisher("v3");
const applePayValidationUrl =
  process.env.APPLE_PAY_MODE === "sandbox"
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

const createUserSessionAndSendResponse = async (req, res) => {
  const { timezone } = _.pick(req.body, ["timezone"]);
  const { user } = req;
  if (timezone) {
    user.timezone = timezone;
    await user.save();
  }
  const session = await new AuthSession({
    user: user._id,
    createdAt: new Date(),
  }).save();
  const token = jwt.encrypt({ _id: session._id });
  res.header("token", token).header("Access-Control-Expose-Headers", "token");
  res.send({ token, user: sanitizeUser(user) });
};

// @route /me
router.get("/me", authorize("", { emailVerifid: false }), async (req, res) => {
  const { user } = req.authSession;

  let isPremium = false;
  if (user.subscription.type === "FREE")
    return res.send({ ...sanitizeUser(user), isPremium });

  const currentTimeStamp = Date.now();

  let endTimeStamp = 0;

  if (user.subscription.paymentMethod === "google_pay") {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "../../google_service_account.json"),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    // Acquire an auth client, and bind it to all future calls
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const googleSubRes = await androidpublisher.purchases.subscriptions.get({
      // The package name of the application for which this subscription was purchased (for example, 'com.some.thing').
      packageName: "me.believeit.www",
      // The purchased subscription ID (for example, 'monthly001').
      subscriptionId: user.subscription.subscriptionId,
      // The token provided to the user's device when the subscription was purchased.
      token: user.subscription.paymentToken,
    });

    endTimeStamp = parseInt(googleSubRes.data.expiryTimeMillis);
    if (
      // currentTimeStamp < endTimeStamp &&
      googleSubRes.data.paymentState == 1
    ) {
      isPremium = true;
    }
  }

  if (user.subscription.paymentMethod === "apple_pay") {
    const applePayRes = await axios.post(applePayValidationUrl, {
      "receipt-data": user.subscription.paymentToken,
      password: "80e181131eec446489cd8bdedfe0c777",
      "exclude-old-transactions": true,
    });

    const latestRecipt = applePayRes.data.latest_receipt_info[0];

    endTimeStamp = parseInt(latestRecipt.expires_date_ms) || 0;

    if (currentTimeStamp < endTimeStamp) {
      isPremium = true;
    }
  }

  if (!isPremium) {
    user.subscription.type = FREE.name;
    user.subscription.isTrial = false;
    user.subscription.isUnlimited = FREE.isUnlimited;
    user.subscription.maxActiveGoals = 1;
    await user.save();
  }
  res.send({ ...sanitizeUser(user), isPremium });
});

// @route /signup
router.post(
  "/signup",
  requestValidator(signupSchema),
  async (req, res, next) => {
    const body = _.pick(req.body, [
      "firstname",
      "lastname",
      "email",
      "password",
      "timezone",
    ]);

    //check if user exists
    const previousUser = await User.findOne({ email: body.email });
    if (previousUser)
      return res.status(409).send({
        error: {
          message: "User already exists!",
        },
      });

    const user = new User({ ...body, createdAt: new Date() });
    user.password = await user.hashPassword(body.password);
    await user.save();
    sendEmailVerificationEmail(user);

    req.user = user;
    reScheduleNotifications(user);
    next();
  },
  createUserSessionAndSendResponse
);

// @route /signin
router.post(
  "/signin",
  requestValidator(loginSchema),
  async (req, res, next) => {
    const { email, password } = _.pick(req.body, ["email", "password"]);

    //check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).send({
        error: {
          message: "Invalid email or password!",
        },
      });

    //check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(404).send({
        error: {
          message: "Invalid email or password!",
        },
      });

    req.user = user;
    next();
  },
  createUserSessionAndSendResponse
);

// @route /resend_verification_email
router.post(
  "/resend_verification_email",
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const { user } = req.authSession;

    if (user.emailVerified)
      return res.status(400).send({
        error: {
          message: "Email is already verified.",
        },
      });
    sendEmailVerificationEmail(user);

    res.send({ message: "Email Sent" });
  }
);

// @route /request_password_reset
router.post(
  "/request_password_reset",
  requestValidator(requestPasswordResetSchema),
  async (req, res) => {
    const { email } = _.pick(req.body, ["email"]);
    //check if email already exists
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).send({
        error: {
          message: "User not found!",
        },
      });

    sendPasswordResetEmail(user);

    res.send({
      message: "Password reset code has been sent to your email.",
    });
  }
);
// @route /password_reset_code_verification
router.post(
  "/password_reset_code_verification",
  requestValidator(passwordResetVerifiationSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["email", "resetCode"]);
    const { email, resetCode } = body;
    const user = await User.findOne({ email });
    if (!user) res.status(404).send({ error: { message: "User not found!" } });

    if (user.passwordResetCode !== resetCode)
      return res.status(400).send({ error: { message: "Invalid Code" } });

    res.send({ message: "OK!" });
  }
);

// @route /change_password
router.put(
  "/change_password",
  requestValidator(changePasswordSchema),
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const body = _.pick(req.body, ["password", "previousPassword"]);
    const { previousPassword, password } = body;

    const { user } = req.authSession;

    const isPreviousPassValid = await user.comparePassword(previousPassword);
    if (!isPreviousPassValid)
      return res.status(400).send({
        error: {
          message: "Invalid Password",
        },
      });

    user.password = await user.hashPassword(password);
    user.save();

    res.send({ message: "Password Changed Successfully" });
  }
);

// @route /reset_password
router.put(
  "/reset_password",
  requestValidator(resetPasswordSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["email", "resetCode", "password"]);

    const { email, password, resetCode } = body;
    //check if email already exists

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).send({
        error: {
          message: "User not found!",
        },
      });

    if (user.passwordResetCode !== resetCode)
      return res.status(400).send({
        error: {
          message: "Invalid reset code.",
        },
      });

    //generating password hash
    user.password = await user.hashPassword(password);
    user.passwordResetCode = "";
    await user.save();

    res.send({ message: "password reset successfull" });
  }
);

// @route /verify_email
router.put(
  "/verify_email",
  requestValidator(verifyEmailSchema),
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const body = _.pick(req.body, ["verificationCode"]);
    const { user } = req.authSession;

    if (user.emailVerificationCode !== body.verificationCode)
      return res.status(400).send({
        error: {
          message: "Invalid verification code.",
        },
      });

    user.emailVerified = true;
    user.emailVerificationCode = "";

    await user.save();
    res.send({ message: "your email is verified." });
  }
);

router.put(
  "/register_push_notification_token",
  requestValidator(updatePushNotificationSchema),
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const { pushNotificationToken } = _.pick(req.body, [
      "pushNotificationToken",
    ]);
    const { authSession } = req;
    authSession.pushNotificationToken = pushNotificationToken;
    await authSession.save();
    res.send({ message: "Push notification token updated." });
  }
);

router.delete("/signout", authorize(), async (req, res) => {
  const { authSession } = req;
  authSession.isExpired = true;
  await authSession.save();
  res.send({ message: "Signout successfull." });
});

module.exports = router;
