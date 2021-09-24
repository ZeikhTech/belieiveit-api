const AuthSession = require("../../../models/AuthSession");
const User = require("../../../models/User");

const jwt = require("../../../services/jwt");

const { USER } = require("../../../enums/roles");

exports.generateUserSession = async (role = USER, emailVerified = true) => {
  const user = await new User({
    firstName: role,
    lastname: role,
    email: `${role}@gmail.com`,
    role,
    password: role,
    emailVerified,
  }).save();

  const authSesion = await new AuthSession({
    user: user._id,
    createdAt: new Date(),
  }).save();

  return { token: jwt.encrypt({ _id: authSesion._id }), authSesion, user };
};

exports.cleanUserSession = async () => {
  await User.deleteMany({});
  await AuthSession.deleteMany({});
};
