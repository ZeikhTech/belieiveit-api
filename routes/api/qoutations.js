const express = require("express");
const _ = require("lodash");
const mongoose = require("mongoose");
const Qoutation = require("../../models/Qoutation");
const QouteCategory = require("../../models/QouteCategory");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const {
  createQoutationSchema,
  editQoutationSchema,
} = require("../../validators/qoutation");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");
const SavedItem = require("../../models/SavedItem");

const qouteFiellds = ["_id", "qoutation", "category"];

const router = express.Router();

router.get(
  "/random_qoutation/:id",
  authorize("", { authentication: false }),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    const qoute = await Qoutation.aggregate([
      { $match: { "category._id": mongoose.Types.ObjectId(id) } },
      { $sample: { size: 1 } },
    ]);

    if (qoute.length === 0)
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    const result = _.pick(qoute[0], qouteFiellds);
    result.saved = false;

    if (req.authSession) {
      const { user } = req.authSession;
      const saved = await SavedItem.findOne({
        content: qoute[0]._id,
        savedBy: user._id,
        type: "qoutation",
      });

      if (saved) result.saved = true;
    }

    res.send(result);
  }
);

router.get("/saved_qoutations", authorize(), async (req, res) => {
  let { last_save_id = "", pageSize = 10, search = "" } = req.query;
  pageSize = parseInt(pageSize);

  const { user } = req.authSession;
  const query = { type: "qoutation", savedBy: user._id };

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
      from: "qoutations",
      localField: "content",
      foreignField: "_id",
      as: "qoutation",
    },
  });

  pipeline.push({
    $match: {
      qoutation: { $exists: true, $type: "array", $ne: [] },
    },
  });

  if (search) {
    pipeline.push({
      $match: { "qoutation.qoutation": new RegExp(search, "i") },
    });
    pipeline.push({ $limit: pageSize });
  }
  const savedQoutations = await SavedItem.aggregate(pipeline);

  const result = savedQoutations.map((q) => {
    return {
      ..._.pick(q.qoutation[0], qouteFiellds),
      saved: true,
      saved_item_id: q._id,
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

  const qoutations = await Qoutation.aggregate(pipeline);

  const totalCount = await Qoutation.find(query).count();

  const hasMore = offset + pageSize < totalCount;
  const { user } = req.authSession;
  res.send({
    hasMore,
    pageSize,
    pageNum,
    list: qoutations.map((qoute) => {
      const saved = qoute.savedItem.find((s) => {
        return `${s.savedBy}` === `${user._id}`;
      });
      qoute.saved = saved ? true : false;
      delete qoute.savedItem;
      return qoute;
    }),
  });
});

router.get(
  "/:id",
  authorize("", { authentication: false }),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    const qoute = await Qoutation.findById(id);
    if (!qoute)
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    const result = _.pick(qoute, qouteFiellds);
    result.saved = false;

    if (req.authSession) {
      const { user } = req.authSession;
      const saved = await SavedItem.findOne({
        content: qoute._id,
        savedBy: user._id,
        type: "qoutation",
      });

      if (saved) result.saved = true;
    }

    res.send(result);
  }
);

router.get("/", async (req, res) => {
  const qoutations = await Qoutation.find();
  res.send(qoutations);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createQoutationSchema),
  async (req, res) => {
    const body = _.pick(req.body, ["qoutation", "category"]);

    const category = await QouteCategory.findById(body.category);

    if (!category)
      return res.status(400).send({
        error: {
          category: "Invalid Category",
        },
      });

    body.category = category;
    const qoute = await new Qoutation(body).save();
    res.send(qoute);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editQoutationSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    const body = _.pick(req.body, ["qoutation", "category"]);

    const category = await QouteCategory.findById(body.category);

    if (!category)
      return res.status(400).send({
        error: {
          category: "Invalid Category",
        },
      });
    body.category = category;

    const qoute = await Qoutation.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!qoute)
      return res.status(404).send({ error: { message: "Qoute not found!" } });

    res.send(qoute);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Qoute not found!" } });

  const qoute = await Qoutation.findByIdAndDelete(id);

  if (!qoute)
    return res.status(404).send({ error: { message: "Qoute not found!" } });

  res.send(qoute);
});

module.exports = router;
