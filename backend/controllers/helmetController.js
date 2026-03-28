const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");
const { createAlertsFromRecord } = require("../services/alertService");

const buildMockStatus = () => ({
  status: "No logs found or Supabase not configured. Start the simulator.",
  mock: true,
});

const normalizeHardwarePayload = (body) => {
  const acceleration = body.acceleration || {};
  const drowsinessDetected =
    body.drowsiness !== undefined
      ? body.drowsiness
      : body.drowsiness_status !== undefined
        ? Number(body.drowsiness_status) === 0
        : undefined;

  const eyeBlinkDetected =
    body.eye_blink_detected !== undefined
      ? body.eye_blink_detected
      : body.drowsiness_status !== undefined
        ? Number(body.drowsiness_status) === 0
        : undefined;

  return {
    helmet_id: body.helmet_id || body.device_id,
    alcohol_value: body.alcohol_value ?? body.alcohol_level,
    eye_blink_detected: eyeBlinkDetected,
    blink_rate: body.blink_rate,
    eye_closure_duration: body.eye_closure_duration,
    accel_x: body.accel_x ?? body.acceleration_x ?? acceleration.x,
    accel_y: body.accel_y ?? body.acceleration_y ?? acceleration.y,
    accel_z: body.accel_z ?? body.acceleration_z ?? acceleration.z,
    gyro_x: body.gyro_x,
    gyro_y: body.gyro_y,
    gyro_z: body.gyro_z,
    battery_voltage: body.battery_voltage,
    communication_mode: body.communication_mode,
    alcohol_detected: body.alcohol_detected,
    drowsiness: drowsinessDetected,
    fall_detected: body.fall_detected ?? body.accident_detected,
    battery_status: body.battery_status,
    timestamp: body.timestamp,
    latitude: body.latitude,
    longitude: body.longitude,
    signal_strength: body.signal_strength,
  };
};

const postHelmetData = asyncHandler(async (req, res) => {
  const payload = normalizeHardwarePayload(req.body);

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
