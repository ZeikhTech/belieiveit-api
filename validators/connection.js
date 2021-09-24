const yup = require("yup");

const searchConnectionSchema = yup.object().shape({
  search: yup.string().optional(),
  latitude: yup.number().required(),
  longitude: yup.number().required(),
  distance: yup.number().required(),
  category: yup.string().objectId().required(),
});

const requestConnectionSchema = yup.object().shape({
  requestedUser: yup.string().objectId().required(),
});

const goalMembershipSchema = yup.object().shape({
  requestedUser: yup.string().objectId().required(),
  goalRef: yup.string().objectId().required(),
});

module.exports = {
  searchConnectionSchema,
  requestConnectionSchema,
  goalMembershipSchema,
};
