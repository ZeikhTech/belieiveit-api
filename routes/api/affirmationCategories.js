const express = require("express");
const _ = require("lodash");

const AffirmationCategory = require("../../models/AffirmationCategory");
const Affirmation = require("../../models/Affirmation");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createAffirmationCategorySchema,
  editAffirmationCategorySchema,
} = require("../../validators/affirmationCategory");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const router = express.Router();

router.get("/list/:parent?", async (req, res) => {
  const { parent = null } = req.params;
  let { pageSize = 10, pageNum = 1, search = "" } = req.query;
  pageSize = parseInt(pageSize);
  pageNum = parseInt(pageNum);
  const offset = pageSize * (pageNum - 1);

  const query = {
    parent,
  };

  if (search) {
    query.name = new RegExp(search, "i");
  }

  const categories = await AffirmationCategory.find(query)
    .sort("-isFree name")
    .skip(offset)
    .limit(pageSize);

  const totalCount = await AffirmationCategory.find(query).count();
  const hasMore = offset + pageSize < totalCount;
  res.send({ hasMore, pageSize, pageNum, list: categories });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  const category = await AffirmationCategory.findById(id);
  if (!category)
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  res.send(category);
});

router.get("/", async (req, res) => {
  const categories = await AffirmationCategory.find().sort("-isFree name");
  res.send(categories);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createAffirmationCategorySchema),
  async (req, res) => {
    const body = _.pick(req.body, ["name", "isFree", "parent"]);

    if (validateObjectId(body.parent)) {
      const parentCategory = await AffirmationCategory.findById(body.parent);
      if (!parentCategory)
        return res
          .status(404)
          .send({ error: { message: "Invalid Parent Category" } });

      parentCategory.hasChildren = true;
      await parentCategory.save();
    }

    const category = await new AffirmationCategory(body).save();
    res.send(category);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editAffirmationCategorySchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Affirmation Category not found!" } });

    const body = _.pick(req.body, ["name", "isFree", "parent"]);

    if (!body.parent) body.parent = null;

    const categoryBeforeEditing = await AffirmationCategory.findById(id);
    if (!categoryBeforeEditing)
      return res
        .status(404)
        .send({ error: { message: "Affirmation Category not found!" } });

    if (categoryBeforeEditing.parent !== null && categoryBeforeEditing.parent) {
      const parentCat = await AffirmationCategory.findById(
        categoryBeforeEditing.parent
      );

      if (parentCat) {
        parentCat.hasChildren = false;
        await parentCat.save();
      }
    }

    if (body.parent !== null && validateObjectId(body.parent)) {
      const parentCategory = await AffirmationCategory.findById(body.parent);
      if (!parentCategory)
        return res
          .status(404)
          .send({ error: { message: "Invalid Parent Category" } });

      parentCategory.hasChildren = true;
      await parentCategory.save();
    }

    const category = await AffirmationCategory.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!category)
      return res
        .status(404)
        .send({ error: { message: "Affirmation Category not found!" } });

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

  const category = await AffirmationCategory.findByIdAndDelete(id);

  if (!category)
    return res
      .status(404)
      .send({ error: { message: "Qoute Category not found!" } });

  res.send(category);
});

module.exports = router;
