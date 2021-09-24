const express = require("express");
const DefinedGoal = require("../../../models/questions/DefinedGoal");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");
const validateObjectId = require("../../../helpers/validateObjectId");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");
const calculateGoalScore = require("../../../methods/calculateGoalScore");
const router = express.Router();

const scoreFields = [
  "isDefiniteGoal",
  "presistentlyWorkOnGoal",
  // "goalImportance",
  "oftenThingAboutGoal",
  "clearIdea",
  "dedicatingEnough",
];

router.get("/:id", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  let definedGoal = await DefinedGoal.findOne({
    answeredBy: user._id,
    goal: id,
  });
  if (!definedGoal)
    definedGoal = await new DefinedGoal({
      answeredBy: user._id,
      goal: id,
    }).save();

  res.send(definedGoal);
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

      let definedGoal = await DefinedGoal.findOne({
        answeredBy: user._id,
        goal: id,
      });
      if (!definedGoal)
        definedGoal = await new DefinedGoal({
          answeredBy: user._id,
          goal: id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        definedGoal[field] = req.body[field];
        definedGoal[field + "Value"] = req.body[field + "Value"];
      });

      definedGoal.totalDefinedGoalScore = calculateQuestionGroupScore(
        definedGoal,
        scoreFields
      );

      await definedGoal.save();
      // user.clarityOnPurposeScore = definedGoal.totalDefinedGoalScore;
      // await user.save();

      calculateGoalScore(id);
      res.send(definedGoal);
    }
  );
});

module.exports = router;
