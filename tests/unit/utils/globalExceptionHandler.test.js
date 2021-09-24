const globalExceptionHandler = require("../../../utils/globalExceptionHandler");

describe("globalExceptionHandler", () => {
  it("should register unhandled exception handler", () => {
    process.on = jest.fn();
    globalExceptionHandler();
    expect(process.on).toHaveBeenCalled();
    expect(process.on.mock.calls[0][0]).toBe("uncaughtException");
  });
});
