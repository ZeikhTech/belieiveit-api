const express = require("express");
const ClarityOnPurpose = require("../../../models/questions/ClarityOnPurpose");

const authorize = require("../../../middlewares/authorize");
const requestValidator = require("../../../middlewares/requestValidator");

const dynamicSchema = require("../../../validators/questions/dynamicSchema");

const calculateQuestionGroupScore = require("../../../methods/calculateQuestionGroupScore");

const router = express.Router();

const scoreFields = [
  "foundLifePurpose",
  "frequentlyThinkingAboutLifePurpose",
  // "reflectOnLifePurpose",
  "goalAlignWithLifePurpose",
  "stuckInPastOrFuture",
];

router.get("/", authorize(), async (req, res) => {
  const { user } = req.authSession;
  let clarityOnPurpose = await ClarityOnPurpose.findOne({
    answeredBy: user._id,
  });
  if (!clarityOnPurpose)
    clarityOnPurpose = await new ClarityOnPurpose({
      answeredBy: user._id,
    }).save();

  res.send(clarityOnPurpose);
});

const apis = [{ route: "/update_all", fieldName: scoreFields }];

scoreFields.forEach((field) => {
  apis.push({
    route: "/" + field,
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
      let clarityOnPurpose = await ClarityOnPurpose.findOne({
        answeredBy: user._id,
      });
      if (!clarityOnPurpose)
        clarityOnPurpose = await new ClarityOnPurpose({
          answeredBy: user._id,
        }).save();

      if (!Array.isArray(fieldName)) fieldName = [fieldName];

      fieldName.forEach((field) => {
        clarityOnPurpose[field] = req.body[field];
        clarityOnPurpose[field + "Value"] = req.body[field + "Value"];
      });
      clarityOnPurpose.totalClarityScore = calculateQuestionGroupScore(
        clarityOnPurpose,
        scoreFields
      );

      await clarityOnPurpose.save();


      user.clarityOnPurposeScore = clarityOnPurpose.totalClarityScore;
      await user.save();

      res.send(clarityOnPurpose);
    }
  );
});

module.exports = router;
