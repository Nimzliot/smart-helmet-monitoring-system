#include <ArduinoJson.h>
#include <HardwareSerial.h>
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

#define GSM_RX_PIN 16
#define GSM_TX_PIN 17
#define GPS_RX_PIN 4
#define GPS_TX_PIN 2
#define GSM_BAUD 9600
#define GPS_BAUD 9600

#define GSM_APN "your_apn"
#define EMERGENCY_NUMBER "+919999999999"

#define MQ3_PIN 34
#define IR_PIN 27
#define BUZZER_PIN 25

#define NORMAL_INTERVAL 5000
#define SMS_COOLDOWN 30000
#define GSM_RETRY_INTERVAL 5000
#define WIFI_RETRY_INTERVAL 5000

#define MQ3_THRESHOLD 2000
#define FALL_THRESHOLD 20000

HardwareSerial gsmSerial(1);
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;
MPU6050 mpu;

unsigned long lastSend = 0;
unsigned long lastSmsAt = 0;
unsigned long lastGsmInitAttempt = 0;
unsigned long lastWifiAttempt = 0;

bool gsmReady = false;
String lastSmsType = "";

struct GpsData {
  bool fix;
  double latitude;
  double longitude;
};

String readResponse(unsigned long timeoutMs) {
  String response = "";
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    while (gsmSerial.available()) {
      response += (char)gsmSerial.read();
    }
  }

  response.trim();
  return response;
}

bool sendAT(const String& command, const char* expected, unsigned long timeoutMs) {
  gsmSerial.println(command);
  String response = readResponse(timeoutMs);
  Serial.println("GSM << " + command);
  Serial.println("GSM >> " + response);
  return response.indexOf(expected) >= 0;
}

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

bool initGsm() {
  if (gsmReady) return true;
  if (millis() - lastGsmInitAttempt < GSM_RETRY_INTERVAL) return false;

  lastGsmInitAttempt = millis();

  gsmReady =
    sendAT("AT", "OK", 2000) &&
    sendAT("ATE0", "OK", 2000) &&
    sendAT("AT+CMGF=1", "OK", 2000) &&
    sendAT("AT+SAPBR=3,1,\"Contype\",\"GPRS\"", "OK", 3000) &&
    sendAT(String("AT+SAPBR=3,1,\"APN\",\"") + GSM_APN + "\"", "OK", 3000);

  if (gsmReady) {
    bool bearerOpen = sendAT("AT+SAPBR=1,1", "OK", 10000);
    bool bearerAvailable = sendAT("AT+SAPBR=2,1", "+SAPBR:", 5000);
    gsmReady = bearerOpen || bearerAvailable;
  }

  Serial.println(gsmReady ? "GSM READY" : "GSM NOT READY");
  return gsmReady;
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
  return digitalRead(IR_PIN) == LOW;
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

String getAlertType(bool alcoholDetected, bool drowsinessDetected, bool fallDetected) {
  int count = (int)alcoholDetected + (int)drowsinessDetected + (int)fallDetected;

  if (count == 0) return "";
  if (count == 3) return "ALL_3";
  if (count == 2) return "ANY_2";
  if (alcoholDetected) return "ALCOHOL";
  if (drowsinessDetected) return "DROWSINESS";
  return "FALL";
}

String buildSmsMessage(const String& alertType, const GpsData& gpsData) {
  String locationText =
    " Location: https://maps.google.com/?q=" + String(gpsData.latitude, 6) + "," + String(gpsData.longitude, 6);

  if (!gpsData.fix) {
    locationText += " (default fallback)";
  }

  if (alertType == "ALCOHOL") {
    return "Smart Helmet Alert: Alcohol detected." + locationText;
  }

  if (alertType == "DROWSINESS") {
    return "Smart Helmet Alert: Drowsiness detected." + locationText;
  }

  if (alertType == "FALL") {
    return "Smart Helmet Alert: Fall detected." + locationText;
  }

  if (alertType == "ANY_2") {
    return "Smart Helmet Alert: Two dangers detected together." + locationText;
  }

  return "Smart Helmet Critical Alert: Alcohol, drowsiness, and fall detected." + locationText;
}

bool sendSms(const String& message) {
  if (!initGsm()) return false;
  if (!sendAT("AT+CMGF=1", "OK", 2000)) return false;

  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(EMERGENCY_NUMBER);
  gsmSerial.println("\"");

  if (readResponse(3000).indexOf(">") < 0) return false;

  gsmSerial.print(message);
  gsmSerial.write(26);

  String response = readResponse(10000);
  Serial.println("SMS >> " + response);
  return response.indexOf("OK") >= 0 || response.indexOf("+CMGS:") >= 0;
}

void maybeSendEmergencySms(bool alcoholDetected, bool drowsinessDetected, bool fallDetected, const GpsData& gpsData) {
  String alertType = getAlertType(alcoholDetected, drowsinessDetected, fallDetected);
  if (alertType.length() == 0) return;

  unsigned long now = millis();
  if (alertType == lastSmsType && now - lastSmsAt < SMS_COOLDOWN) return;

  String message = buildSmsMessage(alertType, gpsData);
  if (sendSms(message)) {
    lastSmsType = alertType;
    lastSmsAt = now;
    Serial.println("Emergency SMS sent");
  } else {
    Serial.println("Emergency SMS failed");
  }
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

  pinMode(IR_PIN, INPUT);
  pinMode(MQ3_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  Wire.begin(21, 22);
  mpu.initialize();

  gsmSerial.begin(GSM_BAUD, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  WiFi.mode(WIFI_STA);
  ensureWifiConnected();

  Serial.println(mpu.testConnection() ? "MPU6050 READY" : "MPU6050 NOT CONNECTED");
  Serial.println("SMART HELMET STARTED");
}

void loop() {
  updateGps();
  initGsm();
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
  Serial.print(alcoholDetected);
  Serial.print(" Drowsy=");
  Serial.print(drowsinessDetected);
  Serial.print(" Fall=");
  Serial.print(fallDetected);
  Serial.print(" GPS=");
  Serial.println(gpsData.fix ? "OK" : "NO FIX");
  Serial.print("WiFi=");
  Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");

  maybeSendEmergencySms(alcoholDetected, drowsinessDetected, fallDetected, gpsData);

  if (millis() - lastSend >= NORMAL_INTERVAL) {
    if (postTelemetry(alcoholDetected, drowsinessDetected, fallDetected, alcoholValue, gpsData)) {
      lastSend = millis();
    }
  }

  delay(200);
}
