const express = require("express");
const _ = require("lodash");

const Ethnicity = require("../../models/Ethnicity");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createEthnicitySchema,
  editEthnicitySchema,
} = require("../../validators/ethnicity");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Ethnicity not found!" } });

  const ethnicity = await Ethnicity.findById(id);
  if (!ethnicity)
    return res.status(404).send({ error: { message: "Ethnicity not found!" } });

  res.send(ethnicity);
});

router.get("/", async (req, res) => {
  const ethnicity = await Ethnicity.find().sort("name");
  res.send(ethnicity);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createEthnicitySchema),
  async (req, res) => {
    const body = _.pick(req.body, ["name"]);

    const ethnicity = await new Ethnicity(body).save();
    res.send(ethnicity);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editEthnicitySchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Ethnicity not found!" } });

    const body = _.pick(req.body, ["name"]);

    const ethnicity = await Ethnicity.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!ethnicity)
      return res
        .status(404)
        .send({ error: { message: "Ethnicity not found!" } });

    res.send(ethnicity);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Ethnicity not found!" } });

  const ethnicity = await Ethnicity.findByIdAndDelete(id);

  if (!ethnicity)
    return res.status(404).send({ error: { message: "Ethnicity not found!" } });

  res.send(ethnicity);
});

module.exports = router;
