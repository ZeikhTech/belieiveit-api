const AuthSession = require("../../models/AuthSession");
const jwt = require("../../services/jwt");

const authenticated = async (socket, next) => {
  const token = socket.handshake.query["x-auth-token"];

  if (!token) return next(new Error("UNAUTHENTICATED"));

  try {
    const decoded = jwt.decrypt(token);
    const authSession = await AuthSession.findById(decoded._id).populate(
      "user"
    );
    if (!authSession || !authSession.user)
      return next(new Error("UNAUTHENTICATED"));

    socket.user = authSession.user;

    next();
  } catch (ex) {
    return next(ex);
  }
};

module.exports = authenticated;
