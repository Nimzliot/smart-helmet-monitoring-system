const { logger } = require("../config/logger");

const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(error.message, error.stack);
  } else {
    logger.warn(error.message);
  }

  res.status(statusCode).json({
    error: error.message || "Internal Server Error",
    details: error.details || null,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
