const yup = require("yup");

const createGroupChatSchema = yup.object().shape({
  name: yup.string().trim().min(0).max(200),
  description: yup.string().trim().min(0).max(500),
  image: yup.string().optional(),
  isPublic: yup.boolean().optional(),
  members: yup.array().of(yup.string().objectId()).min(1).required(),
});

const indicateTypingSchema = yup.object().shape({
  chatRoom: yup.string().objectId().required(),
  typing: yup.boolean().required(),
});

const removeMemberSchema = yup.object().shape({
  memberId: yup.string().objectId().required(),
});

module.exports = {
  createGroupChatSchema,
  indicateTypingSchema,
};
