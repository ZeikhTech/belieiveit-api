const express = require("express");
const _ = require("lodash");

const Post = require("../../models/Post");
const SavedItem = require("../../models/SavedItem");
const ImageMedia = require("../../models/media/ImageMedia");

const authorize = require("../../middlewares/authorize");
const requestValidator = require("../../middlewares/requestValidator");
const { createPostSchema, editPostSchema } = require("../../validators/post");

const { ADMIN } = require("../../enums/roles");
const validateObjectId = require("../../helpers/validateObjectId");

const postFields = [
  "_id",
  "title",
  "type",
  "youtubeVideo",
  "image",
  "description",
  "link",
  "createdBy",
  "createdAt",
];
const router = express.Router();

router.get("/saved_posts", authorize(), async (req, res) => {
  let { last_save_id = "", pageSize = 10, search = "" } = req.query;
  pageSize = parseInt(pageSize);
  const { user } = req.authSession;
  const query = { type: "post", savedBy: user._id };

  if (search) {
  }

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
      from: "posts",
      localField: "content",
      foreignField: "_id",
      as: "post",
    },
  });

  pipeline.push({
    $match: {
      post: { $exists: true, $type: 'array', $ne: [] }
    }
  });

  if (search) {
    pipeline.push({ $match: { "post.title": new RegExp(search, "i") } });

    pipeline.push({ $limit: pageSize });
  }
  const savedPosts = await SavedItem.aggregate(pipeline);

  const result = savedPosts.map((p) => {
    return {
      ..._.pick(p.post[0], postFields),
      saved: true,
      saved_item_id: p._id,
    };
  });
  res.send(result);
});

router.get(
  "/:id",
  authorize("", { authentication: false }),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Post not found!" } });

    const post = await Post.findById(id);
    if (!post)
      return res.status(404).send({ error: { message: "Post not found!" } });

    const result = _.pick(post, postFields);

    result.saved = false;

    if (req.authSession) {
      const { user } = req.authSession;
      const saved = await SavedItem.findOne({
        content: post._id,
        savedBy: user._id,
        type: "post",
      });

      if (saved) result.saved = true;
    }

    res.send(result);
  }
);

router.get("/", authorize("", { authentication: false }), async (req, res) => {
  let { last_post_id = "", pageSize = 10, search = "" } = req.query;
  pageSize = parseInt(pageSize);
  const query = {};

  if (search) {
    query.title = new RegExp(search, "i");
  }
  if (last_post_id) {
    if (!validateObjectId(last_post_id))
      return res.status(400).send({
        error: {
          message: "Invalid last post id",
        },
      });
    query._id = {
      $lt: last_post_id,
    };
  }

  const posts = await Post.find(query).limit(pageSize).sort("-createdAt");
  let result = [];
  if (req.authSession) {
    const { user } = req.authSession;
    const postIds = posts.map((p) => p._id);
    const savedItems = (
      await SavedItem.find({
        savedBy: user._id,
        content: { $in: postIds },
        type: "post",
      })
    ).map((i) => `${i.content}`);

    result = posts.map((p) => {
      return {
        ..._.pick(p, postFields),
        saved: savedItems.includes(`${p._id}`),
      };
    });
  } else {
    result = posts.map((p) => {
      return { ..._.pick(p, postFields), saved: false };
    });
  }
  res.send(result);
});

router.post(
  "/",
  authorize(ADMIN),
  requestValidator(createPostSchema),
  async (req, res) => {
    const body = _.pick(req.body, [
      "type",
      "title",
      "youtubeVideo",
      "description",
      "link",
      "image",
    ]);

    if (body.type === "blog") {
      const imageMedia = await ImageMedia.findOneAndUpdate(
        { _id: body.image },
        { isUsed: true },
        { new: true }
      );

      if (!imageMedia)
        return res.status(400).send({
          error: {
            message: "Invalid image id.",
          },
        });

      body.image = imageMedia;
    }

    const post = await new Post(body).save();
    res.send(post);
  }
);

router.put(
  "/:id",
  authorize(ADMIN),
  requestValidator(editPostSchema),
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id))
      return res.status(404).send({ error: { message: "Post not found!" } });

    const body = _.pick(req.body, [
      "type",
      "title",
      "youtubeVideo",
      "description",
      "link",
      "image",
    ]);

    if (body.image) {
      const imageMedia = await ImageMedia.findOneAndUpdate(
        { _id: body.image },
        { isUsed: true },
        { new: true }
      );

      if (!imageMedia)
        return res.status(400).send({
          error: {
            message: "Invalid image id.",
          },
        });

      body.image = imageMedia;
    }

    const post = await Post.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!post)
      return res.status(404).send({ error: { message: "Post not found!" } });

    res.send(post);
  }
);

router.delete("/:id", authorize(ADMIN), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res.status(404).send({ error: { message: "Post not found!" } });

  const post = await Post.findByIdAndDelete(id);

  if (!post)
    return res.status(404).send({ error: { message: "Post not found!" } });

  res.send(post);
});

module.exports = router;
