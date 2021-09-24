const yup = require("yup");

const createAffirmationSubCategorySchema = yup.object().shape({
  name: yup.string().trim().min(1).required(),
  parent: yup.string().objectId().required(),
  isFree: yup.boolean().required(),
});

module.exports = {
  createAffirmationSubCategorySchema: createAffirmationSubCategorySchema,
  editAffirmationSubCategorySchema: createAffirmationSubCategorySchema,
};
