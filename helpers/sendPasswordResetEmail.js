const mailer = require("../services/mailer");

module.exports = async (user) => {
  const resetCode = user.generatePasswordResetCode();
  await user.save();
  mailer.sendMail({
    to: user.email,
    subject: "Password Reset Email", // Subject line
    text: "Reset your account password.", // plain text body
    template: "email/reset_password",
    context: {
      layout: "email",
      resetCode,
      heading: "Reset Password",
      logo: process.env.BASE_URL + "/images/email_logo.png",
    },
  });
};
