const path = require("path");
const nodemailer = require("nodemailer");
const mailerHbs = require("nodemailer-express-handlebars");
const { hbs } = require("../utils/handlebars");

const hbsOptions = {
  viewEngine: hbs,
  extName: ".hbs",
  viewPath: path.join(__dirname, "..", "views"),
};

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

transporter.use("compile", mailerHbs(hbsOptions));

module.exports = transporter;
