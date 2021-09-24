const ChatMessage = require("../../../models/ChatMessage");

const { messageDeliveredSchema } = require("../../../validators/chat/message");

module.exports = (socket) => {
  socket.on("mark_chat_message_as_delivered", async (payload, acknowledge) => {
    //validation
    try {
      await messageDeliveredSchema.validate(payload);
    } catch (validationError) {
      const { path, errors } = validationError;

      return acknowledge({
        type: "error",
        error: {
          [path]: errors[0],
        },
      });
    }

    const { messageId } = payload;
    const { user } = socket;

    const chatMessage = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        delivered: true,
      },
      { populate: { path: "chatRoom" } }
    );

    if (!chatMessage)
      return acknowledge({
        type: "error",
        error: {
          message: "Invalid chat message",
        },
      });

    acknowledge({
      type: "success",
      mesasge: "message delivered",
    });

    chatMessage.chatRoom.members.forEach(async (member) => {
      if (user._id.tohexString() !== chatMessage.sender.toHexString())
        socket
          .to(member.memberId.toHexString())
          .emit("chat_message_delivered", { messageId });
    });
  });
};
