const globalRouteExceptionHandler = require("../../../middlewares/globalRouteExceptionHandler");

describe("globalRouteExceptionHandler", () => {
  it("should send response with 500 status code", () => {
    const err = {},
      req = {},
      res = {},
      next = {};

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);

    globalRouteExceptionHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should send response with message property", () => {
    const err = {},
      req = {},
      res = {},
      next = {};

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);

    globalRouteExceptionHandler(err, req, res, next);

    expect(res.send).toHaveBeenCalled();
    expect(res.send.mock.calls[0][0]).toHaveProperty("message");
  });

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });
    afterEach(() => {
      process.env.NODE_ENV = "test";
    });
    it("should send response with error property if in development environment", () => {
      const err = {},
        req = {},
        res = {},
        next = {};

      res.status = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);

      globalRouteExceptionHandler(err, req, res, next);

      expect(res.send).toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toHaveProperty("error");
    });
  });
});
