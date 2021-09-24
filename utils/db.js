const mongoose = require("mongoose");

module.exports = async (connectionString) => {
  if (!connectionString || typeof connectionString !== "string")
    throw new Error("FATAl Error: connectionString is required");
  console.log("Connecting to database...");
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    if (process.env.NODE_ENV !== "test")
      console.log("Connected to database...");
  } catch (err) {
    if (process.env.NODE_ENV !== "test") console.log("DB connection failed...");
    throw err;
  }
};
