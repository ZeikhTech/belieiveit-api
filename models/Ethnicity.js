const mongoose = require("mongoose");

const ethnicitySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
});

const Ethnicity = mongoose.model("ethnicity", ethnicitySchema);

module.exports = Ethnicity;
