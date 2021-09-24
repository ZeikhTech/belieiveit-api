const yup = require("yup");

const createPostSchema = yup.object().shape({
  type: yup.string().trim().required(),
  title: yup.string().trim().min(1).required(),
  youtubeVideo: yup.string().when("type", {
    is: "youtube_video",
    then: yup.string().required(),
  }),

  image: yup.string().when("type", {
    is: "blog",
    then: yup.string().objectId().required(),
  }),

  description: yup.string().when("type", {
    is: "blog",
    then: yup.string().min(1).required(),
  }),

  link: yup.string().when("type", {
    is: "blog",
    then: yup.string().trim().min(1).required(),
  }),
});

const editPostSchema = yup.object().shape({
  type: yup.string().trim().required(),
  title: yup.string().trim().min(1).required(),
  youtubeVideo: yup.string().when("type", {
    is: "youtube_video",
    then: yup.string().required(),
  }),

  image: yup.string().when("type", {
    is: "blog",
    then: yup.string().optional(),
  }),

  description: yup.string().when("type", {
    is: "blog",
    then: yup.string().min(1).required(),
  }),

  link: yup.string().when("type", {
    is: "blog",
    then: yup.string().trim().min(1).required(),
  }),
});

module.exports = {
  createPostSchema,
  editPostSchema,
};
