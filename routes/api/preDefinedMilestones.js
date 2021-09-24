const express = require("express");
const _ = require("lodash");

const PreDefinedMilestone = require("../../models/PreDefinedMilestone");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createPreDefinedMilestoneSchema,
  editPreDefinedMilestoneSchema,
  rearrangeMilestonesSchema,
} = require("../../validators/preDefinedMilestone");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/goal_milestones/:id", async (req, res) => {
  const { id } = req.params;
  const milestones = await PreDefinedMilestone.find({
    preDefinedGoal: id,
  }).sort("sortOrder -_id");

  res.send(milestones);
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  const milestone = await PreDefinedMilestone.findById(id);
  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  res.send(milestone);
});

router.get("/", async (req, res) => {
  const milestones = await PreDefinedMilestone.find();
  res.send(milestones);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createPreDefinedMilestoneSchema),
  async (req, res) => {
    const body = _.pick(req.body, [
      "title",
      "frequency",
      "preDefinedGoal",
      "repeatingDays",
      "timeOfDay",
    ]);

    const { user } = req.authSession;
    const milestone = await new PreDefinedMilestone({
      ...body,
      createdBy: user._id,
    }).save();
    res.send(milestone);
  }
);

router.put(
  "/rearrange",
  requestValidator(rearrangeMilestonesSchema),
  authorize(ADMIN),
  async (req, res) => {
    const { orderIds } = _.pick(req.body, ["orderIds"]);
    let sortQueryPromises = orderIds.map((id, index) => {
      return PreDefinedMilestone.findByIdAndUpdate(id, { sortOrder: index });
    });
    await Promise.all(sortQueryPromises);
    res.send({ message: "Successfully Sorted!" });
  }
);

router.put("/change_status/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  const body = _.pick(req.body, ["isActive"]);

  const milestone = await PreDefinedMilestone.findByIdAndUpdate(id, body, {
    new: true,
  });

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  res.send(milestone);
});

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editPreDefinedMilestoneSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Milestone not found!" } });

    const body = _.pick(req.body, [
      "title",
      "frequency",
      "preDefinedGoal",
      "repeatingDays",
      "timeOfDay",
    ]);

    const milestone = await PreDefinedMilestone.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!milestone)
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Milestone not found!" } });

    res.send(milestone);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  const milestone = await PreDefinedMilestone.findByIdAndDelete(id);

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Milestone not found!" } });

  res.send(milestone);
});

module.exports = router;
