const sendChatMessege = require("./event-handlers/sendChatMessege");
const markChatMessageAsSeen = require("./event-handlers/markChatMessageAsSeen");
const indicateTyping = require("./event-handlers/indicateTyping");
const markChatMessageAsDelivered = require("./event-handlers/markChatMessageAsDelivered");

module.exports = (socket) => {
  sendChatMessege(socket);
  markChatMessageAsSeen(socket);
  indicateTyping(socket);
  markChatMessageAsDelivered(socket);
};
