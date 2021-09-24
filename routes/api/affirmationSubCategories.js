const express = require("express");
const _ = require("lodash");

const AffirmationSubCategory = require("../../models/AffirmationSubCategory");
const Affirmation = require("../../models/Affirmation");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createAffirmationSubCategorySchema,
  editAffirmationSubCategorySchema,
} = require("../../validators/affirmationSubCategory");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/list", async (req, res) => {
  let { pageSize = 10, pageNum = 1, search = "", parent = "" } = req.query;
  pageSize = parseInt(pageSize);
  pageNum = parseInt(pageNum);
  const offset = pageSize * (pageNum - 1);

  const query = {};

  if (search) {
    query.name = new RegExp(search, "i");
  }

  if (parent) {
    query.parent = parent;
  }
  const categories = await AffirmationSubCategory.find(query).sort(
    "-isFree name"
  );
  // .skip(offset)
  // .limit(pageSize);

  const totalCount = await AffirmationSubCategory.find(query).count();
  const hasMore = offset + pageSize < totalCount;
  res.send({ hasMore, pageSize, pageNum, list: categories });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  const category = await AffirmationSubCategory.findById(id);
  if (!category)
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  res.send(category);
});

router.get("/", async (req, res) => {
  const categories = await AffirmationSubCategory.find()
    .populate("parent")
    .sort("-isFree name");
  res.send(categories);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createAffirmationSubCategorySchema),
  async (req, res) => {
    const body = _.pick(req.body, ["name", "parent", "isFree"]);

    const category = await new AffirmationSubCategory(body).save();
    res.send(category);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editAffirmationSubCategorySchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Qoute Category not found!" } });

    const body = _.pick(req.body, ["name", "parent", "isFree"]);

    const category = await AffirmationSubCategory.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!category)
      return res
        .status(404)
        .send({ error: { message: "Qoute Category not found!" } });

    await Affirmation.updateMany(
      { "category._id": id },
      { $set: { category } }
    );

    res.send(category);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  const category = await AffirmationSubCategory.findByIdAndDelete(id);

  if (!category)
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  res.send(category);
});

module.exports = router;
