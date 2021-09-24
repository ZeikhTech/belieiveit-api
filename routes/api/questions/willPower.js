const express = require("express");
const WillPower = require("../../../models/questions/WillPower");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");
const validateObjectId = require("../../../helpers/validateObjectId");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");
const calculateGoalScore = require("../../../methods/calculateGoalScore");

const router = express.Router();

const scoreFields = [
  "sayAffirmation",
  "concentrateOnThoughts",
  "pastDeadline",
  "continueBuilding",
  "acknowledgeMistake",
];

router.get("/:id", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  let willPower = await WillPower.findOne({
    answeredBy: user._id,
    goal: id,
  });
  if (!willPower)
    willPower = await new WillPower({
      answeredBy: user._id,
      goal: id,
    }).save();

  res.send(willPower);
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

      let willPower = await WillPower.findOne({
        answeredBy: user._id,
        goal: id,
      });

      if (!willPower)
        willPower = await new WillPower({
          answeredBy: user._id,
          goal: id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        willPower[field] = req.body[field];
        willPower[field + "Value"] = req.body[field + "Value"];
      });

      willPower.totalWillPowerScore = calculateQuestionGroupScore(
        willPower,
        scoreFields
      );

      await willPower.save();
      // user.clarityOnPurposeScore = willPower.totalWillPowerScore;
      // await user.save();
      calculateGoalScore(id);
      res.send(willPower);
    }
  );
});

module.exports = router;
