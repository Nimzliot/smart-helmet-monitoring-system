const env = require("../config/env");
const db = require("./databaseService");
const { notifyEmergencyContact } = require("./notificationService");

const buildAlert = (record, type, severity, message) => ({
  id: `${type}-${record.helmet_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  helmet_id: record.helmet_id,
  type,
  severity,
  message,
  timestamp: record.timestamp,
});

const getAccidentSeverity = (record) => {
  const acceleration = [record.accel_x, record.accel_y, record.accel_z]
    .filter((value) => value !== null && value !== undefined)
    .reduce((sum, value) => sum + Math.abs(Number(value)), 0);
  const tiltAngle = [record.gyro_x, record.gyro_y, record.gyro_z]
    .filter((value) => value !== null && value !== undefined)
    .reduce((max, value) => Math.max(max, Math.abs(Number(value))), 0);
  const impactForce = acceleration * 18;
  const score = acceleration + tiltAngle / 90 + impactForce / 40;

  if (score >= 14) {
    return { level: 3, label: "Severe", score };
  }

  if (score >= 8) {
    return { level: 2, label: "Medium", score };
  }

  return { level: 1, label: "Minor", score };
};

const createAlertsFromRecord = async (record) => {
  const alerts = [];

  if (record.alcohol_detected) {
    alerts.push(
      buildAlert(
        record,
        "ALCOHOL_DETECTED",
        "CRITICAL",
        `MQ-3 sensor detected alcohol${record.alcohol_value != null ? ` (${record.alcohol_value})` : ""}. Vehicle start should be blocked.`
      )
    );
  }

  if (record.drowsiness) {
    alerts.push(
      buildAlert(
        record,
        "DROWSINESS_DETECTED",
        "DANGER",
        `IR eye-blink sensor indicates prolonged eye closure${record.eye_closure_duration != null ? ` (${record.eye_closure_duration}s)` : ""}. Pull over safely.`
      )
    );
  }

  if (record.fall_detected) {
    const accidentSeverity = getAccidentSeverity(record);
    alerts.push(
      buildAlert(
        record,
        "FALL_DETECTED",
        "CRITICAL",
        `MPU6050 detected sudden acceleration or tilt consistent with a fall/accident. Severity Level ${accidentSeverity.level} - ${accidentSeverity.label}. Location: ${record.latitude ?? "--"}, ${record.longitude ?? "--"}. SMS sent to emergency contact and ambulance service (108).`
      )
    );
  }

  if (record.battery_status <= env.lowBatteryThreshold) {
    alerts.push(
      buildAlert(record, "LOW_BATTERY", "WARNING", "Helmet battery is low. Recharge the device soon.")
    );
  }

  if (alerts.length === 0) {
    return [];
  }

  const storedAlerts = await db.createAlerts(alerts);

  if (record.fall_detected) {
    const rider = db.findRiderByHelmet(record.helmet_id);
    notifyEmergencyContact({
      helmetId: record.helmet_id,
      rider,
      location: {
        latitude: record.latitude,
        longitude: record.longitude,
      },
    });
  }

  return storedAlerts;
};

module.exports = {
  createAlertsFromRecord,
};
