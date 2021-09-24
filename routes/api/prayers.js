const express = require("express");
const _ = require("lodash");

const Prayer = require("../../models/Prayer");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createPrayerSchema,
  editPrayerSchema,
} = require("../../validators/prayer");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Prayer not found!" } });

  const prayer = await Prayer.findById(id);
  if (!prayer)
    return res.status(404).send({ error: { message: "Prayer not found!" } });

  res.send(prayer);
});

router.get("/", async (req, res) => {
  const prayer = await Prayer.find();
  res.send(prayer);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createPrayerSchema),
  async (req, res) => {
    const body = _.pick(req.body, [
      "name",
      "prayer",
      "translation",
      "type",
      "prayerDays",
    ]);

    const prayer = await new Prayer(body).save();
    res.send(prayer);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editPrayerSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Prayer not found!" } });

    const body = _.pick(req.body, [
      "name",
      "prayer",
      "translation",
      "type",
      "prayerDays",
    ]);

    const prayer = await Prayer.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!prayer)
      return res.status(404).send({ error: { message: "Prayer not found!" } });

    res.send(prayer);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Prayer not found!" } });

  const prayer = await Prayer.findByIdAndDelete(id);

  if (!prayer)
    return res.status(404).send({ error: { message: "Prayer not found!" } });

  res.send(prayer);
});

module.exports = router;
