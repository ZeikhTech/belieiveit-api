const jwt = require("jsonwebtoken");

exports.encrypt = function (data) {
  return jwt.sign(data, process.env.JWT_SECRET_KEY);
};

exports.decrypt = function (token) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
};
