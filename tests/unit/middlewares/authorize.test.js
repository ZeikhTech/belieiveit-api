const authorize = require("../../../middlewares/authorize");

describe("authorize", () => {
  beforeEach(() => {
    process.env.JWT_SECRET_KEY = "123456";
  });

  it("should continue to handle request if token is not provided and authentication is not required.", () => {
    const err = {},
      req = {
        header: jest.fn(),
      },
      res = {},
      next = jest.fn();

    authorize("", { authentication: false })(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 401 status and response with error if token is not provided but authentication is required.", () => {
    const err = {},
      req = {
        header: jest.fn(),
      },
      res = {},
      next = jest.fn();

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    authorize()(req, res, next);

    expect(res.status).toHaveBeenCalled();
    expect(res.status.mock.calls[0][0]).toBe(401);

    expect(res.send).toHaveBeenCalled();
    expect(res.send.mock.calls[0][0]).toHaveProperty("error");
  });
});
