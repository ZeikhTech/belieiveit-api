const express = require("express");
const _ = require("lodash");
const moment = require("moment");

const GoalCategory = require("../../models/GoalCategory");
const Goal = require("../../models/Goal");
const Milestone = require("../../models/Milestone");
const SubMilestone = require("../../models/SubMilestone");

const PreDefinedMilestone = require("../../models/PreDefinedMilestone");
const PreDefinedSubMilestone = require("../../models/PreDefinedSubMilestone");

const ImageMedia = require("../../models/media/ImageMedia");
const AudioMedia = require("../../models/media/AudioMedia");

const validateObjectId = require("../../helpers/validateObjectId");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const caclulateStars = require("../../methods/caclulateStars");

const {
  createGoalSchema,
  editGoalSchema,
  changeGoalStatusSchema,
  changeCompletionSchema,
} = require("../../validators/goal");
const { getDatesOfRepeatingDays } = require("../../methods/milestone");

const router = express.Router();

const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

router.get("/get_my_goals", authorize(), async (req, res) => {
  const { is_completed, current_date = moment().format("MM/DD/YYYY") } =
    req.query;
  const { user } = req.authSession;

  const query = { createdBy: user._id };

  if (is_completed) {
    query.isCompleted = is_completed === "1" ? true : false;
  }

  let goals = await Goal.find(query).populate(
    "members.memberId",
    USER_PUBLIC_FIELDS
  );

  const result = [];
  for (let i = 0; i < goals.length; ++i) {
    const goal = goals[i];

    const milestones = await Milestone.find({
      goal: goal._id,
      repeatingDates: current_date,
    });
    result.push({ ...goal._doc, todaysPlan: milestones });
  }

  res.send(result);
});

router.get("/get_single_goal/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  const goal = await Goal.findById(id).populate(
    "members.memberId",
    USER_PUBLIC_FIELDS
  );

  if (!goal)
    return res.status(404).send({ error: { message: "Goal Not Found." } });

  const current_date = moment().format("MM/DD/YYYY");

  const milestones = await Milestone.find({
    goal: goal._id,
    repeatingDates: current_date,
  });
  res.send({ ...goal._doc, todaysPlan: milestones });
});

router.post(
  "/create_goal",
  requestValidator(createGoalSchema),
  authorize(),
  async (req, res) => {
    const { user } = req.authSession;

    let subscription = user.subscription || {};
    if (!subscription.maxActiveGoals) subscription.maxActiveGoals = 1;

    const acitveGoalsCount = await Goal.find({
      createdBy: user._id,
      isCompleted: false,
    }).count();

    if (acitveGoalsCount >= subscription.maxActiveGoals)
      return res.status(400).send({
        error: {
          message: `You cannot have more than ${subscription.maxActiveGoals} incomplete goals in ${subscription.type} plan`,
        },
      });

    const body = _.pick(req.body, [
      "title",
      "goalCategory",
      "preDefinedGoalRef",
      "iAm",
      "accomplishingDate",
      "afterAccomplishment",
      "importanceOfGoal",
      "image",
      "audio",
      "song",
      "toPlay",
      "isPublic",
      "articleSuggestions",
    ]);

    const { preDefinedGoalRef, accomplishingDate } = body;

    const goalCategory = await GoalCategory.findById(body.goalCategory);

    if (!goalCategory)
      return res
        .status(400)
        .send({ error: { goalCategory: "Invalid Goal Category" } });

    //setting goal image
    if (body.image) {
      const imageMedia = await ImageMedia.findOneAndUpdate(
        { _id: body.image },
        { isUsed: true },
        { new: true }
      );

      if (!imageMedia)
        return res.status(400).send({
          error: {
            message: "Invalid image id.",
          },
        });

      body.image = imageMedia;
    }

    //setting goal Audio
    if (body.audio) {
      const audioMedia = await AudioMedia.findOneAndUpdate(
        { _id: body.audio },
        { isUsed: true },
        { new: true }
      );

      if (!audioMedia)
        return res.status(400).send({
          error: {
            message: "Invalid audio id.",
          },
        });

      body.audio = audioMedia;
    }

    //setting goal Audio
    if (body.song) {
      const audioMedia = await AudioMedia.findOneAndUpdate(
        { _id: body.song },
        { isUsed: true },
        { new: true }
      );

      if (!audioMedia)
        return res.status(400).send({
          error: {
            message: "Invalid song id.",
          },
        });

      body.song = audioMedia;
    }

    const goal = await new Goal({
      ...body,
      goalCategory,
      createdBy: user._id,
    }).save();

    if (preDefinedGoalRef) {
      // const preDefinedGoal = await PreDefinedGoal.findById(preDefinedGoalRef);
      const today = getToday();

      const preDefinedMilestones = await PreDefinedMilestone.find({
        preDefinedGoal: preDefinedGoalRef,
        isActive: true,
      }).sort("sortOrder");

      const nonRepeatingMs = preDefinedMilestones.filter(
        (ms) => ms.repeatingDays.length === 0
      );

      let intervals = splitDateIntoEqualIntervals(
        today,
        new Date(accomplishingDate),
        nonRepeatingMs.length
      );

      intervals = intervals.map((da) => {
        const date = new Date(da);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      });

      let index = 0;
      preDefinedMilestones.forEach(async (predefniedMilestone) => {
        const milestoneBody = {
          title: predefniedMilestone.title,
          createdBy: user._id,
          goal: goal._id,
          frequency: predefniedMilestone.frequency,
          timeOfDay: predefniedMilestone.timeOfDay,
          repeatingDays: predefniedMilestone.repeatingDays,
        };

        if (predefniedMilestone.repeatingDays.length > 0) {
          //repeating milestone

          milestoneBody.startDate = intervals[index];
          milestoneBody.endDate = intervals[index + 1];

          const repeatingDates = getDatesOfRepeatingDays(
            today,
            body.accomplishingDate,
            predefniedMilestone.repeatingDays
          );
          milestoneBody.repeatingDates = repeatingDates.map((d) =>
            moment(d).format("MM/DD/YYYY")
          );
        } else {
          //non repeating milestons
          milestoneBody.startDate = intervals[index];
          milestoneBody.endDate = intervals[index + 1];
          index++;
        }

        const mileStone = await new Milestone(milestoneBody).save();

        const subMilestones = await PreDefinedSubMilestone.find({
          preDefinedMilestone: predefniedMilestone._id,
          isActive: true,
        }).sort("sortOrder");

        subMilestones.forEach(async (subMs) => {
          await new SubMilestone({
            title: subMs.title,
            createdBy: user._id,
            goal: goal._id,
            milestone: mileStone._id,
          }).save();
        });
      });
    }
    res.send(goal);
  }
);

router.put(
  "/update_completion/:id",
  requestValidator(changeCompletionSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Goal not found!" } });

    const body = _.pick(req.body, ["completion"]);
    const { user } = req.authSession;

    const goal = await Goal.findOneAndUpdate(
      { _id: id, createdBy: user._id },
      body,
      { new: true }
    );

    res.send(goal);
  }
);

router.put(
  "/change_status/:id",
  requestValidator(changeGoalStatusSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Goal not found!" } });

    const body = _.pick(req.body, ["isCompleted"]);

    const goal = await Goal.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!goal)
      return res.status(404).send({ error: { message: "Goal not found!" } });

    caclulateStars(goal.createdBy);

    res.send(goal);
  }
);

router.put(
  "/edit_goal/:id",
  requestValidator(editGoalSchema),
  authorize(),
  async (req, res) => {
    const { id } = req.params;
    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Goal not found!" } });

    const body = _.pick(req.body, [
      "title",
      "goalCategory",
      "preDefinedGoalRef",
      "iAm",
      "accomplishingDate",
      "afterAccomplishment",
      "importanceOfGoal",
      "image",
      "audio",
      "song",
      "toPlay",
      "isPublic",
      "articleSuggestions",
    ]);

    const { user } = req.authSession;
    const goalCategory = await GoalCategory.findById(body.goalCategory);

    if (!goalCategory)
      return res
        .status(400)
        .send({ error: { goalCategory: "Invalid Goal Category" } });

    body.goalCategory = goalCategory;

    //setting goal image
    if (body.image) {
      const imageMedia = await ImageMedia.findOneAndUpdate(
        { _id: body.image },
        { isUsed: true },
        { new: true }
      );

      if (!imageMedia)
        return res.status(400).send({
          error: {
            message: "Invalid image id.",
          },
        });

      body.image = imageMedia;
    }

    //setting goal Audio
    if (body.audio) {
      const audioMedia = await AudioMedia.findOneAndUpdate(
        { _id: body.audio },
        { isUsed: true },
        { new: true }
      );

      if (!audioMedia)
        return res.status(400).send({
          error: {
            message: "Invalid audio id.",
          },
        });

      body.audio = audioMedia;
    }

    //setting goal Audio
    if (body.song) {
      const audioMedia = await AudioMedia.findOneAndUpdate(
        { _id: body.song },
        { isUsed: true },
        { new: true }
      );

      if (!audioMedia)
        return res.status(400).send({
          error: {
            message: "Invalid song id.",
          },
        });

      body.song = audioMedia;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, createdBy: user._id },
      body,
      { new: true }
    );

    if (!goal)
      return res.status(404).send({ error: { message: "Goal not found!" } });

    res.send(goal);
  }
);

router.delete("/delete_goal/:id", authorize(), async (req, res) => {
  const { id } = req.params;
  const { user } = req.authSession;

  const goal = await Goal.findOneAndRemove({ createdBy: user._id, _id: id });

  if (!goal)
    return res.status(404).send({ error: { message: "Goal Not Found." } });

  res.send(goal);
});

function splitDateIntoEqualIntervals(startDate, endData, numberOfIntervals) {
  let diff = endData.getTime() - startDate.getTime();
  let intervalLength = diff / numberOfIntervals;
  let intervals = [startDate];
  for (let i = 1; i <= numberOfIntervals; i++)
    intervals.push(new Date(startDate.getTime() + i * intervalLength));
  return intervals;
}

function getToday() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return new Date(`${month}/${day}/${year}`);
}

module.exports = router;
