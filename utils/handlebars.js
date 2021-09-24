const exphbs = require("express-handlebars");
const path = require("path");
const engineOptions = {
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "..", "views", "layouts"),
  partialsDir: path.join(__dirname, "..", "views", "partials"),
  extname: "hbs",
};

const hbs = exphbs.create(engineOptions);

const configureHbs = (app) => {
  app.set("views", path.join(__dirname, "..", "views"));
  app.engine("hbs", exphbs(engineOptions));
  app.set("view engine", "hbs");
};

module.exports = {
  hbs,
  configureHbs,
};
