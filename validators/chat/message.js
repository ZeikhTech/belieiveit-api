const yup = require("yup");

const sendChatMessageSchema = yup.object().shape({
  chatRoom: yup.string().objectId().required(),
  customIdentifier: yup.string().required(),
  message: yup.string().trim().min(0).required(),
  tags: yup.array().of(
    yup.object({
      startIndex: yup
        .number("Invalid Tag Start Index")
        .min(0)
        .required("Tag start index is required"),
      endIndex: yup
        .number("Invalid Tag End Index")
        .min(0)
        .required("Tag end index is required"),
      user: yup
        .string()
        .objectId("Invalid User ID.")
        .required("Taged user ID is required"),
    })
  ),
});

const messageSeenSchema = yup.object().shape({
  messageId: yup.string().objectId().required(),
});

const messageDeliveredSchema = yup.object().shape({
  messageId: yup.string().objectId().required(),
});

module.exports = {
  sendChatMessageSchema,
  messageSeenSchema,
  messageDeliveredSchema,
};
