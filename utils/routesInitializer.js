const fs = require("fs");
const path = require("path");

const _ = require("lodash");

const ROUTES_PATH = path.join(__dirname, "../routes");
const ROUTE_FILE_EXTENSION = ".js";

const routeInitializer = (app, routePath = ROUTES_PATH, baseRoute = "/") => {
  let p =
    routePath[routePath.length - 1] == "/"
      ? routePath.substr(0, routePath.length - 1)
      : routePath; // format to remove trailing '/'

  const subDirs = [];
  fs.readdirSync(routePath).forEach((item) => {
    const ITEM_PATH = `${p}/${item}`;
    const stats = fs.statSync(ITEM_PATH);
    if (!stats.isDirectory() && ITEM_PATH.indexOf(ROUTE_FILE_EXTENSION) != -1) {
      const router = require(ITEM_PATH);

      if (typeof router == "function") {
        const fileName =
          item === "index.js" ? "" : item.split(".").slice(0, -1).join(".");
        app.use(path.join(baseRoute, _.snakeCase(fileName)), router);
      }
    } else {
      subDirs.push(item);
    }
  });

  subDirs.forEach((subDir) =>
    routeInitializer(
      app,
      `${p}/${subDir}`,
      `${path.join(baseRoute, subDir.toLowerCase())}`
    )
  ); // recurse
};

module.exports = routeInitializer;
