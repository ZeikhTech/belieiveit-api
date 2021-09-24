const express = require("express");
const _ = require("lodash");

const PreDefinedGoal = require("../../models/PreDefinedGoal");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createPreDefinedGoalSchema,
  editPreDefinedGoalSchema,
} = require("../../validators/preDefinedGoal");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Goal not found!" } });

  const goal = await PreDefinedGoal.findById(id);
  if (!goal)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Goal not found!" } });

  res.send(goal);
});

router.get("/", async (req, res) => {
  let { search = "" } = req.query;

  const query = { isActive: true };
  search = search.trim();
  if (search) {
    search = search.split(" ");
    query.$or = search.map((s) => {
      return { title: new RegExp(s, "i") };
    });
  }
  const goals = await PreDefinedGoal.find();
  res.send(goals);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createPreDefinedGoalSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["title", "goalCategory"]);

    const { user } = req.authSession;
    const goal = await new PreDefinedGoal({
      ...body,
      createdBy: user._id,
    }).save();
    res.send(goal);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editPreDefinedGoalSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Goal not found!" } });

    const body = _.pick(req.body, ["title", "goalCategory", "isActive"]);

    const goal = await PreDefinedGoal.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!goal)
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Goal not found!" } });

    res.send(goal);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Goal not found!" } });

  const goal = await PreDefinedGoal.findByIdAndDelete(id);

  if (!goal)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Goal not found!" } });

  res.send(goal);
});

module.exports = router;
