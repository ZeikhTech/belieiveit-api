const ChatRoom = require("../../../models/ChatRoom");

const { indicateTypingSchema } = require("../../../validators/chat/room");

module.exports = (socket) => {
  socket.on("indicate_typing", async (payload, acknowledge) => {
    //validation
    try {
      await indicateTypingSchema.validate(payload);
    } catch (validationError) {
      const { path, errors } = validationError;
      return acknowledge({
        type: "error",
        customIdentifier: payload.customIdentifier,
        error: {
          [path]: errors[0],
        },
      });
    }

    const { user } = socket;

    const chatRoom = await ChatRoom.findById(payload.chatRoom);
    //send notification to the other sockets

    chatRoom.members.forEach((member) => {
      if (member.memberId.toHexString() !== user._id.toHexString())
        socket
          .to(member.memberId.toHexString())
          .emit("indicate_typing", payload);
    });

    //acknowledge the sender
    acknowledge({
      type: "success",
    });
  });
};
