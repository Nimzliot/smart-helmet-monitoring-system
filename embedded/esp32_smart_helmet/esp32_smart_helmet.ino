#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <MPU6050.h>
#include <math.h>
#include <string.h>

// ---------- WiFi + Server ----------
#define WIFI_SSID "Smart Helmet"
#define WIFI_PASSWORD "87654321"
#define SERVER_URL "http://10.18.149.160:5000/api/helmet-data"

#define DEVICE_ID "HELMET_001"
#define DEVICE_API_KEY ""   // put key if required

// ---------- Pins ----------
#define MQ3_PIN 34
#define IR_PIN 27
#define BUZZER_PIN 25

// ---------- Timing ----------
#define NORMAL_INTERVAL 5000
#define WIFI_RETRY 5000
#define HTTP_TIMEOUT 5000
#define EMERGENCY_INTERVAL 1500

// ---------- Thresholds ----------
#define MQ3_THRESHOLD 2000
#define FALL_THRESHOLD 20000

MPU6050 mpu;

unsigned long lastSend = 0;
unsigned long lastWifiTry = 0;
unsigned long lastEmergency = 0;

const char* getSignalStrengthLabel() {
  long rssi = WiFi.RSSI();

  if (rssi >= -60) return "STRONG";
  if (rssi >= -75) return "MODERATE";
  return "WEAK";
}

// ---------- MQ-3 Averaging ----------
int readMQ3() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MQ3_PIN);
    delay(10);
  }
  return sum / 10;
}

// ---------- Eye Detection ----------
bool isEyeClosed() {
  return digitalRead(IR_PIN) == LOW; // active LOW
}

// ---------- Acceleration ----------
float getAccelMag(int16_t ax, int16_t ay, int16_t az) {
  return sqrt((float)ax * ax + (float)ay * ay + (float)az * az);
}

// ---------- WiFi Reconnect ----------
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  if (millis() - lastWifiTry < WIFI_RETRY) return;

  lastWifiTry = millis();
  Serial.println("Reconnecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ---------- Send Data ----------
void sendData(int alcohol, int eye, int accident, int16_t ax, int16_t ay, int16_t az) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping POST.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(HTTP_TIMEOUT);

  http.addHeader("Content-Type", "application/json");

  // ✅ Device key header
  if (strlen(DEVICE_API_KEY) > 0) {
    http.addHeader("x-device-key", DEVICE_API_KEY);
  }

  StaticJsonDocument<256> doc;

  doc["device_id"] = DEVICE_ID;
  doc["alcohol_level"] = alcohol;
  doc["drowsiness_status"] = eye;
  doc["accident_detected"] = accident;
  doc["communication_mode"] = "ESP32_HTTP";
  doc["signal_strength"] = getSignalStrengthLabel();

  JsonObject acc = doc.createNestedObject("acceleration");
  acc["x"] = ax;
  acc["y"] = ay;
  acc["z"] = az;

  // ❌ timestamp removed (backend handles it)

  String json;
  serializeJson(doc, json);

  int code = http.POST(json);

  Serial.print("HTTP Response Code: ");
  Serial.println(code);

  if (code > 0) {
    Serial.println(http.getString());
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(code));
  }

  http.end();
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);

  pinMode(IR_PIN, INPUT);
  pinMode(MQ3_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(21, 22);
  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("MPU6050 NOT CONNECTED!");
  } else {
    Serial.println("MPU6050 READY");
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("SMART HELMET SYSTEM STARTED");
}

// ---------- Loop ----------
void loop() {

  reconnectWiFi();

  int alcohol = readMQ3();
  int eyeStatus = isEyeClosed() ? 0 : 1;

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  float acc = getAccelMag(ax, ay, az);
  int accident = (acc > FALL_THRESHOLD) ? 1 : 0;

  bool unsafe = (alcohol > MQ3_THRESHOLD) || (eyeStatus == 0) || accident;

  digitalWrite(BUZZER_PIN, unsafe ? HIGH : LOW);

  Serial.print("Alcohol: ");
  Serial.print(alcohol);
  Serial.print(" | Eye: ");
  Serial.print(eyeStatus);
  Serial.print(" | Acc: ");
  Serial.print(acc);
  Serial.print(" | Status: ");
  Serial.println(unsafe ? "UNSAFE" : "SAFE");

  unsigned long now = millis();

  bool normal = (now - lastSend > NORMAL_INTERVAL);
  bool emergency = unsafe && (now - lastEmergency > EMERGENCY_INTERVAL);

  if (normal || emergency) {
    sendData(alcohol, eyeStatus, accident, ax, ay, az);

    lastSend = now;
    if (unsafe) lastEmergency = now;
  }

  delay(100);
}
