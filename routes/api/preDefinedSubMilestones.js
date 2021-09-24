const express = require("express");
const _ = require("lodash");

const PreDefinedSubMilestone = require("../../models/PreDefinedSubMilestone");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createPreDefinedSubMilestoneSchema,
  editPreDefinedSubMilestoneSchema,
  rearrangeSubMilestonesSchema,
} = require("../../validators/preDefinedSubMilestone");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/sub_milestones/:id", async (req, res) => {
  const { id } = req.params;

  const milestones = await PreDefinedSubMilestone.find({
    preDefinedMilestone: id,
  }).sort("sortOrder -_id");

  res.send(milestones);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  const milestone = await PreDefinedSubMilestone.findById(id);
  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  res.send(milestone);
});

router.get("/", async (req, res) => {
  const milestones = await PreDefinedSubMilestone.find();
  res.send(milestones);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createPreDefinedSubMilestoneSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["title", "preDefinedMilestone"]);

    const { user } = req.authSession;
    const milestone = await new PreDefinedSubMilestone({
      ...body,
      createdBy: user._id,
    }).save();
    res.send(milestone);
  }
);

router.put(
  "/rearrange",
  requestValidator(rearrangeSubMilestonesSchema),
  authorize(ADMIN),
  async (req, res) => {
    const { orderIds } = _.pick(req.body, ["orderIds"]);
    let sortQueryPromises = orderIds.map((id, index) => {
      return PreDefinedSubMilestone.findByIdAndUpdate(id, { sortOrder: index });
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
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  const body = _.pick(req.body, ["isActive"]);

  const milestone = await PreDefinedSubMilestone.findByIdAndUpdate(id, body, {
    new: true,
  });

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  res.send(milestone);
});

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editPreDefinedSubMilestoneSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

    const body = _.pick(req.body, ["title", "preDefinedMilestone"]);

    const milestone = await PreDefinedSubMilestone.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!milestone)
      return res
        .status(404)
        .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

    res.send(milestone);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  const milestone = await PreDefinedSubMilestone.findByIdAndDelete(id);

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Pre Defined Sub Milestone not found!" } });

  res.send(milestone);
});

module.exports = router;
