const mailer = require("../services/mailer");

module.exports = async ({ recieverEmail, senderName, message }) => {
  mailer.sendMail({
    to: recieverEmail,
    subject: `You have recieved a chat message from ${senderName}`, // Subject line
    text: `You have recieved a chat message from ${senderName}`, // plain text body
    template: "email/chat_message",
    context: {
      layout: "email",
      heading: "Chat Message",
      from: senderName,
      message,
      logo: process.env.BASE_URL + "/images/email_logo.png",
    },
  });
};
