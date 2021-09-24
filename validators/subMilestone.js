const yup = require("yup");

const createSubMilestoneSchema = yup.object().shape({
  title: yup.string().trim().min(1).required(),
  milestone: yup.string().objectId().required(),
});

const editSubMilestoneSchema = yup.object().shape({
  title: yup.string().trim().min(1).required(),
});

const changeSubMilestoneStatusSchema = yup.object().shape({
  isCompleted: yup.boolean().required(),
});
const rearrangeSubMilestonesSchema = yup.object().shape({
  orderIds: yup.array().of(yup.string().objectId().required()).required(),
});

const markDayAsCompletedSchema = yup.object().shape({
  completionDate: yup.date().required(),
});

const milestonesListSchema = yup.object().shape({
  occuringDate: yup.date().required(),
});

module.exports = {
  createSubMilestoneSchema,
  changeSubMilestoneStatusSchema,
  editSubMilestoneSchema,
  rearrangeSubMilestonesSchema,
  markDayAsCompletedSchema,
  milestonesListSchema,
};
