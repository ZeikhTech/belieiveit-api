module.exports = () => {
  process.on("unhandledRejection", (rejection) => {
    console.log(rejection);
  });
};
