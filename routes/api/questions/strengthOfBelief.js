const express = require("express");
const StrengthOfBelief = require("../../../models/questions/StrengthOfBelief");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");
const validateObjectId = require("../../../helpers/validateObjectId");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");
const calculateGoalScore = require("../../../methods/calculateGoalScore");

const router = express.Router();

const scoreFields = [
  "affirmationCount",
  "concentrateAndVisualize",
  "howConfident",
  "thinkAboutPastSuccess",
  "recentCriticism",
  "thinkPositivelyToday",
  "thinkNegativelyToday",
];

router.get("/:id", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  let strength = await StrengthOfBelief.findOne({
    answeredBy: user._id,
    goal: id,
  });
  if (!strength)
    strength = await new StrengthOfBelief({
      answeredBy: user._id,
      goal: id,
    }).save();

  res.send(strength);
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

      let strength = await StrengthOfBelief.findOne({
        answeredBy: user._id,
        goal: id,
      });
      if (!strength)
        strength = await new StrengthOfBelief({
          answeredBy: user._id,
          goal: id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        strength[field] = req.body[field];
        strength[field + "Value"] = req.body[field + "Value"];
      });
      strength.totalStrengthScore = calculateQuestionGroupScore(
        strength,
        scoreFields
      );

      await strength.save();
      // user.clarityOnPurposeScore = strength.totalStrengthScore;
      // await user.save();
      calculateGoalScore(id);
      res.send(strength);
    }
  );
});

module.exports = router;
