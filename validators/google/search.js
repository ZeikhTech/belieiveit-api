const yup = require("yup");

const googleSearchApiSchema = yup.object().shape({
  searchQuery: yup.string().min(5).max(3000).required(),
});

const trackClickSchema = yup.object().shape({
  link: yup.string().min(5).max(3000).required(),
});

module.exports = {
  googleSearchApiSchema,
  trackClickSchema,
};
