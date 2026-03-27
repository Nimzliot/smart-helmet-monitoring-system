const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");
const { createAlertsFromRecord } = require("../services/alertService");

const buildMockStatus = () => ({
  status: "No logs found or Supabase not configured. Start the simulator.",
  mock: true,
});

const postHelmetData = asyncHandler(async (req, res) => {
  const payload = {
    helmet_id: req.body.helmet_id,
    alcohol_value: req.body.alcohol_value,
    eye_blink_detected: req.body.eye_blink_detected,
    blink_rate: req.body.blink_rate,
    eye_closure_duration: req.body.eye_closure_duration,
    accel_x: req.body.accel_x,
    accel_y: req.body.accel_y,
    accel_z: req.body.accel_z,
    gyro_x: req.body.gyro_x,
    gyro_y: req.body.gyro_y,
    gyro_z: req.body.gyro_z,
    battery_voltage: req.body.battery_voltage,
    communication_mode: req.body.communication_mode,
    alcohol_detected: req.body.alcohol_detected,
    drowsiness: req.body.drowsiness,
    fall_detected: req.body.fall_detected,
    battery_status: req.body.battery_status,
    timestamp: req.body.timestamp,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    signal_strength: req.body.signal_strength,
  };

  const { record, helmet } = await db.createHelmetLog(payload);
  const alerts = await createAlertsFromRecord(record);
  const io = req.app.locals.io;

  io.emit("helmet-update", record);
  io.emit("helmet:update", { record, helmet });
  io.emit("helmet:location", {
    helmet_id: record.helmet_id,
    latitude: record.latitude,
    longitude: record.longitude,
    timestamp: record.timestamp,
  });

  alerts.forEach((alert) => io.emit("alert:new", alert));

  res.status(201).json({
    message: "Data received",
    data: record,
    alerts,
  });
});

const getStatus = asyncHandler(async (req, res) => {
  const helmetId = req.query.helmet_id || "H001";
  const status = await db.getLatestStatus(helmetId);
  res.json(status || buildMockStatus());
});

const getHistory = asyncHandler(async (_req, res) => {
  const history = await db.getHistory(100);
  res.json(history);
});

const getAlerts = asyncHandler(async (_req, res) => {
  const alerts = await db.getAlerts(50);
  res.json(alerts);
});

const getHelmets = asyncHandler(async (_req, res) => {
  const helmets = await db.listHelmets();
  res.json(helmets);
});

const postHelmet = asyncHandler(async (req, res) => {
  const helmet = await db.createHelmet(req.body);
  res.status(201).json(helmet);
});

module.exports = {
  postHelmetData,
  getStatus,
  getHistory,
  getAlerts,
  getHelmets,
  postHelmet,
};
