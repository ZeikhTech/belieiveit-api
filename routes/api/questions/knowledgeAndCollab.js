const express = require("express");
const KnowledgeAndCollab = require("../../../models/questions/KnowledgeAndCollab");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");
const validateObjectId = require("../../../helpers/validateObjectId");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");
const calculateGoalScore = require("../../../methods/calculateGoalScore");

const router = express.Router();

const scoreFields = [
  "acquiringKnowledge",
  "ownersPercent",
  "necessaryDirections",
  "frequentInteraction",
  "workInHarmony",
  "planApproved",
  "everyoneWorking",
];

router.get("/:id", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Goal not found!" } });

  let knowledgeAndCollab = await KnowledgeAndCollab.findOne({
    answeredBy: user._id,
    goal: id,
  });
  if (!knowledgeAndCollab)
    knowledgeAndCollab = await new KnowledgeAndCollab({
      answeredBy: user._id,
      goal: id,
    }).save();

  res.send(knowledgeAndCollab);
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

      let knowledgeAndCollab = await KnowledgeAndCollab.findOne({
        answeredBy: user._id,
        goal: id,
      });

      if (!knowledgeAndCollab)
        knowledgeAndCollab = await new KnowledgeAndCollab({
          answeredBy: user._id,
          goal: id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        knowledgeAndCollab[field] = req.body[field];
        knowledgeAndCollab[field + "Value"] = req.body[field + "Value"];
      });

      knowledgeAndCollab.totalKnowledgeAndCollabScore =
        calculateQuestionGroupScore(knowledgeAndCollab, scoreFields);

      await knowledgeAndCollab.save();
      // user.clarityOnPurposeScore =
      //   knowledgeAndCollab.totalKnowledgeAndCollabScore;
      // await user.save();
      calculateGoalScore(id);
      res.send(knowledgeAndCollab);
    }
  );
});

module.exports = router;
