const requestValidator = require("../../../middlewares/requestValidator");
const yup = require("yup");

const schema = yup.object({
  name: yup.string().required(),
});

describe("requestValidator", () => {
  it("should validate the request body according to the given schema", async () => {
    const req = {
      body: {
        name: "name",
      },
    };
    const res = {};
    const next = jest.fn();

    await requestValidator(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should send response with status 400 if schema validation fails", async () => {
    const req = {
      body: {},
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    const next = jest.fn();

    await requestValidator(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should send response body with error if schema validation fails", async () => {
    const req = {
      body: {},
    };
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    const next = jest.fn();

    await requestValidator(schema)(req, res, next);
    expect(res.send).toHaveBeenCalled();
    expect(res.send.mock.calls[0][0]).toHaveProperty("error");
    expect(res.send.mock.calls[0][0]).toHaveProperty("error.name");
  });
});
