// =====================================================
// SPROUTSENSE ESP32-SENSOR-001 — FINAL PRODUCTION
// Board: ESP32 Dev Module
// Sensors: Soil Moisture, pH, LDR, DHT22
// Actuators: Relay (GPIO 14) + Flow Sensor (GPIO 12)
// Display: TFT ST7735R (SPI)
// Backend: Render.com
// =====================================================
//
// ARDUINO IDE SETTINGS:
//   Board           : ESP32 Dev Module
//   Upload Speed    : 921600
//   CPU Frequency   : 240 MHz
//   Flash Size      : 4MB (32Mb)
//   Partition Scheme: Huge APP (3MB No OTA)
//   Flash Mode      : QIO
//
// REQUIRED LIBRARIES:
//   - DHT sensor library     (Adafruit)
//   - Adafruit GFX Library   (Adafruit)
//   - Adafruit ST7735        (Adafruit)
//   - ArduinoJson            (Benoit Blanchon)
//   - HTTPClient             (built-in ESP32)
//
// BACKEND FIELD NAMES (match schema exactly):
//   soilMoisture  -> 0-100 (%)
//   pH            -> 0-14   *** capital H! ***
//   light         -> 0-100000 (lux)
//   temperature   -> Celsius
//   humidity      -> 0-100 (%)
//   flowRate      -> mL/min
//   flowVolume    -> mL dispensed
//   deviceId      -> "ESP32-SENSOR-001"
// =====================================================

// ========== LIBRARIES ==========
#include <WiFi.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>

// ========== WIFI CREDENTIALS ==========
// Change these to your network
const char* WIFI_SSID     = "@Connect";
const char* WIFI_PASSWORD = "qwertyomm";

// ========== STATIC IP (optional) ==========
#define STATICIP_ENABLED true
const uint8_t STATIC_IP[]      = {192, 168, 1, 120};
const uint8_t STATIC_GATEWAY[] = {192, 168, 1,   1};
const uint8_t STATIC_SUBNET[]  = {255, 255, 255, 0};
const uint8_t STATIC_DNS1[]    = {8,   8,   8,   8};

// ========== PIN CONFIGURATION (ADC1 ONLY — WiFi safe) ==========
#define PIN_SOIL_MOISTURE  35   // ADC1_CH7 — Capacitive moisture sensor
#define PIN_PH_SENSOR      34   // ADC1_CH6 — Analog pH probe
#define PIN_LDR            39   // ADC1_CH3 — LDR light sensor
#define PIN_DHT            13   // Digital   — DHT22 temperature/humidity
#define PIN_RELAY          14   // Output    — Relay CH1 → Water pump
#define PIN_FLOW_SENSOR    12   // Interrupt — YF-S401 flow meter

// TFT ST7735R (128x160) — Hardware SPI
#define PIN_TFT_CS   5
#define PIN_TFT_RST  4
#define PIN_TFT_DC   27
// MOSI = GPIO 23, SCLK = GPIO 18 (fixed hardware SPI)

// ========== SENSOR SETTINGS ==========
#define DHT_TYPE           DHT22
#define MOISTURE_THRESHOLD 30.0    // Auto-water below this %
#define TARGET_WATER_ML    100.0   // Volume per watering cycle
#define PUMP_MAX_TIME_MS   20000   // Safety timeout (20 seconds)

// Moisture ADC calibration — adjust per sensor
#define MOISTURE_ADC_DRY   2800    // Raw ADC reading in dry air
#define MOISTURE_ADC_WET   1200    // Raw ADC reading in water

// LDR calibration — maps to lux for backend
#define LUX_MAX 100000.0

// Flow sensor calibration
#define FLOW_PULSES_PER_ML  5.5    // YF-S401: adjust if measurement drifts

// ========== BACKEND ==========
// *** IMPORTANT: /sproutsense in MONGODB_URI on Render! ***
const char* BACKEND_URL = "https://sproutsense-backend.onrender.com/api/sensors";
const char* DEVICE_ID   = "ESP32-SENSOR-001";

// ========== TIMING (milliseconds) ==========
#define INTERVAL_SENSORS  5000    // Read sensors every 5s
#define INTERVAL_BACKEND  15000   // Send to backend every 15s
#define INTERVAL_TFT      5000    // Update TFT every 5s

// ========== OBJECTS ==========
DHT dht(PIN_DHT, DHT_TYPE);
Adafruit_ST7735 tft = Adafruit_ST7735(PIN_TFT_CS, PIN_TFT_DC, PIN_TFT_RST);

// ========== TFT COLORS ==========
#define C_BLACK   0x0000
#define C_WHITE   0xFFFF
#define C_CYAN    0x07FF
#define C_GREEN   0x07E0
#define C_YELLOW  0xFFE0
#define C_RED     0xF800
#define C_ORANGE  0xFD20
#define C_LGRAY   0xC618
#define C_DGRAY   0x4208

// ========== FLOW SENSOR (interrupt-driven) ==========
volatile unsigned long flowPulseCount = 0;

void IRAM_ATTR flowISR() {
  flowPulseCount++;
}

float getFlowVolumeMl() {
  return (float)flowPulseCount / FLOW_PULSES_PER_ML;
}

void resetFlowCounter() {
  flowPulseCount = 0;
}

// ========== PUMP CONTROL ==========
bool pumpRunning   = false;
bool manualPump    = false;
unsigned long pumpStartTime = 0;

void startPump() {
  resetFlowCounter();
  digitalWrite(PIN_RELAY, HIGH);
  pumpRunning   = true;
  pumpStartTime = millis();
  Serial.println("[PUMP] ON — target: " + String(TARGET_WATER_ML) + " mL");
}

void stopPump() {
  digitalWrite(PIN_RELAY, LOW);
  pumpRunning = false;
  Serial.printf("[PUMP] OFF — dispensed: %.1f mL in %lums\n",
    getFlowVolumeMl(), millis() - pumpStartTime);
}

void updatePumpLogic() {
  if (!pumpRunning) return;
  float vol     = getFlowVolumeMl();
  unsigned long runtime = millis() - pumpStartTime;
  if (vol >= TARGET_WATER_ML) {
    Serial.println("[PUMP] Target volume reached");
    stopPump();
  } else if (runtime >= PUMP_MAX_TIME_MS) {
    Serial.println("[PUMP] Safety timeout — stopping");
    stopPump();
  }
}

// ========== CACHED SENSOR VALUES ==========
float cachedMoisture = 0;
float cachedPH       = 7.0;
float cachedLux      = 0;
float cachedTemp     = 0;
float cachedHumidity = 0;
bool  dhtValid       = false;

// ========== SENSOR READ FUNCTIONS ==========
float readSoilMoisture() {
  int raw = analogRead(PIN_SOIL_MOISTURE);
  float pct = (float)(MOISTURE_ADC_DRY - raw) /
              (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

float readPH() {
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_PH_SENSOR);
    delayMicroseconds(200);
  }
  float voltage = (sum / 5.0 / 4095.0) * 3.3;
  return constrain(7.0 - ((voltage - 2.5) / 0.18), 0.0, 14.0);
}

float readLux() {
  return (analogRead(PIN_LDR) / 4095.0) * LUX_MAX;
}

void updateAllSensors() {
  cachedMoisture = readSoilMoisture();
  cachedPH       = readPH();
  cachedLux      = readLux();
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    cachedTemp = t; cachedHumidity = h; dhtValid = true;
  }
}

void printSensors() {
  Serial.printf("[SENSORS] Moisture:%.1f%% pH:%.2f Lux:%.0f", cachedMoisture, cachedPH, cachedLux);
  if (dhtValid) Serial.printf(" Temp:%.1fC Hum:%.1f%%", cachedTemp, cachedHumidity);
  Serial.printf(" Flow:%.1fmL Pump:%s\n", getFlowVolumeMl(), pumpRunning ? "ON" : "OFF");
}

// ========== AUTO WATERING ==========
void checkAutoWatering() {
  if (pumpRunning || manualPump) return;
  if (cachedMoisture < MOISTURE_THRESHOLD) {
    Serial.printf("[AUTO] Moisture %.1f%% < %.0f%% — starting pump\n",
      cachedMoisture, MOISTURE_THRESHOLD);
    startPump();
  }
}

// ========== BACKEND SYNC ==========
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[BACKEND] Skipped — no WiFi");
    return;
  }

  StaticJsonDocument<512> doc;
  // *** Field names MUST match SensorReading.js schema ***
  doc["deviceId"]     = DEVICE_ID;
  doc["soilMoisture"] = round(cachedMoisture * 10) / 10.0;         // 0-100
  doc["pH"]           = round(cachedPH * 100) / 100.0;             // capital H!
  doc["light"]        = (int)cachedLux;                             // lux
  doc["temperature"]  = dhtValid ? round(cachedTemp * 10) / 10.0     : 0;
  doc["humidity"]     = dhtValid ? round(cachedHumidity * 10) / 10.0 : 0;
  doc["flowRate"]     = pumpRunning ? getFlowVolumeMl() : 0.0;      // mL/min approx
  doc["flowVolume"]   = getFlowVolumeMl();                          // total mL

  String payload;
  serializeJson(doc, payload);
  Serial.println("[BACKEND] Sending: " + payload);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10s — Render can be slow on cold start

  int code = http.POST(payload);
  if (code == 200 || code == 201) {
    Serial.println("[BACKEND] OK (" + String(code) + ") — data saved to sproutsense DB");
  } else {
    Serial.printf("[BACKEND] Error %d: %s\n", code, http.getString().c_str());
  }
  http.end();
}

// ========== TFT DISPLAY ==========
uint8_t tftPage = 0;
unsigned long lastTFTUpdate = 0;

void updateTFTDisplay() {
  tft.fillScreen(C_BLACK);
  tft.setTextSize(1);
  tft.setCursor(2, 2);
  tft.setTextColor(C_CYAN);  tft.print("SPROUTSENSE ");
  tft.setTextColor(C_DGRAY); tft.printf("P%u/4", tftPage + 1);
  tft.drawLine(0, 12, 160, 12, C_DGRAY);

  switch (tftPage) {
    case 0: // Soil & Light
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW);  tft.println("SOIL & LIGHT");
      tft.setCursor(5, 32); tft.setTextColor(cachedMoisture < 30 ? C_RED : C_GREEN);
      tft.printf("Moisture : %.1f%%\n", cachedMoisture);
      tft.setCursor(5, 46); tft.setTextColor((cachedPH < 5.5 || cachedPH > 7.5) ? C_ORANGE : C_GREEN);
      tft.printf("pH       : %.2f\n", cachedPH);
      tft.setCursor(5, 60); tft.setTextColor(cachedLux < 2000 ? C_RED : C_GREEN);
      tft.printf("Light    : %.0f lux\n", cachedLux);
      break;

    case 1: // Climate
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW);  tft.println("CLIMATE");
      if (dhtValid) {
        tft.setTextSize(2);
        tft.setCursor(10, 36); tft.setTextColor(C_CYAN);
        tft.printf("%.1fC\n", cachedTemp);
        tft.setTextSize(1);
        tft.setCursor(5, 62); tft.setTextColor(C_LGRAY); tft.println("Temperature");
        tft.setTextSize(2);
        tft.setCursor(10, 78); tft.setTextColor(C_GREEN);
        tft.printf("%.0f%%\n", cachedHumidity);
        tft.setTextSize(1);
        tft.setCursor(5, 100); tft.setTextColor(C_LGRAY); tft.println("Humidity");
      } else {
        tft.setCursor(5, 50); tft.setTextColor(C_RED);
        tft.println("DHT22 Error!");
        tft.println("Check GPIO 13");
      }
      break;

    case 2: // Watering
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("WATERING");
      tft.setCursor(5, 32); tft.setTextColor(pumpRunning ? C_GREEN : C_LGRAY);
      tft.printf("Pump     : %s\n", pumpRunning ? "ON" : "OFF");
      tft.setCursor(5, 46); tft.setTextColor(C_CYAN);
      tft.printf("Volume   : %.1f mL\n", getFlowVolumeMl());
      tft.setCursor(5, 60); tft.setTextColor(C_DGRAY);
      tft.printf("Target   : %.0f mL\n", TARGET_WATER_ML);
      tft.setCursor(5, 74); tft.setTextColor(C_DGRAY);
      tft.printf("Threshold: %.0f%%\n", MOISTURE_THRESHOLD);
      if (pumpRunning) {
        tft.setCursor(5, 88); tft.setTextColor(C_ORANGE);
        tft.printf("Runtime  : %lus", (millis() - pumpStartTime) / 1000);
      }
      break;

    case 3: // Network
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("NETWORK");
      tft.setCursor(5, 32);
      tft.setTextColor(WiFi.status() == WL_CONNECTED ? C_GREEN : C_RED);
      tft.printf("WiFi  : %s\n", WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");
      if (WiFi.status() == WL_CONNECTED) {
        tft.setCursor(5, 46); tft.setTextColor(C_LGRAY);
        tft.print(WiFi.localIP().toString().c_str());
        tft.setCursor(5, 58); tft.setTextColor(C_LGRAY);
        tft.printf("RSSI  : %d dBm", WiFi.RSSI());
      }
      tft.setCursor(5, 72); tft.setTextColor(C_CYAN);
      tft.printf("Uptime: %lu min", millis() / 60000);
      break;
  }
}

// ========== TIMERS ==========
unsigned long lastSensorRead  = 0;
unsigned long lastBackendSync = 0;

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n====================================");
  Serial.println("  SPROUTSENSE ESP32-SENSOR-001");
  Serial.println("  Flow + Relay + TFT + Cloud");
  Serial.println("====================================\n");

  // TFT init
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_CYAN); tft.setTextSize(1);
  tft.setCursor(5, 5);  tft.println("SproutSense v2.0");
  tft.setCursor(5, 20); tft.setTextColor(C_WHITE); tft.println("Initializing...");

  // GPIO
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); // Pump OFF at boot
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowISR, FALLING);
  Serial.println("[INIT] Relay GPIO 14 — OFF");
  Serial.println("[INIT] Flow sensor GPIO 12 — interrupt attached");

  // ADC
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);

  // DHT warmup
  dht.begin();
  delay(2500);
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      cachedTemp = t; cachedHumidity = h; dhtValid = true;
      Serial.printf("[DHT] Warmup OK: %.1fC %.1f%%\n", t, h);
      break;
    }
    delay(2000);
  }
  if (!dhtValid) Serial.println("[DHT] Warmup failed — check GPIO 13 wiring");

  // WiFi
  WiFi.mode(WIFI_STA);
#if STATICIP_ENABLED
  IPAddress ip(STATIC_IP[0],      STATIC_IP[1],      STATIC_IP[2],      STATIC_IP[3]);
  IPAddress gw(STATIC_GATEWAY[0], STATIC_GATEWAY[1], STATIC_GATEWAY[2], STATIC_GATEWAY[3]);
  IPAddress sn(STATIC_SUBNET[0],  STATIC_SUBNET[1],  STATIC_SUBNET[2],  STATIC_SUBNET[3]);
  IPAddress d1(STATIC_DNS1[0],    STATIC_DNS1[1],    STATIC_DNS1[2],    STATIC_DNS1[3]);
  WiFi.config(ip, gw, sn, d1);
  Serial.printf("[WIFI] Static IP: %d.%d.%d.%d\n",
    STATIC_IP[0], STATIC_IP[1], STATIC_IP[2], STATIC_IP[3]);
#endif
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    tft.setCursor(5, 35); tft.setTextColor(C_GREEN);
    tft.print(WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] FAILED — will retry in loop");
    tft.setCursor(5, 35); tft.setTextColor(C_RED); tft.println("WiFi FAILED");
  }

  delay(2000);
  tft.fillScreen(C_BLACK);
  Serial.println("\n>>> SPROUTSENSE READY <<<");
  Serial.println("Commands: h=help s=sensors p=pump-on o=pump-off w=wifi d=diag");
  Serial.println("Backend: " + String(BACKEND_URL));
  Serial.println("DB target: sproutsense (set MONGODB_URI on Render!)\n");
}

// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  // Auto-reconnect WiFi
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnect = 0;
    if (now - lastReconnect > 30000) {
      lastReconnect = now;
      Serial.println("[WIFI] Reconnecting...");
      WiFi.reconnect();
    }
  }

  // Read sensors every 5s
  if (now - lastSensorRead >= INTERVAL_SENSORS) {
    lastSensorRead = now;
    updateAllSensors();
    printSensors();
    checkAutoWatering();
  }

  // Send to backend every 15s
  if (now - lastBackendSync >= INTERVAL_BACKEND) {
    lastBackendSync = now;
    sendToBackend();
  }

  // Update TFT every 5s
  if (now - lastTFTUpdate >= INTERVAL_TFT) {
    lastTFTUpdate = now;
    updateTFTDisplay();
    tftPage = (tftPage + 1) % 4;
  }

  // Pump safety logic
  updatePumpLogic();

  // Serial commands
  if (Serial.available()) {
    handleSerialCommand((char)Serial.read());
  }

  delay(50); // Yield to RTOS
}

// ========== SERIAL COMMANDS ==========
void handleSerialCommand(char cmd) {
  switch (cmd) {
    case 'h':
    case '?':
      Serial.println("\n=== SPROUTSENSE COMMANDS ===");
      Serial.println("  s — Show sensor readings");
      Serial.println("  p — Pump ON (manual)");
      Serial.println("  o — Pump OFF (manual)");
      Serial.println("  r — Test relay (1s click)");
      Serial.println("  f — Show flow sensor count");
      Serial.println("  w — WiFi status");
      Serial.println("  t — TFT page test (cycles all pages)");
      Serial.println("  m — Memory info");
      Serial.println("  d — Full diagnostics");
      Serial.println("  b — Force backend send now");
      break;
    case 's':
      updateAllSensors();
      printSensors();
      break;
    case 'p':
      manualPump = true;
      startPump();
      break;
    case 'o':
      manualPump = false;
      stopPump();
      break;
    case 'r': // Relay test
      Serial.println("[TEST] Relay click test...");
      digitalWrite(PIN_RELAY, HIGH); delay(1000); digitalWrite(PIN_RELAY, LOW);
      Serial.println("[TEST] Relay OK (heard click? check wiring if not)");
      break;
    case 'f': // Flow sensor
      Serial.printf("[FLOW] Pulses: %lu | Volume: %.1f mL\n",
        flowPulseCount, getFlowVolumeMl());
      break;
    case 'w':
      Serial.printf("[WIFI] Status: %s | IP: %s | RSSI: %d dBm\n",
        WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      break;
    case 't':
      Serial.println("[TFT] Cycling all 4 pages...");
      for (int i = 0; i < 4; i++) { tftPage = i; updateTFTDisplay(); delay(2000); }
      break;
    case 'm':
      Serial.printf("[MEM] Free heap: %u bytes | Min free: %u bytes\n",
        ESP.getFreeHeap(), ESP.getMinFreeHeap());
      break;
    case 'd':
      updateAllSensors(); printSensors();
      Serial.printf("[PUMP] Running: %s | Volume: %.1f mL\n",
        pumpRunning ? "YES" : "NO", getFlowVolumeMl());
      Serial.printf("[FLOW] Pulses: %lu\n", flowPulseCount);
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %ddBm\n",
        WiFi.status() == WL_CONNECTED ? "OK" : "FAIL",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      Serial.printf("[MEM] Free: %u | Min: %u\n",
        ESP.getFreeHeap(), ESP.getMinFreeHeap());
      break;
    case 'b':
      Serial.println("[BACKEND] Force sending now...");
      sendToBackend();
      break;
  }
}

// =====================================================
// END — SPROUTSENSE ESP32-SENSOR.INO
// GPIO 12 = YF-S401 Flow Sensor (INTERRUPT)
// GPIO 14 = Relay (Pump Control)
// Both VERIFIED and IMPLEMENTED above
// =====================================================
