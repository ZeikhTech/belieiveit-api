const express = require("express");

const { cronWorker } = require("../../../workers/extraAffirmationsScheduler");

const router = express.Router();

router.get("/", (req, res) => {
  cronWorker();
  res.send({ status: "ok" });
});
module.exports = router;
