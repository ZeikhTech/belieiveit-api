const yup = require("yup");

const createAffirmationSchema = yup.object().shape({
  affirmation: yup.string().min(1).required(),
  category: yup.string().objectId().required(),
});

module.exports = {
  createAffirmationSchema,
  editAffirmationSchema: createAffirmationSchema,
};
