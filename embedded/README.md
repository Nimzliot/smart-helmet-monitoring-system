# Embedded Integration

This folder contains the ESP32 firmware scaffold for integrating the Smart Helmet Rider Monitoring System with the current backend.

## Files

- `esp32_smart_helmet/esp32_smart_helmet.ino`
  Main Arduino sketch aligned to the hardware team data specification for ESP32 + MQ-3 + IR eye blink sensor + MPU6050 + buzzer.
- `esp32_smart_helmet/secrets.example.h`
  Copy this to `secrets.h` and fill in your Wi-Fi and backend details before flashing.

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

The firmware sends telemetry in the hardware team's exact JSON format:

```json
{
  "device_id": "HELMET_001",
  "alcohol_level": 1450,
  "drowsiness_status": 1,
  "accident_detected": 0,
  "acceleration": {
    "x": 120,
    "y": -85,
    "z": 16200
  },
  "timestamp": "2026-03-28T10:30:00Z"
}
```

## Integration Steps

1. Copy `secrets.example.h` to `secrets.h`
2. Update Wi-Fi credentials, backend server URL, device ID, and device API key
3. Open `esp32_smart_helmet.ino` in Arduino IDE
4. Install the required libraries:
   - `MPU6050` by Electronic Cats or compatible Jeff Rowberg-style MPU6050 library
   - `ArduinoJson`
5. Select the ESP32 board and COM port
6. Upload the sketch
7. Open Serial Monitor at `115200`
8. Confirm the ESP32 prints successful HTTP response codes

## Notes

- The buzzer is controlled locally for fast rider feedback
- The backend accepts this hardware JSON directly and normalizes it internally
- If Wi-Fi drops, the sketch automatically attempts reconnection
- Thresholds can be tuned in the sketch based on real sensor calibration
- The sketch sends normal telemetry every 5 seconds
- The sketch also sends immediately during alcohol, drowsiness, or accident conditions
- `IR_ACTIVE_LOW` can be changed in the sketch if the eye sensor wiring behaves as active-high
- If `DEVICE_API_KEY` is set in the backend, the ESP32 sends it as `x-device-key` automatically
