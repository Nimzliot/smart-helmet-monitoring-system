let morgan;

try {
  morgan = require("morgan");
} catch (error) {
  morgan = null;
}

const logger = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};

const requestLogger = morgan
  ? morgan("dev")
  : (req, _res, next) => {
      logger.info(`${req.method} ${req.originalUrl}`);
      next();
    };

module.exports = {
  logger,
  requestLogger,
};
