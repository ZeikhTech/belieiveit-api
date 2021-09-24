const _ = require("lodash");
const express = require("express");
const requestValidator = require("../../middlewares/requestValidator");

const SavedItem = require("../../models/SavedItem");
const validateObjectId = require("../../helpers/validateObjectId");

const {
  saveItemSchema,
  unsaveItemSchema,
} = require("../../validators/saveItem");
const authorize = require("../../middlewares/authorize");

const router = express.Router();

router.post(
  "/save_content",
  requestValidator(saveItemSchema),
  authorize(),
  async (req, res) => {
    const body = _.pick(req.body, ["content", "type"]);
    const { user } = req.authSession;

    //check if already saved

    const prevSaved = await SavedItem.findOne({
      ...body,
      savedBy: user._id,
    });

    if (prevSaved)
      return res
        .status(400)
        .send({ error: { message: "this contnt is already saved." } });

    const savedItem = await new SavedItem({
      ...body,
      savedBy: user._id,
    }).save();

    res.send(savedItem);
  }
);

router.delete("/unsave_content/:content", authorize(), async (req, res) => {
  const { content } = req.params;

  if (!validateObjectId(content))
    return res
      .status(404)
      .send({ error: { message: "Saved Content not found!" } });

  const { user } = req.authSession;
  const savedItem = await SavedItem.findOneAndRemove({
    content,
    savedBy: user._id,
  });

  if (!savedItem)
    return res.status(400).send({
      error: {
        message: "Alredy Unsaved",
      },
    });

  res.send(savedItem);
});

module.exports = router;
