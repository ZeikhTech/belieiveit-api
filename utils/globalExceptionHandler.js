module.exports = function () {
  process.on("uncaughtException", (ex) => {
    console.log(ex);
  });
};
