const AuthSession = require("../models/AuthSession");
const jwt = require("../services/jwt");

const defaultOpts = { emailVerified: true, authentication: true };

module.exports = (allowed = "", options) => async (req, res, next) => {
  options = { ...defaultOpts, ...options };
  const token = req.header("x-auth-token");

  const { authentication } = options;
  //if authorization is not necessary and token is not provided then continue to handle request
  if (!token && !authentication) return next();

  //if authorization is necessary but token is not provided then stop handling the request request
  if (!token && authentication)
    return res
      .status(401)
      .send({ error: { message: "Access denied! No token provided." } });

  try {
    const decoded = jwt.decrypt(token);
    const authSession = await AuthSession.findByIdAndUpdate(decoded._id, {
      lastActivity: new Date(),
    }).populate("user");

    if (
      !authSession || // if there is no entry of auth session
      authSession.isExpired || // if token is expired
      typeof authSession.user !== "object" // if user is not populated
    )
      return res.status(401).send({
        error: { message: "Access denied! Invalid token provided." },
      });

    const { user } = authSession;

    const { emailVerified } = options;

    //email not verified
    if (emailVerified && user.emailVerified !== true)
      return res.status(401).send({
        error: { message: "Your email is not verified." },
      });

    if (
      allowed &&
      ((typeof allowed === "string" && user.role !== allowed) ||
        (Array.isArray(allowed) && !allowed.includes(user.role)))
    )
      return res.status(403).send({
        error: { message: "You have no access to perform this action." },
      });

    //good to go.
    req.authSession = authSession;

    next();
  } catch (ex) {
    return res.status(401).send({
      error: { message: "Access denied! Invalid token provided." },
    });
  }
};
