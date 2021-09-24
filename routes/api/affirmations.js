const express = require("express");
const _ = require("lodash");
const mongoose = require("mongoose");
const Affirmation = require("../../models/Affirmation");
const AffirmationCategory = require("../../models/AffirmationCategory");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");

const {
  createAffirmationSchema,
  editAffirmationSchema,
} = require("../../validators/affirmation");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const SavedItem = require("../../models/SavedItem");

const affirmationFiellds = ["_id", "affirmation", "category"];

const router = express.Router();

router.get(
  "/random_affirmation/:id",
  authorize("", { authentication: false }),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    const affirmation = await Affirmation.aggregate([
      { $match: { "category._id": mongoose.Types.ObjectId(id) } },
      { $sample: { size: 1 } },
    ]);

    if (affirmation.length === 0)
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    const result = _.pick(affirmation[0], affirmationFiellds);
    result.saved = false;

    if (req.authSession) {
      const { user } = req.authSession;
      const saved = await SavedItem.findOne({
        content: affirmation[0]._id,
        savedBy: user._id,
        type: "affirmation",
      });

      if (saved) result.saved = true;
    }

    res.send(result);
  }
);

router.get("/saved_affirmations", authorize(), async (req, res) => {
  let { last_save_id = "", pageSize = 10, search = "" } = req.query;
  pageSize = parseInt(pageSize);

  const { user } = req.authSession;
  const query = { type: "affirmation", savedBy: user._id };

  if (last_save_id) {
    if (!validateObjectId(last_save_id))
      return res.status(400).send({
        error: {
          message: "Invalid last save id",
        },
      });
    query._id = {
      $lt: last_save_id,
    };
  }

  const pipeline = [{ $match: query }, { $sort: { createdAt: -1 } }];

  if (!search) {
    pipeline.push({ $limit: pageSize });
  }

  pipeline.push({
    $lookup: {
      from: "affirmations",
      localField: "content",
      foreignField: "_id",
      as: "affirmation",
    },
  });

  pipeline.push({
    $match: {
      affirmation: { $exists: true, $type: "array", $ne: [] },
    },
  });

  if (search) {
    pipeline.push({
      $match: { "affirmation.affirmation": new RegExp(search, "i") },
    });
    pipeline.push({ $limit: pageSize });
  }
  const savedAffirmations = await SavedItem.aggregate(pipeline);

  const result = savedAffirmations.map((a) => {
    return {
      ..._.pick(a.affirmation[0], affirmationFiellds),
      saved: true,
      saved_item_id: a._id,
    };
  });

  res.send(result);
});

router.get("/listing/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Invalid Category Id." } });

  let { pageNum = 1, pageSize = 10 } = req.query;

  pageSize = parseInt(pageSize);
  pageNum = parseInt(pageNum);

  const offset = pageSize * (pageNum - 1);

  const query = { "category._id": mongoose.Types.ObjectId(id) };

  const pipeline = [
    { $match: query },
    { $sort: { _id: -1 } },
    // { $skip: offset },
    // { $limit: pageSize },
    {
      $lookup: {
        from: "saveditems",
        localField: "_id",
        foreignField: "content",
        as: "savedItem",
      },
    },
  ];

  const affirmations = await Affirmation.aggregate(pipeline);

  const totalCount = await Affirmation.find(query).count();

  const hasMore = offset + pageSize < totalCount;

  const {user} = req.authSession;
  res.send({
    hasMore,
    pageSize,
    pageNum,
    list: affirmations.map((affirmation) => {

      const saved  = affirmation.savedItem.find(s => {
        return `${s.savedBy}` === `${user._id}`
      })
      affirmation.saved = saved ? true : false;
      delete affirmation.savedItem;
      return affirmation;
    }),
  });
});

router.get(
  "/:id",
  authorize("", { authentication: false }),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    const affirmatin = await Affirmation.findById(id);
    if (!affirmatin)
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    const result = _.pick(affirmatin, affirmationFiellds);
    result.saved = false;

    if (req.authSession) {
      const { user } = req.authSession;
      const saved = await SavedItem.findOne({
        content: affirmatin._id,
        savedBy: user._id,
        type: "affirmation",
      });

      if (saved) result.saved = true;
    }

    res.send(result);
  }
);

router.get("/", async (req, res) => {
  const affirmations = await Affirmation.find();
  res.send(affirmations);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createAffirmationSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["affirmation", "category"]);

    const category = await AffirmationCategory.findById(body.category);

    if (!category)
      return res.status(400).send({
        error: {
          category: "Invalid Category",
        },
      });

    body.category = category;
    const qoute = await new Affirmation(body).save();
    res.send(qoute);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editAffirmationSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    const body = _.pick(req.body, ["affirmation", "category"]);

    const category = await AffirmationCategory.findById(body.category);

    if (!category)
      return res.status(400).send({
        error: {
          category: "Invalid Category",
        },
      });
    body.category = category;

    const qoute = await Affirmation.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!qoute)
      return res
        .status(404)
        .send({ error: { message: "Affirmation not found!" } });

    res.send(qoute);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Affirmation not found!" } });

  const affirmation = await Affirmation.findByIdAndDelete(id);

  if (!affirmation)
    return res
      .status(404)
      .send({ error: { message: "Affirmation not found!" } });

  res.send(affirmation);
});

module.exports = router;
