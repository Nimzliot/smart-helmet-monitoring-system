const env = require("../config/env");
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/token");

const authenticate = (req, _res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return next(new AppError("Authentication token is required", 401));
  }

  try {
    req.user = verifyToken(token, env.jwtSecret);
    return next();
  } catch (error) {
    return next(new AppError(error.message, 401));
  }
};

const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to access this resource", 403));
  }

  return next();
};

module.exports = {
  authenticate,
  authorizeRoles,
};
