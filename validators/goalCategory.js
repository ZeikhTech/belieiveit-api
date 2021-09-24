const yup = require("yup");

const createGoalCategorySchema = yup.object().shape({
  name: yup.string().trim().min(1).required(),
  color: yup
    .string()
    .trim()
    .min(4)
    .max(7)
    .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "color code is invalid!")
    .required(),
});

module.exports = {
  createGoalCategorySchema,
  editGoalCategorySchema: createGoalCategorySchema,
};
