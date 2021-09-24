const yup = require("yup");

const feedBackSchema = yup.object().shape({
  name: yup.string().min(0).required(),
  email: yup.string().email().min(0).required(),
  subject: yup.string().min(0).required(),
  message: yup.string().min(0).required(),
});

module.exports = {
  feedBackSchema,
};
