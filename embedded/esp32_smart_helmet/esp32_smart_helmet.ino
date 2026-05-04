#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <MPU6050.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <Wire.h>
#include <math.h>

#define SERVER_URL "http://192.168.1.10:5000/api/helmet-data"
#define DEVICE_ID "H001"
#define DEVICE_API_KEY "smart-detection-system"
#define DEFAULT_LATITUDE 12.65068910917473
#define DEFAULT_LONGITUDE 78.60467542494665
#define WIFI_SSID "your_wifi_name"
#define WIFI_PASSWORD "your_wifi_password"

#define GPS_RX_PIN 4
#define GPS_TX_PIN 2
#define GPS_BAUD 9600

#define MQ3_PIN 34
#define IR_PIN 27
#define BUZZER_PIN 25
#define IR_ACTIVE_STATE LOW
#define IR_CONFIRM_COUNT 25

#define NORMAL_INTERVAL 5000
#define WIFI_RETRY_INTERVAL 5000

#define MQ3_THRESHOLD 2000
#define FALL_THRESHOLD 20000

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;
MPU6050 mpu;

unsigned long lastSend = 0;
unsigned long lastWifiAttempt = 0;

int irClosedSamples = 0;
int irOpenSamples = 0;

struct GpsData {
  bool fix;
  double latitude;
  double longitude;
};

void ensureWifiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiAttempt < WIFI_RETRY_INTERVAL) return;

  lastWifiAttempt = millis();
  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("WiFi connecting...");

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 10000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi not connected");
  }
}

int readMQ3() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MQ3_PIN);
    delay(10);
  }
  return sum / 10;
}

bool isEyeClosed() {
  bool detected = digitalRead(IR_PIN) == IR_ACTIVE_STATE;

  if (detected) {
    if (irClosedSamples < IR_CONFIRM_COUNT) {
      irClosedSamples += 1;
    }
    irOpenSamples = 0;
  } else {
    if (irOpenSamples < IR_CONFIRM_COUNT) {
      irOpenSamples += 1;
    }

    if (irOpenSamples >= IR_CONFIRM_COUNT) {
      irClosedSamples = 0;
    }
  }

  return irClosedSamples >= IR_CONFIRM_COUNT;
}

float getAccelMag(int16_t ax, int16_t ay, int16_t az) {
  return sqrt((float)ax * ax + (float)ay * ay + (float)az * az);
}

void updateGps() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
}

GpsData getGpsData() {
  GpsData data;
  data.fix = gps.location.isValid();
  data.latitude = data.fix ? gps.location.lat() : DEFAULT_LATITUDE;
  data.longitude = data.fix ? gps.location.lng() : DEFAULT_LONGITUDE;
  return data;
}

bool postTelemetry(bool alcoholDetected, bool drowsinessDetected, bool fallDetected, int alcoholValue, const GpsData& gpsData) {
  ensureWifiConnected();
  if (WiFi.status() != WL_CONNECTED) return false;

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["alcohol_level"] = alcoholValue;
  doc["alcohol_detected"] = alcoholDetected;
  doc["drowsiness"] = drowsinessDetected;
  doc["fall_detected"] = fallDetected;
  doc["communication_mode"] = "WIFI_HTTP";

  doc["latitude"] = gpsData.latitude;
  doc["longitude"] = gpsData.longitude;
  doc["gps_fix"] = gpsData.fix;
  doc["signal_strength"] =
    WiFi.RSSI() >= -67 ? "STRONG" : WiFi.RSSI() >= -80 ? "MODERATE" : "WEAK";
  doc["battery_status"] = 100;

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  if (strlen(DEVICE_API_KEY) > 0) {
    http.addHeader("x-device-key", DEVICE_API_KEY);
  }

  int responseCode = http.POST(json);
  String responseBody = http.getString();
  http.end();

  Serial.print("HTTP POST -> ");
  Serial.println(responseCode);
  Serial.println(responseBody);

  return responseCode == 200 || responseCode == 201;
}

void setup() {
  Serial.begin(115200);

  pinMode(IR_PIN, INPUT_PULLUP);
  pinMode(MQ3_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(21, 22);
  mpu.initialize();

  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  WiFi.mode(WIFI_STA);
  ensureWifiConnected();

  Serial.println(mpu.testConnection() ? "MPU6050 READY" : "MPU6050 NOT CONNECTED");
  Serial.println("SMART HELMET STARTED");
}

void loop() {
  updateGps();
  ensureWifiConnected();

  int alcoholValue = readMQ3();
  bool alcoholDetected = alcoholValue > MQ3_THRESHOLD;
  bool drowsinessDetected = isEyeClosed();

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  bool fallDetected = getAccelMag(ax, ay, az) > FALL_THRESHOLD;

  GpsData gpsData = getGpsData();
  bool unsafe = alcoholDetected || drowsinessDetected || fallDetected;
  digitalWrite(BUZZER_PIN, unsafe ? HIGH : LOW);

  Serial.print("Alcohol=");
  Serial.print(alcoholValue);
  Serial.print(alcoholDetected ? " DETECTED" : " SAFE");
  Serial.print(" Drowsy=");
  Serial.print(drowsinessDetected);
  Serial.print(" Fall=");
  Serial.print(fallDetected);
  Serial.print(" GPS=");
  Serial.println(gpsData.fix ? "OK" : "NO FIX");
  Serial.print("Location=");
  Serial.print(gpsData.latitude, 6);
  Serial.print(",");
  Serial.println(gpsData.longitude, 6);
  Serial.print("WiFi=");
  Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");

  if (millis() - lastSend >= NORMAL_INTERVAL) {
    if (postTelemetry(alcoholDetected, drowsinessDetected, fallDetected, alcoholValue, gpsData)) {
      lastSend = millis();
    }
  }

  delay(200);
}
