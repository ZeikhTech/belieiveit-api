const environmentVariables = require("../../../utils/environmentVariables");
const customEnv = require("custom-env");

describe("environmentVariables", () => {
  it("should register env_variables based on environment", () => {
    customEnv.env = jest.fn();
    environmentVariables([]);

    expect(customEnv.env).toHaveBeenCalled();
    expect(customEnv.env.mock.calls[0][0]).toBe(process.env.NODE_ENV);
  });

  it("should throw if any environment variable provided in list is undefined", () => {
    const env_list = ["SOME_RANDOM_VARIABLE_NAME"];
    expect(() => {
      environmentVariables(env_list);
    }).toThrow();
  });
});
