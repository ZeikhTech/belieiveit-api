const redis = require("redis");

let client = null;

const configure = () => {
  client = redis.createClient({
    url: process.env.REDIS_CONNECTION_URL,
  });

  client.on("connect", function () {
    console.log("Redis client connected");
  });

  client.on("error", function (err) {
    console.log("Redis connection failed.");
    throw err;
  });
};

const getClient = () => {
  if (client) return client;
  configure();
  return client;
};

module.exports = {
  configure,
  getClient,
};
