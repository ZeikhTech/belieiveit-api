module.exports = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body);
    return next();
  } catch (validationError) {
    const { path, errors } = validationError;
    res.status(400).send({
      error_type: "request_validation_error",
      error: {
        [path]: errors[0],
      },
    });
  }
};
