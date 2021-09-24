const ChatMessage = require("../../../models/ChatMessage");

const { messageSeenSchema } = require("../../../validators/chat/message");

module.exports = (socket) => {
  socket.on("mark_chat_message_as_seen", async (payload, acknowledge) => {
    //validation
    try {
      await messageSeenSchema.validate(payload);
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
        $addToSet: { seen: user._id },
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
      mesasge: "message seened",
    });

    chatMessage.chatRoom.members.forEach(async (member) => {
      socket
        .to(member.memberId.toHexString())
        .emit("chat_message_seened", { messageId });
    });
  });
};
