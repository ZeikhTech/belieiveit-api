const routesInitializer = require("../../../utils/routesInitializer");
const registerObjectIDValidator = require("../../../utils/registerObjectIDValidator");

describe("routesInitializer", () => {
  it("should register all routes", () => {
    const app = {
      use: jest.fn(),
    };
    registerObjectIDValidator();
    routesInitializer(app);

    expect(app.use).toHaveBeenCalled();
  });
});
