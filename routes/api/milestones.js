const express = require("express");
const _ = require("lodash");
const uuid = require("uuid");
const moment = require("moment");

const Milestone = require("../../models/Milestone");
const SubMilestone = require("../../models/SubMilestone");
const Goal = require("../../models/Goal");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const {
  createMilestoneSchema,
  editMilestoneSchema,
  changeMilestoneStatusSchema,
  markDayAsCompletedSchema,
} = require("../../validators/milestone");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");

const {
  getDatesOfRepeatingDays,
  makeMilestone,
} = require("../../methods/milestone");

const { makeSubMilestone } = require("../../methods/subMilestone");

const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

const router = express.Router();

router.get("/goal_milestones/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Invalid Goal Id." } });

  const milestones = await Milestone.find({
    goal: id,
  })
    .populate("members.memberId", USER_PUBLIC_FIELDS)
    .sort("startDate");

  const subMilestones = await SubMilestone.find({
    milestone: milestones.map((m) => m._id),
  });

  let result = [];

  milestones.forEach((ms) => {
    const calculatedMilestone = makeMilestone(ms);
    if (!Array.isArray(calculatedMilestone))
      return result.push(calculatedMilestone);

    calculatedMilestone.forEach((cMs) => {
      result.push(cMs);
    });
  });

  result = result.map((ms) => {
    ms.subMilestones = [];

    const subMs = subMilestones.filter((sMs) => {
      return `${ms._id}` === `${sMs.milestone}`;
    });

    ms.subMilestones = subMs.map((sMs) =>
      makeSubMilestone(sMs, ms.occuringDate)
    );

    return ms;
  });

  res.send(result);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Milestone not found!" } });

  const milestone = await Milestone.findById(id);
  if (!milestone)
    return res.status(404).send({ error: { message: "Milestone not found!" } });

  res.send(milestone);
});

router.post(
  "/create_milestone",
  authorize(),
  requestValidator(createMilestoneSchema),
  async (req, res) => {
    const body = _.pick(req.body, [
      "title",
      "goal",
      "frequency",
      "startDate",
      "endDate",
      "repeatingDays",
      "timeOfDay",
      "members",
    ]);

    const { repeatingDays, startDate, endDate, members = [] } = body;

    body.startDate = new Date(startDate);
    body.endDate = new Date(endDate);

    const { user } = req.authSession;

    if (repeatingDays.length > 0) {
      const repeatingDates = getDatesOfRepeatingDays(
        startDate,
        endDate,
        repeatingDays
      );
      body.repeatingDates = repeatingDates.map((d) =>
        moment(d).format("MM/DD/YYYY")
      );
    }

    body.members = members.map((m) => {
      return { memberId: m };
    });

    const milestone = await new Milestone({
      ...body,
      createdBy: user._id,
    }).save();
    if (milestone) calculateGoalCompletion(milestone.goal);
    res.send(makeMilestone(milestone));
  }
);

// router.put(
//   "/rearrange",
//   requestValidator(rearrangeSubMilestonesSchema),
//   authorize(),
//   async (req, res) => {
//     const { orderIds } = _.pick(req.body, ["orderIds"]);
//     let sortQueryPromises = orderIds.map((id, index) => {
//       return Milestone.findByIdAndUpdate(id, { sortOrder: index });
//     });
//     await Promise.all(sortQueryPromises);
//     res.send({ message: "Successfully Sorted!" });
//   }
// );

router.put(
  "/mark_day_as_completed/:id",
  requestValidator(markDayAsCompletedSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Milestone not found!" } });

    const { completionDate } = _.pick(req.body, ["completionDate"]);
    const milestone = await Milestone.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          completedDates: completionDate,
        },
      },
      { new: true }
    );
    if (milestone) calculateGoalCompletion(milestone.goal);
    res.send(milestone);
  }
);

router.put(
  "/unmark_day_as_completed/:id",
  requestValidator(markDayAsCompletedSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Milestone not found!" } });

    const { completionDate } = _.pick(req.body, ["completionDate"]);
    const milestone = await Milestone.findByIdAndUpdate(
      id,
      {
        $pull: {
          completedDates: completionDate,
        },
      },
      { new: true }
    );
    if (milestone) calculateGoalCompletion(milestone.goal);
    res.send(milestone);
  }
);

// router.put(
//   "/change_status/:id",
//   requestValidator(changeMilestoneStatusSchema),
//   authorize(),
//   async (req, res) => {
//     const { id } = req.params;

//     if (!validateObjectId(id))
//       return res
//         .status(404)
//         .send({ error: { message: "Milestone not found!" } });

//     const body = _.pick(req.body, ["isCompleted"]);

//     const milestone = await Milestone.findByIdAndUpdate(id, body, {
//       new: true,
//     });

//     if (!milestone)
//       return res
//         .status(404)
//         .send({ error: { message: "Milestone not found!" } });

//     res.send(milestone);
//   }
// );

router.put(
  "/edit_milestone/:id",
  authorize(),
  requestValidator(editMilestoneSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Milestone not found!" } });

    const body = _.pick(req.body, [
      "title",
      "frequency",
      "startDate",
      "endDate",
      "repeatingDays",
      "timeOfDay",
      "members",
    ]);

    const { repeatingDays, startDate, endDate, members = [] } = body;

    body.startDate = new Date(startDate);
    body.endDate = new Date(endDate);

    const { user } = req.authSession;

    if (repeatingDays.length > 0) {
      const repeatingDates = getDatesOfRepeatingDays(
        startDate,
        endDate,
        repeatingDays
      );
      body.repeatingDates = repeatingDates.map((d) =>
        moment(d).format("MM/DD/YYYY")
      );
    }

    body.members = members.map((m) => {
      return { memberId: m };
    });
    const milestone = await Milestone.findOneAndUpdate(
      {
        _id: id,
        createdBy: user._id,
      },
      body,
      { new: true }
    );

    if (milestone) calculateGoalCompletion(milestone.goal);

    res.send(makeMilestone(milestone));
  }
);

router.delete("/delete_complete_plan/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  const milestones = await Milestone.deleteMany({ goal: id });

  if (!milestones)
    return res.status(404).send({ error: { message: "Milestone not found!" } });

  res.send({ message: "Plan deleted successfully" });
});

router.delete("/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Milestone not found!" } });

  const milestone = await Milestone.findByIdAndDelete(id);

  if (!milestone)
    return res.status(404).send({ error: { message: "Milestone not found!" } });

  if (milestone) calculateGoalCompletion(milestone.goal);
  res.send(milestone);
});

const calculateGoalCompletion = async (goal) => {
  const milestones = await Milestone.find({
    goal,
  });

  let result = [];

  milestones.forEach((ms) => {
    const calculatedMilestone = makeMilestone(ms);
    if (!Array.isArray(calculatedMilestone))
      return result.push(calculatedMilestone);

    calculatedMilestone.forEach((cMs) => {
      result.push(cMs);
    });
  });

  let completedCount = 0;

  result.forEach((ms) => {
    if (ms.isCompleted) ++completedCount;
  });

  let percentage = Math.ceil((completedCount / result.length) * 100);

  if (percentage > 100) percentage = 100;

  await Goal.findByIdAndUpdate(goal, { completion: percentage });
};

module.exports = router;
