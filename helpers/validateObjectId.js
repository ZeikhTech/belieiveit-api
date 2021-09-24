const mongoose = require("mongoose");
module.exports = function (id = "") {
  if (id.length !== 24) return false;
  return mongoose.Types.ObjectId.isValid(id);
};
