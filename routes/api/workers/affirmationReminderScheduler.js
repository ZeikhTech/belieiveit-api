const express = require("express");

const { cronWorker } = require("../../../workers/affirmationReminderScheduler");

const router = express.Router();

router.get("/", (req, res) => {
  cronWorker();
  res.send({ status: "ok" });
});

module.exports = router;
