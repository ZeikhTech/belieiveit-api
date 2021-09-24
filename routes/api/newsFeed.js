const express = require("express");
const authorize = require("../../middlewares/authorize");

const router = express.Router();

router.get("/", authorize(""), async (req, res) => {
  const { last_post_id = "" } = req.query;

  const query = {};
});
module.exports = router;
