const socketio = require("socket.io");
const socketIORedis = require("socket.io-redis");

let io = null;

const redisAdapter = socketIORedis({
  url: process.env.REDIS_CONNECTION_URL,
});

exports.initialize = function (server) {
  if (io !== null) return io;
  io = socketio(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  io.adapter(redisAdapter);
  return io;
};

exports.getIO = () => io;
