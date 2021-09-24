const customEnv = require("custom-env");

module.exports = (env_list) => {
  customEnv.env(process.env.NODE_ENV);

  env_list.forEach((ENV_VAR) => {
    if (!process.env[ENV_VAR])
      throw new Error(
        `FATAL ERROR: environment variable '${ENV_VAR}'is required.`
      );
  });
};
