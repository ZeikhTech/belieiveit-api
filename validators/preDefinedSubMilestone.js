const yup = require("yup");

const createPreDefinedSubMilestoneSchema = yup.object().shape({
  title: yup.string().min(1).required(),
  preDefinedMilestone: yup.string().objectId().required(),
});

const rearrangeSubMilestonesSchema = yup.object().shape({
  orderIds: yup.array().of(yup.string().objectId().required()).required(),
});
//isActive
module.exports = {
  createPreDefinedSubMilestoneSchema,
  editPreDefinedSubMilestoneSchema: createPreDefinedSubMilestoneSchema,
  rearrangeSubMilestonesSchema,
};
