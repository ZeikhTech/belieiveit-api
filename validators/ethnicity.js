const yup = require("yup");

const createEthnicitySchema = yup.object().shape({
  name: yup.string().trim().min(1).required(),
});

module.exports = {
  createEthnicitySchema,
  editEthnicitySchema: createEthnicitySchema,
};
