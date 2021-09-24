const express = require("express");

const scheduledNotificationDispatcher = require("../../../workers/scheduledNotificationDispatcher");

const router = express.Router();

router.get("/", (req, res) => {
  scheduledNotificationDispatcher();
  res.send({ status: "ok" });
});
module.exports = router;
