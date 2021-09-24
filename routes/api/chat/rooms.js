const express = require("express");
const _ = require("lodash");
const uuid = require("uuid");
const authorize = require("../../../middlewares/authorize");

const requestValidator = require("../../../middlewares/requestValidator");
const ChatRoom = require("../../../models/ChatRoom");
const ImageMedia = require("../../../models/media/ImageMedia");
const validateObjectId = require("../../../helpers/validateObjectId");
const {
  createGroupChatSchema,
  removeMemberSchema,
} = require("../../../validators/chat/room");

const socketIO = require("../../../services/socketIO");
const ChatMessage = require("../../../models/ChatMessage");

const router = express.Router();

const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

router.get("/my_chat_rooms", authorize(), async (req, res) => {
  const { user } = req.authSession;

  const query = {
    members: {
      $elemMatch: {
        memberId: user._id,
        role: { $ne: "join_requester" },
      },
    },
  };
  const orClause = [
    {
      roomType: "direct",
      lastMessage: { $ne: null },
    },
    {
      roomType: "group",
    },
  ];

  let rooms = await ChatRoom.find(query)
    .or(orClause)
    .populate("lastMessage")
    .populate("members.memberId", USER_PUBLIC_FIELDS);

  const userId = user._id.toHexString();
  rooms = rooms.map((room) => {
    room = _.pick(room, [
      "_id",
      "members",
      "membersCanAdd",
      "isPublic",
      "lastMessage",
      "name",
      "image",
      "description",
      "roomType",
      "createdBy",
      "lastActive",
      "createdAt",
    ]);
    for (let i = 0; i < room.members.length; ++i) {
      if (room.members[i].memberId._id.toHexString() === userId) {
        room.chatCount = room.members[i].chatCount;
        break;
      }
    }
    return room;
  });
  res.send(rooms);
});

router.get("/get_room/:id", authorize(), async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id))
    return res.status(400).send({
      error: {
        message: "Invalid Room Id",
      },
    });

  const room = await ChatRoom.findById(id).populate(
    "members.memberId",
    USER_PUBLIC_FIELDS
  );

  if (!room)
    return res.status(404).send({
      error: {
        message: "Room Not Found.",
      },
    });

  res.send(room);
});

router.get(
  "/get_private_chat_room/:memberId",
  authorize(),
  async (req, res) => {
    const { memberId } = req.params;
    const { user } = req.authSession;
    if (!validateObjectId(memberId))
      return res.status(400).send({
        error: {
          message: "Invalid member Id",
        },
      });

    const data = {
      roomType: "direct",
      createdBy: user._id,
      members: [
        { memberId: user._id.toHexString(), role: "member" },
        { memberId, role: "member" },
      ],
    };

    let room = await ChatRoom.findOne({
      roomType: "direct",
      "members.memberId": { $all: [memberId, user._id] },
    }).populate("members.memberId", USER_PUBLIC_FIELDS);

    if (!room) {
      await new ChatRoom(data).save();
      room = await ChatRoom.findOne({
        roomType: "direct",
        "members.memberId": { $all: [memberId, user._id] },
      }).populate("members.memberId", USER_PUBLIC_FIELDS);
    }

    res.send(room);
  }
);

router.post(
  "/create_group_chat",
  requestValidator(createGroupChatSchema),
  authorize(),
  async (req, res) => {
    const {
      name = "",
      description = "",
      members = [],
      image,
      isPublic,
    } = _.pick(req.body, [
      "name",
      "description",
      "members",
      "image",
      "isPublic",
    ]);

    const { user } = req.authSession;
    const chatRoomBuilder = {
      name,
      description,
      members: [
        { memberId: user._id.toHexString(), role: "admin" },
        ...members.map((mem) => {
          return { memberId: mem, role: "member" };
        }),
      ],
      isPublic,
      roomType: "group",
      createdBy: user._id,
    };

    if (image) {
      const imageMedia = await ImageMedia.findOneAndUpdate(
        { _id: image },
        { isUsed: true },
        { new: true }
      );

      if (!imageMedia)
        return res.status(400).send({
          error: {
            message: "Invalid image id.",
          },
        });

      chatRoomBuilder.image = imageMedia;
    }

    const room = await new ChatRoom(chatRoomBuilder).save();

    const populatedRoom = await ChatRoom.findById(room._id).populate(
      "members.memberId",
      USER_PUBLIC_FIELDS
    );
    res.send(populatedRoom);
  }
);

router.put("/reset_my_chat_count/:id", authorize(), async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id))
    return res.status(400).send({
      error: {
        message: "Invalid group Id",
      },
    });

  const { user } = req.authSession;

  const chatRoom = await ChatRoom.findById(id);

  if (!chatRoom)
    return res.status(400).send({
      error: {
        message: "Invalid group Id",
      },
    });

  chatRoom.members.map((mem) => {
    if (mem.memberId.toHexString() === user._id.toHexString()) {
      mem.chatCount = 0;
    }
    return mem;
  });

  await chatRoom.save();
  res.send({ message: "Room Chat count updated", count: 0 });
});
router.delete(
  "/remove_member_from_group/:chatRoom",
  requestValidator(removeMemberSchema),
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const { chatRoom } = req.params;
    const { memberId } = _.pick(req.body, ["memberId"]);
    if (!validateObjectId(chatRoom))
      return res.status(400).send({
        error: {
          message: "Invalid group Id",
        },
      });

    const { user } = req.authSession;

    const room = await ChatRoom.findOne({
      _id: chatRoom,
      roomType: "group",
      "members.memberId": { $in: user._id },
      "member.role": "admin",
    });

    if (!room)
      return res.status(400).send({
        error: {
          message: "Invalid group Id",
        },
      });

    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      chatRoom,
      {
        $pull: {
          "members.memberId": memberId,
        },
      },
      { new: true }
    );

    res.send(updatedRoom);

    // const io = socketIO.getIO();
    // if (io) {
    //   room.members.forEach((member) => {
    //     io.to(member.memberId.toHexString()).emit(
    //       "member_left_chat_group",
    //       responseObj
    //     );
    //   });
    // }
  }
);

router.delete(
  "/leave_group/:chatRoom",
  authorize("", { emailVerified: false }),
  async (req, res) => {
    const { chatRoom } = req.params;

    if (!validateObjectId(chatRoom))
      return res.status(400).send({
        error: {
          message: "Invalid group Id",
        },
      });

    const { user } = req.authSession;
    const room = await ChatRoom.findOneAndUpdate(
      {
        _id: chatRoom,
        roomType: "group",
        "members.memberId": { $in: user._id },
      },
      {
        $pull: {
          members: { memberId: user._id },
        },
      },
      { new: true }
    );

    if (!room)
      return res.status(400).send({
        error: {
          message: "Invalid group Id",
        },
      });

    const leavingMessage = await new ChatMessage({
      sender: user._id,
      chatRoom,
      messageType: "info",
      customIdentifier: uuid.v4(),
      message: `${user.firstname} ${user.lastname} left the group`,
    }).save();

    const responseObj = {
      sender: _.pick(user, USER_PUBLIC_FIELDS.split(" ")),
      ..._.pick(leavingMessage, [
        "chatRoom",
        "messageType",
        "customIdentifier",
        "message",
        "createdAt",
        "seen",
        "delivered",
      ]),
    };

    const io = socketIO.getIO();
    if (io) {
      room.members.forEach((member) => {
        io.to(member.memberId.toHexString()).emit(
          "member_left_chat_group",
          responseObj
        );
      });
    }

    res.send(responseObj);
  }
);
module.exports = router;
