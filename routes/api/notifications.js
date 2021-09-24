const _ = require("lodash");
const express = require("express");

const Notification = require("../../models/Notification");
const authorize = require("../../middlewares/authorize");

const validateObjectId = require("../../helpers/validateObjectId");

const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

const router = express.Router();

router.get("/my_notifications", authorize(), async (req, res) => {
  let { last_notification_id = "", pageSize = 10 } = req.query;
  pageSize = parseInt(pageSize);
  const { user } = req.authSession;

  const query = {
    reciever: user._id,
  };

  if (last_notification_id) {
    if (!validateObjectId(last_notification_id))
      return res.status(400).send({
        error: {
          message: "Invalid last notification id",
        },
      });
    //
    query._id = {
      $lt: last_notification_id,
    };
  }
  const notifications = await Notification.find(query)
    .limit(pageSize)
    .sort("-createdAt")
    .populate("sender", USER_PUBLIC_FIELDS)
    .populate("goalMembeship", "title");

  res.send(notifications);
});

router.put("/mark_as_opened/:id", authorize(), async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id))
    return res.status(400).send({
      error: {
        message: "Invalid notification id",
      },
    });

  const { user } = req.authSession;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, reciever: user._id },
    {
      isOpened: true,
    }
  );
  if (!notification)
    return res.status(404).send({
      error: {
        message: "Notification not found",
      },
    });

  res.send(notification);
});

module.exports = router;
