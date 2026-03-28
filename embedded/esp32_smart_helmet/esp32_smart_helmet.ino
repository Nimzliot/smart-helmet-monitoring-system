#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <MPU6050.h>
#include <math.h>
#include <string.h>

#include "secrets.h"

MPU6050 mpu;

static const int MQ3_PIN = 34;
static const int IR_PIN = 27;
static const int BUZZER_PIN = 25;

static const unsigned long NORMAL_TELEMETRY_INTERVAL_MS = 5000;
static const unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
static const unsigned long HTTP_TIMEOUT_MS = 5000;
static const unsigned long EMERGENCY_RETRY_COOLDOWN_MS = 1500;

static const int MQ3_THRESHOLD = 2200;
static const float FALL_ACCEL_DELTA_THRESHOLD = 0.85f;
static const uint8_t ALCOHOL_CONFIRMATION_COUNT = 3;
static const uint8_t FALL_CONFIRMATION_COUNT = 2;
static const bool IR_ACTIVE_LOW = true;

unsigned long lastTelemetryAt = 0;
unsigned long lastWifiRetryAt = 0;
unsigned long lastEmergencyTxAt = 0;
uint8_t alcoholHitCount = 0;
uint8_t fallHitCount = 0;

int readMQ3Average() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MQ3_PIN);
    delay(10);
  }
  return static_cast<int>(sum / 10);
}

bool readEyeClosed() {
  int rawState = digitalRead(IR_PIN);
  return IR_ACTIVE_LOW ? rawState == LOW : rawState == HIGH;
}

float computeAccelerationMagnitude(int16_t ax, int16_t ay, int16_t az) {
  return sqrtf(
    static_cast<float>(ax) * static_cast<float>(ax) +
    static_cast<float>(ay) * static_cast<float>(ay) +
    static_cast<float>(az) * static_cast<float>(az)
  );
}

float normalizeAcceleration(float rawValue) {
  return fabs(rawValue) > 32.0f ? rawValue / 16384.0f : rawValue;
}

float computeAccelerationDelta(float rawMagnitude) {
  float normalizedMagnitude = normalizeAcceleration(rawMagnitude);
  return fabs(normalizedMagnitude - 1.0f);
}

const char* classifySignalStrength(long rssi) {
  if (rssi >= -60) {
    return "STRONG";
  }
  if (rssi >= -75) {
    return "MODERATE";
  }
  return "WEAK";
}

void ensureWifiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  unsigned long now = millis();
  if (now - lastWifiRetryAt < WIFI_RETRY_INTERVAL_MS) {
    return;
  }

  lastWifiRetryAt = now;
  Serial.println("Connecting to WiFi...");
  WiFi.disconnect(true, true);
  delay(250);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void setupPins() {
  pinMode(IR_PIN, INPUT);
  pinMode(MQ3_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void setupMpu() {
  Wire.begin(21, 22);
  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("MPU6050 NOT CONNECTED!");
  } else {
    Serial.println("MPU6050 READY");
  }
}

void setupWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi not connected yet. The firmware will retry automatically.");
  }
}

String buildTimestamp() {
  unsigned long seconds = millis() / 1000;
  return String("1970-01-01T00:00:") + String(seconds) + "Z";
}

void printTelemetrySummary(
  int alcoholLevel,
  int drowsinessStatus,
  bool accidentDetected,
  int16_t ax,
  int16_t ay,
  int16_t az,
  float totalAcc,
  long rssi
) {
  Serial.print("Device: ");
  Serial.print(DEVICE_ID);
  Serial.print(" | AlcoholLevel: ");
  Serial.print(alcoholLevel);
  Serial.print(" | DrowsinessStatus: ");
  Serial.print(drowsinessStatus);
  Serial.print(" | AccidentDetected: ");
  Serial.print(accidentDetected ? 1 : 0);
  Serial.print(" | AccX: ");
  Serial.print(ax);
  Serial.print(" | AccY: ");
  Serial.print(ay);
  Serial.print(" | AccZ: ");
  Serial.print(az);
  Serial.print(" | AccDelta: ");
  Serial.print(computeAccelerationDelta(totalAcc), 3);
  Serial.print(" | Signal: ");
  Serial.print(classifySignalStrength(rssi));
  Serial.print(" | Status: ");

  if (accidentDetected) {
    Serial.print("ACCIDENT DETECTED");
  } else if (alcoholLevel > MQ3_THRESHOLD) {
    Serial.print("ALCOHOL DETECTED");
  } else if (drowsinessStatus == 0) {
    Serial.print("DROWSINESS DETECTED");
  } else {
    Serial.print("NORMAL");
  }

  Serial.println();
}

bool sendTelemetry(
  int alcoholLevel,
  int drowsinessStatus,
  bool accidentDetected,
  int16_t ax,
  int16_t ay,
  int16_t az
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping HTTP POST because WiFi is disconnected.");
    return false;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");
  if (strlen(DEVICE_API_KEY) > 0) {
    http.addHeader("x-device-key", DEVICE_API_KEY);
  }

  StaticJsonDocument<384> doc;
  doc["device_id"] = DEVICE_ID;
  doc["alcohol_level"] = alcoholLevel;
  doc["drowsiness_status"] = drowsinessStatus;
  doc["accident_detected"] = accidentDetected ? 1 : 0;

  JsonObject acceleration = doc.createNestedObject("acceleration");
  acceleration["x"] = ax;
  acceleration["y"] = ay;
  acceleration["z"] = az;

  doc["timestamp"] = buildTimestamp();

  String payload;
  serializeJson(doc, payload);

  int responseCode = http.POST(payload);
  Serial.print("HTTP Response: ");
  Serial.println(responseCode);

  if (responseCode > 0) {
    Serial.println(http.getString());
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(responseCode));
  }

  http.end();
  return responseCode > 0;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupPins();
  setupMpu();
  setupWifi();

  Serial.println("SMART HELMET FULL SYSTEM STARTED...");
}

void loop() {
  ensureWifiConnected();

  int alcoholLevel = readMQ3Average();
  bool eyeClosed = readEyeClosed();
  int drowsinessStatus = eyeClosed ? 0 : 1;

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  float totalAcc = computeAccelerationMagnitude(ax, ay, az);
  float accDelta = computeAccelerationDelta(totalAcc);

  alcoholHitCount = alcoholLevel > MQ3_THRESHOLD ? min<uint8_t>(alcoholHitCount + 1, ALCOHOL_CONFIRMATION_COUNT) : 0;
  fallHitCount = accDelta >= FALL_ACCEL_DELTA_THRESHOLD ? min<uint8_t>(fallHitCount + 1, FALL_CONFIRMATION_COUNT) : 0;

  bool alcoholDetected = alcoholHitCount >= ALCOHOL_CONFIRMATION_COUNT;
  bool accidentDetected = fallHitCount >= FALL_CONFIRMATION_COUNT;
  bool drowsinessDetected = drowsinessStatus == 0;
  bool unsafeCondition = alcoholDetected || drowsinessDetected || accidentDetected;

  digitalWrite(BUZZER_PIN, unsafeCondition ? HIGH : LOW);

  long rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -100;
  printTelemetrySummary(
    alcoholLevel,
    drowsinessStatus,
    accidentDetected,
    ax,
    ay,
    az,
    totalAcc,
    rssi
  );

  unsigned long now = millis();
  bool normalIntervalReached = now - lastTelemetryAt >= NORMAL_TELEMETRY_INTERVAL_MS;
  bool emergencyRetryReached = unsafeCondition && (now - lastEmergencyTxAt >= EMERGENCY_RETRY_COOLDOWN_MS);

  if (!normalIntervalReached && !emergencyRetryReached) {
    delay(50);
    return;
  }

  bool sent = sendTelemetry(
    alcoholLevel,
    drowsinessStatus,
    accidentDetected,
    ax,
    ay,
    az
  );

  if (sent) {
    lastTelemetryAt = now;
    if (unsafeCondition) {
      lastEmergencyTxAt = now;
    }
  }

  delay(50);
}
