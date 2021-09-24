const _ = require("lodash");
const ChatRoom = require("../../../models/ChatRoom");
const ChatMessage = require("../../../models/ChatMessage");
const User = require("../../../models/User");

const getPushTokens = require("../../../helpers/getPushTokens");

const {
  sendPushNotifications,
} = require("../../../services/expo/pushNotification");
const sendChatMessageEmail = require("../../../helpers/sendChatMessageEmail");
const { sendChatMessageSchema } = require("../../../validators/chat/message");

const USER_PUBLIC_FIELDS =
  "firstname lastname image.thumbnailUrl image.imageUrl image.aspectRatio";

module.exports = (socket) => {
  socket.on("send_chat_message", async (message, acknowledge) => {
    //validation
    try {
      await sendChatMessageSchema.validate(message);
    } catch (validationError) {
      const { path, errors } = validationError;
      return acknowledge({
        type: "error",
        customIdentifier: message.customIdentifier,
        error: {
          [path]: errors[0],
        },
      });
    }
    const { user } = socket;
    const chatMessage = await new ChatMessage({
      ...message,
      sender: user._id,
      seen: [user._id],
    }).save();

    const chatRoom = await ChatRoom.findByIdAndUpdate(message.chatRoom, {
      lastMessage: chatMessage._id,
      lastActive: Date.now(),
    });

    const populatedChatMessage = {
      sender: _.pick(user, [...USER_PUBLIC_FIELDS.split(" "), "_id"]),
      ..._.pick(chatMessage, [
        "chatRoom",
        "messageType",
        "message",
        "tags",
        "delivered",
        "seen",
        "customIdentifier",
        "isDeleted",
        "createdAt",
      ]),
    };

    //acknowledge the sender
    acknowledge({
      type: "success",
      data: populatedChatMessage,
    });

    //send notification to the other sockets
    chatRoom.members.forEach(async (member) => {
      socket
        .to(member.memberId.toHexString())
        .emit("chat_message_recieved", populatedChatMessage);
    });

    //send push notification to offline users

    const offlineUsers = [];
    const offlineUsersMap = {};
    for (let i = 0; i < chatRoom.members.length; i++) {
      const memberId = chatRoom.members[i].memberId.toHexString();
      const clients = await socket.adapter.sockets(new Set([memberId]));

      if (clients.size === 0) {
        offlineUsers.push(memberId);
        offlineUsersMap[memberId] = 1;
      }
    }
    if (offlineUsers.length === 0) return;

    const pushtokens = await getPushTokens(offlineUsers);

    //construct push notification
    const push_notification = {
      to: pushtokens,
      title:
        chatRoom.roomType === "group" && chatRoom.name
          ? chatRoom.name
          : `${user.firstname} ${user.lastname}`,

      body: chatMessage.message,
      data: {
        ..._.pick(chatMessage, [
          "_id",
          "sender",
          "chatRoom",
          "messageType",
          "customIdentifier",
          "createdAt",
        ]),
        type: "chat_message_notificatoin",
      },
      sound: "default",
    };

    sendPushNotifications(push_notification);

    //update offline user's chat count
    await User.updateMany(
      { _id: { $in: offlineUsers } },
      { $inc: { chatCount: 1 } }
    );

    //update the room chat count for users

    chatRoom.members = chatRoom.members.map((mem) => {
      if (offlineUsersMap[mem.memberId.toHexString()] === 1) {
        //user id offline
        mem.chatCount = mem.chatCount + 1;
      }

      return mem;
    });
    await chatRoom.save();

    //sending email

    const offlineUsersList = await User.find({ _id: { $in: offlineUsers } });

    if (offlineUsersList <= 0) return;
    offlineUsersList.forEach((offUser) => {
      if (
        offUser.notificationSettings &&
        offUser.notificationSettings.emailChatNotifications
      ) {
        sendChatMessageEmail({
          recieverEmail: offUser.email,
          message: chatMessage.message,
          senderName: `${user.firstname} ${user.lastname}`,
        });
      }
    });
  });
};
