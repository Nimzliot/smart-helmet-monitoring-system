require("dotenv").config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value) => {
  if (!value || value.trim() === "*") {
    return ["*"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const frontendOrigins = parseOrigins(process.env.FRONTEND_URL);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 5000),
  frontendUrl: process.env.FRONTEND_URL || "*",
  frontendOrigins,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "smart-helmet-demo-secret",
  jwtExpiresInHours: parseNumber(process.env.JWT_EXPIRES_IN_HOURS, 12),
  lowBatteryThreshold: parseNumber(process.env.LOW_BATTERY_THRESHOLD, 20),
  healthWindowMinutes: parseNumber(process.env.HEALTH_WINDOW_MINUTES, 10),
  hardwareOfflineThresholdSeconds: parseNumber(process.env.HARDWARE_OFFLINE_THRESHOLD_SECONDS, 15),
  deviceApiKey: process.env.DEVICE_API_KEY || "",
  defaultLatitude: parseNumber(process.env.DEFAULT_LATITUDE, 12.65068910917473),
  defaultLongitude: parseNumber(process.env.DEFAULT_LONGITUDE, 78.60467542494665),
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || "",
  fast2smsRoute: process.env.FAST2SMS_ROUTE || "q",
  fast2smsLanguage: process.env.FAST2SMS_LANGUAGE || "english",
};
