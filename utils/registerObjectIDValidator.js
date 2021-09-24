const yup = require("yup");

const validateObjectId = require("../helpers/validateObjectId");
module.exports = () => {
  yup.addMethod(yup.string, "objectId", function (message, context) {
    return this.test({
      message,
      test: function (value) {
        const isValid = validateObjectId(value);
        return isValid || this.createError({ path: this.path, message });
      },
    });
  });
};
