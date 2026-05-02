const http = require("http");
require("dotenv").config();

const helmets = [
  { helmet_id: "H001", latitude: 12.9716, longitude: 77.5946, altitude: 921.4, battery: 96, operator: "Airtel" },
  { helmet_id: "H002", latitude: 12.9754, longitude: 77.5992, altitude: 918.8, battery: 83, operator: "Jio" },
  { helmet_id: "H003", latitude: 12.9688, longitude: 77.5899, altitude: 915.2, battery: 74, operator: "Vi" },
];

const port = Number(process.env.PORT || 5000);
const deviceApiKey = process.env.DEVICE_API_KEY || "";

console.log("Starting ESP32-style smart helmet simulator...");
console.log(`Sending mock sensor data to http://localhost:${port}/api/helmet-data every 5 seconds.`);

const randomInRange = (min, max, digits = 6) => Number((Math.random() * (max - min) + min).toFixed(digits));

const sendPayload = (helmet) => {
  helmet.battery = helmet.battery <= 15 ? 100 : Math.max(10, helmet.battery - Math.floor(Math.random() * 3));
  helmet.latitude = Number((helmet.latitude + randomInRange(-0.0015, 0.0015)).toFixed(6));
  helmet.longitude = Number((helmet.longitude + randomInRange(-0.0015, 0.0015)).toFixed(6));
  helmet.altitude = Number((helmet.altitude + randomInRange(-1.8, 1.8, 2)).toFixed(2));

  const alcoholEvent = Math.random() < 0.06;
  const drowsyEvent = Math.random() < 0.12;
  const fallEvent = Math.random() < 0.04;
  const alcoholValue = alcoholEvent ? randomInRange(360, 520, 0) : randomInRange(120, 300, 0);
  const eyeClosureDuration = drowsyEvent ? randomInRange(2.6, 4.2, 2) : randomInRange(0.1, 1.4, 2);
  const blinkRate = drowsyEvent ? randomInRange(4, 8, 0) : randomInRange(12, 22, 0);
  const accelX = fallEvent ? randomInRange(1.8, 3.4, 2) : randomInRange(-0.6, 0.6, 2);
  const accelY = fallEvent ? randomInRange(1.2, 2.6, 2) : randomInRange(-0.5, 0.5, 2);
  const accelZ = fallEvent ? randomInRange(1.2, 2.4, 2) : randomInRange(0.7, 1.4, 2);
  const gyroX = fallEvent ? randomInRange(180, 260, 2) : randomInRange(-35, 35, 2);
  const gyroY = fallEvent ? randomInRange(150, 240, 2) : randomInRange(-30, 30, 2);
  const gyroZ = fallEvent ? randomInRange(160, 220, 2) : randomInRange(-30, 30, 2);
  const batteryVoltage = Number((3.3 + (helmet.battery / 100) * 0.9).toFixed(2));
  const gpsFix = Math.random() > 0.08;
  const gpsSatellites = gpsFix ? Math.floor(randomInRange(5, 12, 0)) : Math.floor(randomInRange(0, 3, 0));
  const gpsSpeed = gpsFix ? (fallEvent ? randomInRange(18, 62, 2) : randomInRange(0, 48, 2)) : 0;
  const gsmSignalDbm = Number(randomInRange(-95, -67, 0));
  const gsmRegistered = Math.random() > 0.04;
  const signal = gsmSignalDbm >= -75 ? "STRONG" : gsmSignalDbm >= -88 ? "MODERATE" : "WEAK";

  const payload = JSON.stringify({
    helmet_id: helmet.helmet_id,
    alcohol_value: alcoholValue,
    eye_blink_detected: drowsyEvent,
    blink_rate: blinkRate,
    eye_closure_duration: eyeClosureDuration,
    accel_x: accelX,
    accel_y: accelY,
    accel_z: accelZ,
    gyro_x: gyroX,
    gyro_y: gyroY,
    gyro_z: gyroZ,
    battery_voltage: batteryVoltage,
    battery_status: helmet.battery,
    latitude: helmet.latitude,
    longitude: helmet.longitude,
    gps_fix: gpsFix,
    gps_satellites: gpsSatellites,
    gps_speed: gpsSpeed,
    gps_altitude: helmet.altitude,
    gps_last_update: new Date().toISOString(),
    signal_strength: signal,
    communication_mode: "WIFI_HTTP",
    gsm_signal_dbm: gsmSignalDbm,
    gsm_network: "GSM900",
    gsm_operator: helmet.operator,
    gsm_registered: gsmRegistered,
    timestamp: new Date().toISOString(),
  });

  const request = http.request(
    {
      hostname: "localhost",
      port,
      path: "/api/helmet-data",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...(deviceApiKey ? { "x-device-key": deviceApiKey } : {}),
      },
    },
    (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if (response.statusCode === 201) {
          console.log(
            `[${new Date().toLocaleTimeString()}] ${helmet.helmet_id} -> ` +
              `MQ3 ${alcoholValue} | Eye ${eyeClosureDuration}s | MPU (${accelX},${accelY},${accelZ}) | ` +
              `Battery ${helmet.battery}%/${batteryVoltage}V | GPS ${helmet.latitude},${helmet.longitude} fix=${gpsFix} sats=${gpsSatellites} | GSM ${helmet.operator} ${gsmSignalDbm}dBm ${signal}`
          );
        } else {
          console.error(`Failed to send ${helmet.helmet_id}: ${response.statusCode} ${body}`);
        }
      });
    }
  );

  request.on("error", (error) => {
    console.error(`Simulator error for ${helmet.helmet_id}: ${error.message}`);
  });

  request.write(payload);
  request.end();
};

setInterval(() => {
  helmets.forEach(sendPayload);
}, 5000);

helmets.forEach(sendPayload);
