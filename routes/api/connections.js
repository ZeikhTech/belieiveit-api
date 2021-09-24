const _ = require("lodash");
const express = require("express");
const authorize = require("../../middlewares/authorize");

const validateObjectId = require("../../helpers/validateObjectId");

const User = require("../../models/User");
const Connection = require("../../models/Connection");
const Notification = require("../../models/Notification");
const GoalCategory = require("../../models/GoalCategory");

const Goal = require("../../models/Goal");

const requestValidator = require("../../middlewares/requestValidator");
const {
  searchConnectionSchema,
  requestConnectionSchema,
  goalMembershipSchema,
} = require("../../validators/connection");

const {
  sendPushNotifications,
} = require("../../services/expo/pushNotification");

const getPushTokens = require("../../helpers/getPushTokens");

//////
const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

const router = express.Router();

router.get("/my_connections", authorize(), async (req, res) => {
  let { last_connection_id = "", pageSize = 10 } = req.query;
  pageSize = parseInt(pageSize);

  const { user } = req.authSession;

  const query = {
    "members.user": user._id,
    status: "accepted",
  };

  if (last_connection_id) {
    if (!validateObjectId(last_connection_id))
      return res.status(400).send({
        error: {
          message: "Invalid last connection id",
        },
      });
    //
    query._id = {
      $lt: last_connection_id,
    };
  }
  const connections = await Connection.find(query)
    .limit(pageSize)
    .sort("-acceptedAt")
    .populate("members.user", USER_PUBLIC_FIELDS);
  res.send(connections);
});

router.get("/my_connection_requests", authorize(), async (req, res) => {
  let { last_connection_id = "", pageSize = 10 } = req.query;
  pageSize = parseInt(pageSize);
  const { user } = req.authSession;

  const query = {
    "members.user": user._id,
    status: "requested",
  };

  if (last_connection_id) {
    if (!validateObjectId(last_connection_id))
      return res.status(400).send({
        error: {
          message: "Invalid last connection id",
        },
      });
    //
    query._id = {
      $lt: last_connection_id,
    };
  }
  const connections = await Connection.find(query)
    .limit(pageSize)
    .sort("-createdAt")
    .populate("members.user", USER_PUBLIC_FIELDS);
  res.send(connections);
});

router.post(
  "/search_connections",
  requestValidator(searchConnectionSchema),
  authorize(),
  async (req, res) => {
    let { pageNum = 1, pageSize = 10 } = req.query;

    pageSize = parseInt(pageSize);
    pageNum = parseInt(pageNum);

    const offset = pageSize * (pageNum - 1);

    let {
      search = "",
      longitude,
      latitude,
      distance,
      category,
    } = _.pick(req.body, [
      "search",
      "longitude",
      "latitude",
      "distance",
      "category",
    ]);
    //
    const { user } = req.authSession;

    const query = {
      _id: { $ne: user._id },

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: distance,
        },
      },
    };

    if (search) {
      search = search
        .trim()
        .split(" ")
        .map((s) => new RegExp(s, "i"));
      query.$or = [
        {
          firstname: {
            $in: search,
          },
        },
        {
          lastname: {
            $in: search,
          },
        },
        {
          email: {
            $in: search,
          },
        },
      ];
    }

    const goalCategories = await GoalCategory.find({});

    let users = await User.find(query)
      .sort(`-categoryScore.${category}`)
      .select(USER_PUBLIC_FIELDS + " categoryScore categoryStars")
      .skip(offset)
      .limit(pageSize);

    users = users.map((u) => {
      const usr = _.pick(
        u,
        (USER_PUBLIC_FIELDS + " categoryScore categoryStars _id").split(" ")
      );

      if (usr.categoryScore) {
        const categoryScores = [];
        for (let key in usr.categoryScore) {
          const category = goalCategories.find((gc) => {
            return gc._id.toHexString() === key;
          });

          if (!category) continue;
          const { _id, name, color } = category;
          categoryScores.push({
            _id,
            name,
            color,
            score: usr.categoryScore[key],
          });
        }
        usr.categoryScore = categoryScores;
      }

      if (usr.categoryStars) {
        const stars = [];
        for (let key in usr.categoryStars) {
          const category = goalCategories.find((gc) => {
            return gc._id.toHexString() === key;
          });

          if (!category) continue;
          const { _id, name, color } = category;
          stars.push({
            _id,
            name,
            color,
            stars: usr.categoryStars[key],
          });
        }
        usr.categoryStars = stars;
      }

      return usr;
    });

    const totalCount = await User.find(query).count();
    const hasMore = offset + pageSize < totalCount;
    res.send({ hasMore, pageSize, pageNum, list: users });
  }
);

router.post(
  "/send_connection_request",
  requestValidator(requestConnectionSchema),
  authorize(),
  async (req, res) => {
    const { requestedUser } = _.pick(req.body, ["requestedUser"]);
    const { user } = req.authSession;

    //check if previous connection exists
    const previousConneciton = await Connection.findOne({
      $and: [
        {
          "members.user": user._id,
        },
        {
          "members.user": requestedUser,
        },
      ],
    });

    if (previousConneciton) return res.send(previousConneciton);

    const connection = await new Connection({
      initiator_id: user._id,
      members: [{ user: user._id }, { user: requestedUser }],
      status: "requested",
    }).save();

    res.send(connection);

    //sending notification
    const notification = await new Notification({
      sender: user._id,
      reciever: requestedUser,
      type: "connection_request",
      connection: connection._id,
    }).save();

    const pushTokens = await getPushTokens(requestedUser);

    const push_notification = {
      to: pushTokens,
      title: `${user.firstname} ${user.lastname}`,
      body: `${user.firstname} ${user.lastname} sent you a connection request.`,
      data: {
        ..._.pick(notification, ["_id", "type", "connection", "createdAt"]),
        sender: _.pick(user, USER_PUBLIC_FIELDS.split(" ")),
      },
      sound: "default",
    };
    sendPushNotifications(push_notification);
  }
);

router.post(
  "/send_goal_membership_request",
  requestValidator(goalMembershipSchema),
  authorize(),
  async (req, res) => {
    const { requestedUser, goalRef } = _.pick(req.body, [
      "requestedUser",
      "goalRef",
    ]);
    const { user } = req.authSession;

    const goal = await Goal.findOneAndUpdate(
      {
        _id: goalRef,
        createdBy: user._id,
        "members.memberId": { $ne: requestedUser },
      },
      {
        $addToSet: {
          members: { memberId: requestedUser, status: "requested" },
        },
      },
      { new: true }
    );

    if (!goal)
      return res.status(400).send({
        error: { message: "It seems you have alredy requested this user." },
      });

    //save notification
    const notification = await new Notification({
      sender: user._id,
      reciever: requestedUser,
      goalMembeship: goal._id,
      type: "goal_membership_request",
    }).save();

    const pushTokens = await getPushTokens(requestedUser);

    const push_notification = {
      to: pushTokens,
      title: `${user.firstname} ${user.lastname}`,
      body: `${user.firstname} ${user.lastname} sent you a connection request.`,
      data: {
        ..._.pick(notification, [
          "_id",
          "type",
          "connection",
          "goalMembeship",
          "createdAt",
        ]),
        sender: _.pick(user, USER_PUBLIC_FIELDS.split(" ")),
      },
      sound: "default",
    };
    sendPushNotifications(push_notification);

    res.send({ message: "Membership request sent." });
  }
);

router.put("/accept_connection_request/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  const connection = await Connection.findByIdAndUpdate(
    id,
    { status: "accepted", acceptedAt: Date.now() },
    { new: true }
  );

  if (!connection)
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  res.send(connection);
});

router.put("/accept_goal_membership/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  const { user } = req.authSession;
  const goal = await Goal.findById(id);

  if (!goal)
    return res.status(404).send({
      error: {
        message: "Goal not found",
      },
    });

  let includes = false;
  goal.members = goal.members.map((m) => {
    if (`${m.memberId}` === `${user._id}`) {
      m.status = "accepted";
      includes = true;
    }
    return m;
  });

  if (!includes)
    return res.status(404).send({
      error: {
        message: "You are not requested to join this goal's membership.",
      },
    });
  //
  await goal.save();

  //remove notification

  const notification = await Notification.deleteMany({
    sender: goal.createdBy,
    reciever: user._id,
    goalMembeship: goal._id,
    type: "goal_membership_request",
  });

  //if not connected then connect
  const previousConneciton = await Connection.findOne({
    $and: [
      {
        "members.user": user._id,
      },
      {
        "members.user": goal.createdBy,
      },
    ],
  });

  if (!previousConneciton) {
    const connection = await new Connection({
      initiator_id: goal.createdBy,
      members: [{ user: user._id }, { user: goal.createdBy }],
      status: "accepted",
      acceptedAt: Date.now(),
    }).save();
  }

  if (previousConneciton && previousConneciton.status === "requested") {
    previousConneciton.status = "accepted";
    await previousConneciton.save();
  }
  res.send({ message: "Membership request accepted." });
});

router.delete("/cancel_connection/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  const { user } = req.authSession;

  const connection = await Connection.findOneAndRemove({
    _id: id,
    "members.user": user._id,
  });

  if (!connection)
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  res.send(connection);
});

router.delete("/decline_goal_membership/:id", authorize(), async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return res
      .status(404)
      .send({ error: { message: "Connection not found!" } });

  const { user } = req.authSession;
  const goal = await Goal.findOneAndUpdate(
    {
      _id: id,
      // members: {
      //   memberId: user._id,
      // },
    },
    {
      $pull: {
        members: { memberId: user._id },
      },
    }
  );

  if (!goal)
    return res.status(404).send({
      error: {
        message: "Goal not found",
      },
    });

  //remove notification

  const notification = await Notification.deleteMany({
    sender: goal.createdBy,
    reciever: user._id,
    goalMembeship: goal._id,
    type: "goal_membership_request",
  });

  res.send({ message: "Membership request declined." });
});

module.exports = router;
