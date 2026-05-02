const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");
const { createAlertsFromRecord } = require("../services/alertService");

const buildMockStatus = () => ({
  status: "No logs found yet. Start the simulator or connect the ESP32.",
  mock: true,
});

const normalizeHardwarePayload = (body) => {
  const acceleration = body.acceleration || {};
  const gps = body.gps || {};
  const gsm = body.gsm || {};
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
    latitude: body.latitude ?? gps.latitude ?? gps.lat,
    longitude: body.longitude ?? gps.longitude ?? gps.lng,
    gps_fix: body.gps_fix ?? gps.fix,
    gps_satellites: body.gps_satellites ?? gps.satellites,
    gps_speed: body.gps_speed ?? gps.speed,
    gps_altitude: body.gps_altitude ?? gps.altitude,
    gps_last_update: body.gps_last_update ?? gps.timestamp,
    signal_strength: body.signal_strength ?? gsm.signal_strength,
    gsm_signal_dbm: body.gsm_signal_dbm ?? gsm.signal_dbm,
    gsm_network: body.gsm_network ?? gsm.network,
    gsm_operator: body.gsm_operator ?? gsm.operator,
    gsm_registered: body.gsm_registered ?? gsm.registered,
  };
};

const postHelmetData = asyncHandler(async (req, res) => {
  const payload = normalizeHardwarePayload(req.body);

  const { record, helmet } = await db.createHelmetLog(payload);
  const alerts = await createAlertsFromRecord(record);
  const io = req.app.locals.io;

  io.emit("helmet-update", record);
  io.emit("helmet:update", { record, helmet });
  io.emit("helmet:heartbeat", {
    helmet_id: record.helmet_id,
    timestamp: record.timestamp,
    communication_mode: record.communication_mode,
    gps_fix: record.gps_fix,
  });
  io.emit("helmet:location", {
    helmet_id: record.helmet_id,
    latitude: record.latitude,
    longitude: record.longitude,
    gps_fix: record.gps_fix,
    gps_satellites: record.gps_satellites,
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
