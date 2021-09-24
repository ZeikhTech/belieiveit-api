const express = require("express");
const GoalPlan = require("../../../models/questions/GoalPlan");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");
const validateObjectId = require("../../../helpers/validateObjectId");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");
const calculateGoalScore = require("../../../methods/calculateGoalScore");

const router = express.Router();

const scoreFields = [
  "haveSolidPlan",
  "startEndDates",
  "pastDeadlineItems",
  "continueBuilding",
  "analyzeGoalPlan",
  "shortcutToSuccess",
];

router.get("/:id", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  let goalPlan = await GoalPlan.findOne({
    answeredBy: user._id,
    goal: id,
  });
  if (!goalPlan)
    goalPlan = await new GoalPlan({
      answeredBy: user._id,
      goal: id,
    }).save();

  res.send(goalPlan);
});

const apis = [{ route: "/update_all/:id", fieldName: scoreFields }];

scoreFields.forEach((field) => {
  apis.push({
    route: "/" + field + "/:id",
    fieldName: field,
  });
});

apis.forEach(({ route, fieldName }) => {
  router.post(
    route,
    requestValidator(dynamicSchema(fieldName)),
    authorize(),
    async (req, res) => {
      const { user } = req.authSession;

      const { id } = req.params;

      if (!validateObjectId(id))
        return res.status(404).send({ error: { message: "Goal not found!" } });

      let goalPlan = await GoalPlan.findOne({
        answeredBy: user._id,
        goal: id,
      });
      if (!goalPlan)
        goalPlan = await new GoalPlan({
          answeredBy: user._id,
          goal: id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        goalPlan[field] = req.body[field];
        goalPlan[field + "Value"] = req.body[field + "Value"];
      });
      goalPlan.totalGoalPlanScore = calculateQuestionGroupScore(
        goalPlan,
        scoreFields
      );

      await goalPlan.save();
      // user.clarityOnPurposeScore = goalPlan.totalGoalPlanScore;
      // await user.save();
      calculateGoalScore(id);
      res.send(goalPlan);
    }
  );
});

module.exports = router;
