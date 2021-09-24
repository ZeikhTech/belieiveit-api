const mailer = require("../services/mailer");

module.exports = async (user) => {
  const verificationCode = user.generateEmailVerificationCode();
  await user.save();
  mailer.sendMail({
    to: user.email,
    subject: "Account Verification Email", // Subject line
    text: "Welcome to Believe It", // plain text body
    template: "email/verify_email",
    context: {
      layout: "email",
      verificationCode,
      heading: "Welcome to Believe It",
      logo: process.env.BASE_URL + "/images/email_logo.png",
    },
  });
};
