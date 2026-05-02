# Embedded Integration

This folder contains the ESP32 firmware scaffold for integrating the Smart Helmet Rider Monitoring System with the current backend.

## Files

- `esp32_smart_helmet/esp32_smart_helmet.ino`
  Main Arduino sketch aligned to the hardware team data specification for ESP32 + MQ-3 + IR eye blink sensor + MPU6050 + buzzer.

## Supported Hardware

- ESP32 Dev Board (`ESP-WROOM-32`)
- MQ-3 alcohol sensor
- MPU6050 accelerometer and gyroscope
- IR eye blink sensor
- Active buzzer
- Optional battery voltage divider input

## Default Pin Mapping

- MQ-3 analog: `GPIO 34`
- IR eye blink sensor: `GPIO 27`
- Buzzer: `GPIO 25`
- Battery sense: `GPIO 35`
- I2C SDA: `GPIO 21`
- I2C SCL: `GPIO 22`

Update the pin definitions in the sketch if the embedded team uses different wiring.

## Backend Endpoint

The sketch sends `HTTP POST` requests to:

`/api/helmet-data`

Example server URL:

`http://192.168.1.5:5000/api/helmet-data`

Do not use `localhost` in ESP32 firmware. Use the laptop or server IP that the ESP32 can reach over Wi-Fi.

## Payload Sent By The ESP32

The firmware posts JSON over Wi-Fi to the backend. Current payload shape:

```json
{
  "device_id": "H001",
  "alcohol_level": 1450,
  "alcohol_detected": false,
  "drowsiness": false,
  "fall_detected": false,
  "communication_mode": "WIFI_HTTP",
  "latitude": 12.650689,
  "longitude": 78.604675,
  "gps_fix": false,
  "signal_strength": "STRONG"
}
```

## Integration Steps

1. Update Wi-Fi credentials, backend server URL, device ID, and device API key directly in `esp32_smart_helmet.ino`
2. Open `esp32_smart_helmet.ino` in Arduino IDE
3. Install the required libraries:
   - `MPU6050` by Electronic Cats or compatible Jeff Rowberg-style MPU6050 library
   - `ArduinoJson`
4. Select the ESP32 board and COM port
5. Upload the sketch
6. Open Serial Monitor at `115200`
7. Confirm the ESP32 prints successful HTTP response codes

## Notes

- The buzzer is controlled locally for fast rider feedback
- The backend accepts this hardware JSON directly and normalizes it internally
- If Wi-Fi drops, the sketch automatically attempts reconnection
- GSM is still used for local emergency SMS from the helmet
- Thresholds can be tuned in the sketch based on real sensor calibration
- The sketch sends normal telemetry every 5 seconds
- If GPS does not have a live fix, the sketch sends the default fallback location `12.65068910917473, 78.60467542494665`
- If `DEVICE_API_KEY` is set in the backend, the ESP32 sends it as `x-device-key` automatically
