const yup = require("yup");

const createMilestoneSchema = yup.object().shape({
  title: yup.string().trim().min(1).required(),
  goal: yup.string().objectId().required(),
  startDate: yup.date().required(),
  endDate: yup.date().required(),
  frequency: yup.number().min(1).required(),
  repeatingDays: yup.array().of(yup.string().required()).required(),
  timeOfDay: yup.array().of(yup.string().required()).optional(),
  members: yup.array().of(yup.string().required()).optional(),
});

const editMilestoneSchema = yup.object().shape({
  title: yup.string().trim().min(1).required(),
  startDate: yup.date().required(),
  endDate: yup.date().required(),
  frequency: yup.number().min(1).required(),
  repeatingDays: yup.array().of(yup.string().required()).required(),
  timeOfDay: yup.array().of(yup.string().required()).optional(),
  members: yup.array().of(yup.string().required()).optional(),
});

const changeMilestoneStatusSchema = yup.object().shape({
  isCompleted: yup.boolean().required(),
});

const markDayAsCompletedSchema = yup.object().shape({
  completionDate: yup.date().required(),
});

module.exports = {
  createMilestoneSchema,
  changeMilestoneStatusSchema,
  editMilestoneSchema,
  markDayAsCompletedSchema,
};
