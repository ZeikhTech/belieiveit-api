const yup = require("yup");

const createCollectionSchema = yup.object().shape({
  name: yup.string().trim().min(1).required(),
});

module.exports = {
  createCollectionSchema,
  editCollectionSchema: createCollectionSchema,
};
