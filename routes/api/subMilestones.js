const express = require("express");
const _ = require("lodash");

const SubMilestone = require("../../models/SubMilestone");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const {
  createSubMilestoneSchema,
  editSubMilestoneSchema,
  changeSubMilestoneStatusSchema,
  rearrangeSubMilestonesSchema,
  markDayAsCompletedSchema,
  milestonesListSchema,
} = require("../../validators/subMilestone");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");

const { makeSubMilestone } = require("../../methods/subMilestone");

const router = express.Router();

router.post(
  "/list/:id",
  requestValidator(milestonesListSchema),
  async (req, res) => {
    const { id } = req.params;
    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Invalid Milestone Id." } });

    const { occuringDate } = _.pick(req.body, ["occuringDate"]);
    const milestones = await SubMilestone.find({
      milestone: id,
    }).sort("sortOrder");

    res.send(milestones.map((ms) => makeSubMilestone(ms, occuringDate)));
  }
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Sub Milestone not found!" } });

  const milestone = await SubMilestone.findById(id);

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Sub Milestone not found!" } });

  res.send(milestone);
});

router.post(
  "/create_sub_milestone",
  requestValidator(createSubMilestoneSchema),
  authorize(),
  async (req, res) => {
    const body = _.pick(req.body, ["title", "milestone"]);

    const { user } = req.authSession;

    const milestone = await new SubMilestone({
      ...body,
      createdBy: user._id,
    }).save();
    res.send(milestone);
  }
);

router.put(
  "/rearrange",
  requestValidator(rearrangeSubMilestonesSchema),
  authorize(),
  async (req, res) => {
    const { orderIds } = _.pick(req.body, ["orderIds"]);
    let sortQueryPromises = orderIds.map((id, index) => {
      return SubMilestone.findByIdAndUpdate(id, { sortOrder: index });
    });
    await Promise.all(sortQueryPromises);
    res.send({ message: "Successfully Sorted!" });
  }
);

// router.put(
//   "/change_status/:id",
//   requestValidator(changeSubMilestoneStatusSchema),
//   authorize(),
//   async (req, res) => {
//     const { id } = req.params;

//     if (!validateObjectId(id))
//       return res.status(404).send({
//         error: { message: "Sub Milestone not found!" },
//       });

//     const body = _.pick(req.body, ["isCompleted"]);

//     const milestone = await SubMilestone.findByIdAndUpdate(id, body, {
//       new: true,
//     });

//     if (!milestone)
//       return res.status(404).send({
//         error: { message: "Sub Milestone not found!" },
//       });

//     res.send(milestone);
//   }
// );

router.put(
  "/edit_sub_milestone/:id",
  authorize(),
  requestValidator(editSubMilestoneSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Sub Milestone not found!" } });

    const body = _.pick(req.body, ["title"]);

    const milestone = await SubMilestone.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!milestone)
      return res
        .status(404)
        .send({ error: { message: "Sub Milestone not found!" } });

    res.send(milestone);
  }
);

router.put(
  "/mark_as_completed/:id",
  requestValidator(markDayAsCompletedSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Sub Milestone not found!" } });

    const { completionDate } = _.pick(req.body, ["completionDate"]);
    const milestone = await SubMilestone.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          completedDates: completionDate,
        },
      },
      { new: true }
    );

    res.send(milestone);
  }
);


router.put(
  "/unmark_as_completed/:id",
  requestValidator(markDayAsCompletedSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Sub Milestone not found!" } });

    const { completionDate } = _.pick(req.body, ["completionDate"]);
    const milestone = await SubMilestone.findByIdAndUpdate(
      id,
      {
        $pull: {
          completedDates: completionDate,
        },
      },
      { new: true }
    );

    res.send(milestone);
  }
);

router.delete("/delete_sub_milestone/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Sub Milestone not found!" } });

  const milestone = await SubMilestone.findByIdAndDelete(id);

  if (!milestone)
    return res
      .status(404)
      .send({ error: { message: "Sub Milestone not found!" } });

  res.send(milestone);
});

module.exports = router;
