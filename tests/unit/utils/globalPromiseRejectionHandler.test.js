const globalPromiseRejectionHandler = require("../../../utils/globalPromiseRejectionHandler");

describe("globalPromiseRejectionHandler", () => {
  it("should register unhandled exception handler", () => {
    process.on = jest.fn();
    globalPromiseRejectionHandler();
    expect(process.on).toHaveBeenCalled();
    expect(process.on.mock.calls[0][0]).toBe("unhandledRejection");
  });
});
