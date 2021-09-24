const authenticated = require("./middlewares/authenticated");

const configureChat = require("./chat/configureChat");

module.exports = (io) => {
  io.use(authenticated).on("connection", (socket) => {
    //joining the main room
    const { user } = socket;

    console.log(`Welcome ${user.firstname} ${user.lastname}`);
    socket.join(user._id.toHexString());

    configureChat(socket);
    //leaving the main room
    socket.on("disconnect", () => {
      console.log(`Goodbye ${user.firstname} ${user.lastname}`);
      socket.leave(user._id.toHexString());
    });
  });
};
