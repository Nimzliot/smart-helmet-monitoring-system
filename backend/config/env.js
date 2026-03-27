require("dotenv").config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 5000),
  frontendUrl: process.env.FRONTEND_URL || "*",
  jwtSecret: process.env.JWT_SECRET || "smart-helmet-demo-secret",
  jwtExpiresInHours: parseNumber(process.env.JWT_EXPIRES_IN_HOURS, 12),
  lowBatteryThreshold: parseNumber(process.env.LOW_BATTERY_THRESHOLD, 20),
  healthWindowMinutes: parseNumber(process.env.HEALTH_WINDOW_MINUTES, 10),
};
