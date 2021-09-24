const express = require("express");
const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const { feedBackSchema } = require("../../validators/feedback");
const sendFeedbackEmail = require("../../helpers/sendFeedbackEmail");
const router = express.Router();

router.post(
  "/",
  requestValidator(feedBackSchema),
  authorize(),
  async (req, res) => {
    //TODO: send email
    sendFeedbackEmail(req.body);
    res.send({ message: "Feedback Email sent" });
  }
);

module.exports = router;
