const yup = require("yup");

const email = yup.string().trim().email().min(1).max(100).required();
const password = yup.string().trim().min(1).max(25).required();
const timezone = yup.string().trim().min(1).max(255).optional();

exports.loginSchema = yup.object().shape({
  email,
  password,
  timezone,
});

exports.signupSchema = yup.object().shape({
  firstname: yup.string().trim().min(1).max(100).required(),
  lastname: yup.string().trim().min(1).max(100).required(),
  email,
  password,
  timezone,
});

exports.verifyEmailSchema = yup.object().shape({
  verificationCode: yup.string().trim().min(6).max(6).required(),
});

exports.requestPasswordResetSchema = yup.object().shape({
  email,
});

exports.passwordResetVerifiationSchema = yup.object().shape({
  email,
  resetCode: yup.string().trim().min(6).max(6).required(),
});

exports.resetPasswordSchema = yup.object().shape({
  email,
  resetCode: yup.string().trim().min(6).max(6).required(),
  password,
});

exports.changePasswordSchema = yup.object().shape({
  previousPassword: password,
  password,
});

exports.updatePushNotificationSchema = yup.object().shape({
  pushNotificationToken: yup.string().trim().required(),
});
