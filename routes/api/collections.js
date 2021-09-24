const express = require("express");
const _ = require("lodash");

const Collection = require("../../models/Collection");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createCollectionSchema,
  editCollectionSchema,
} = require("../../validators/collection");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/:id", authorize(), async (req, res) => {
  const { id } = req.params;
  const { user } = req.authSession;
  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Collection not found!" } });

  const collection = await Collection.findById({ _id: id, user: user._id });
  if (!collection)
    return res
      .status(404)
      .send({ error: { message: "Collection not found!" } });

  res.send(collection);
});

router.get("/my_collections", authorize(), async (req, res) => {
  const { user } = req.authSession;
  const collections = await Collection.find({ user: user._id });
  if (collections.length === 0) {
    const collection = await new Collection({
      name: "Favourites",
      user: user._id,
    }).save();
    return res.send([collection]);
  }
  res.send(collections);
});

router.post(
  "/",
  authorize(),
  requestValidator(createCollectionSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["name"]);
    const { user } = req.authSession;

    body.user = user._id;

    const collection = await new Collection(body).save();
    res.send(collection);
  }
);

router.put(
  "/:id",
  authorize(),
  requestValidator(editCollectionSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Collection not found!" } });

    const body = _.pick(req.body, ["name"]);

    const { user } = req.authSession;

    const collection = await Collection.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!collection)
      return res
        .status(404)
        .send({ error: { message: "Collection not found!" } });

    res.send(collection);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Collection not found!" } });

  const category = await Collection.findByIdAndDelete(id);

  if (!category)
    return res
      .status(404)
      .send({ error: { message: "Collection not found!" } });

  res.send(category);
});

module.exports = router;
