const yup = require("yup");

module.exports = (fields = []) => {
  if (!Array.isArray(fields)) fields = [fields];

  schemaObj = {};

  fields.forEach((field) => {
    schemaObj[field] = yup.number().min(0).max(100).required();
  });
  return yup.object().shape(schemaObj);
};
