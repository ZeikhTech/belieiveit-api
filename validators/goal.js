const yup = require("yup");

const createGoalSchema = yup.object().shape({
  title: yup.string().min(1).required(),
  goalCategory: yup.string().objectId().required(),
  preDefinedGoalRef: yup.string().optional(),
  iAm: yup.string().min(1).optional(),
  accomplishingDate: yup.date().required(),
  afterAccomplishment: yup.string().min(1).optional(),
  importanceOfGoal: yup.string().min(1).optional(),
  image: yup.string().optional(),
  audio: yup.string().optional(),
  song: yup.string().optional(),
  toPlay: yup.string().min(1).optional(),
  isPublic: yup.boolean().optional(),
  articleSuggestions: yup.boolean().optional(),
});

const editGoalSchema = yup.object().shape({
  title: yup.string().min(1).required(),
  goalCategory: yup.string().objectId().required(),
  iAm: yup.string().min(1).optional(),
  accomplishingDate: yup.date().required(),
  afterAccomplishment: yup.string().min(1).optional(),
  importanceOfGoal: yup.string().min(1).optional(),
  image: yup.string().optional(),
  audio: yup.string().optional(),
  song: yup.string().optional(),
  toPlay: yup.string().min(1).optional(),
  isPublic: yup.boolean().optional(),
  articleSuggestions: yup.boolean().optional(),
});

const changeGoalStatusSchema = yup.object().shape({
  isCompleted: yup.boolean().required(),
});

//completion
const changeCompletionSchema = yup.object().shape({
  completion: yup.number().min(0).required(),
});

module.exports = {
  createGoalSchema,
  editGoalSchema,
  changeGoalStatusSchema,
  changeCompletionSchema,
};
