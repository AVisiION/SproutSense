/*!
 * ╔══════════════════════════════════════════════════════════╗
 * ║      SproutSense — Smart Plant Care System              ║
 * ║      ESP32-SENSOR-001 | Single-File Sketch              ║
 * ║      Version: 1.0.0 | Build: March 2026                 ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * FEATURES:
 *   ✓ 5 sensors: Soil Moisture, pH, Temp/Humidity (DHT22), Light (LDR)
 *   ✓ Water pump control via Relay (FSM with safety rules)
 *   ✓ Flow sensor volume tracking
 *   ✓ Blynk IoT dashboard (real-time monitoring + manual control)
 *   ✓ Weather-aware watering (OpenWeatherMap stub)
 *   ✓ Gemini AI plant advice stub (hourly)
 *   ✓ Non-blocking millis() architecture
 *   ✓ Auto WiFi/Blynk reconnection
 *   ✓ Serial debug commands (press 'h' in Serial Monitor)
 *
 * BOARD SETTINGS (Arduino IDE):
 *   Board           : ESP32 Dev Module
 *   Upload Speed    : 921600
 *   CPU Frequency   : 240 MHz
 *   Flash Size      : 4MB (32Mb)
 *   Partition Scheme: Huge APP (3MB No OTA/1MB SPIFFS)  ← IMPORTANT!
 *   Flash Mode      : QIO
 *
 * REQUIRED LIBRARIES (Install via Library Manager):
 *   - DHT sensor library (Adafruit)
 *   - Blynk (Blynk)
 *   - ArduinoJson (Benoit Blanchon)
 *
 * SETUP:
 *   1. Fill in your credentials in the SECRETS section below
 *   2. Select Partition: Huge APP in Arduino IDE Tools menu
 *   3. Upload and open Serial Monitor at 115200 baud
 */

// ============================================================================
// LIBRARIES
// ============================================================================

#include <WiFi.h>
#include <DHT.h>
#include <vector>

#define BLYNK_TEMPLATE_ID   "YOUR_BLYNK_TEMPLATE_ID"
#define BLYNK_TEMPLATE_NAME "SproutSense"
#define BLYNK_AUTH_TOKEN    "YOUR_BLYNK_AUTH_TOKEN"
#include <BlynkSimpleEsp32.h>

// ============================================================================
// ⚠️  SECRETS — FILL THESE IN BEFORE UPLOADING
// ============================================================================

#define WIFI_SSID               "YOUR_WIFI_SSID"
#define WIFI_PASSWORD           "YOUR_WIFI_PASSWORD"
#define OPENWEATHER_API_KEY     "YOUR_OPENWEATHER_API_KEY"
#define OPENWEATHER_LOCATION    "Sambalpur,IN"
#define GEMINI_API_KEY          "YOUR_GEMINI_API_KEY"

// ============================================================================
// PIN CONFIGURATION (ADC1 ONLY — WiFi-safe)
// ============================================================================

#define PIN_SOIL_MOISTURE_ANALOG  34   // ADC1_CH6 — Capacitive moisture sensor
#define PIN_PH_SENSOR_ANALOG      35   // ADC1_CH7 — ZS-09 pH sensor
#define PIN_LDR_SENSOR_ANALOG     32   // ADC1_CH4 — LDR light sensor
#define PIN_DHT_SENSOR            4    // Digital — DHT22
#define PIN_FLOW_SENSOR           27   // Digital interrupt — YF-S401
#define PIN_RELAY_CH1             26   // Relay IN1 — Water pump
#define PIN_RELAY_CH2             25   // Relay IN2 — Spare

#define DHT_SENSOR_TYPE           DHT22

// ============================================================================
// CONFIGURATION & THRESHOLDS
// ============================================================================

// Timing intervals (milliseconds)
#define SENSOR_SAMPLING_INTERVAL_MS   5000UL      // Read sensors every 5s
#define BLYNK_UPDATE_INTERVAL_MS      10000UL     // Push Blynk data every 10s
#define HISTORY_LOG_INTERVAL_MS       60000UL     // Log history every 60s
#define WEATHER_UPDATE_INTERVAL_MS    1800000UL   // Fetch weather every 30 min
#define DHT_READ_INTERVAL_MS          2000UL      // DHT22 min read interval

// Feature flags
#define ENABLE_HISTORY_LOGGING        true
#define ENABLE_DISEASE_DETECTION      false       // Stub — requires ESP32-CAM
#define ENABLE_GEMINI_ADVICE          true
#define ENABLE_VOICE_CONTROL          false       // Stub

// Moisture thresholds
#define MOISTURE_THRESHOLD_PERCENT    30.0f       // Water when below this %
#define MOISTURE_ADC_DRY              3200        // Raw ADC when fully dry
#define MOISTURE_ADC_WET              1200        // Raw ADC when fully wet
#define MOISTURE_SAMPLE_COUNT         5           // Samples to average

// pH calibration (2-point)
#define PH_CALIBRATION_VOLTAGE_PH4    2.03f
#define PH_CALIBRATION_VALUE_PH4      4.0f
#define PH_CALIBRATION_VOLTAGE_PH7    2.52f
#define PH_CALIBRATION_VALUE_PH7      7.0f
#define PH_SAMPLE_COUNT               5

// LDR
#define LDR_SAMPLE_COUNT              5

// Watering safety rules
#define TARGET_WATER_VOLUME_ML        100.0f      // Target mL per cycle
#define PUMP_MAX_RUNTIME_MS           20000UL     // 20s safety timeout
#define WATERING_COOLDOWN_MS          600000UL    // 10 min cooldown between cycles
#define MAX_WATERING_CYCLES_PER_HOUR  3

// Flow sensor (YF-S401 ~5.5 pulses/mL)
#define FLOW_SENSOR_PULSES_PER_ML     5.5f

// Blynk Virtual Pins
#define VPIN_SOIL_MOISTURE    V0
#define VPIN_PH               V1
#define VPIN_TEMPERATURE      V2
#define VPIN_HUMIDITY         V3
#define VPIN_LIGHT_LEVEL      V4
#define VPIN_FLOW_VOLUME      V5
#define VPIN_PUMP_CONTROL     V6
#define VPIN_CAMERA_SNAPSHOT  V7
#define VPIN_WATERING_COUNT   V8
#define VPIN_LAST_WATERING    V9

// Serial
#define SERIAL_BAUD_RATE      115200

// ============================================================================
// WATERING FSM STATES
// ============================================================================

enum WateringState {
  WATERING_IDLE,
  WATERING_CHECK_CONDITIONS,
  WATERING_WATERING,
  WATERING_COOLDOWN
};

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// — DHT —
DHT dht(PIN_DHT_SENSOR, DHT_SENSOR_TYPE);
unsigned long lastDHTReadTime = 0;

// — Sensor buffers —
std::vector<int16_t> moistureReadings;
std::vector<float>   phReadings;
std::vector<int16_t> ldrReadings;

struct {
  float voltage1 = PH_CALIBRATION_VOLTAGE_PH4;
  float pH1      = PH_CALIBRATION_VALUE_PH4;
  float voltage2 = PH_CALIBRATION_VOLTAGE_PH7;
  float pH2      = PH_CALIBRATION_VALUE_PH7;
} phCalibration;

// — Flow sensor —
volatile unsigned long flowPulseCount = 0;
unsigned long flowPulseCountSnapshot  = 0;
unsigned long flowMeasurementStartTime = 0;

// — Watering FSM —
WateringState currentState   = WATERING_IDLE;
WateringState previousState  = WATERING_IDLE;
unsigned long lastWateringTime    = 0;
unsigned long pumpStartTime       = 0;
unsigned long cooldownStartTime   = 0;
unsigned long stateChangeTime     = 0;
bool rainExpectedFlag       = false;
bool manualPumpOverride     = false;

struct {
  uint8_t cycleCount       = 0;
  unsigned long hourStartTime = 0;
} wateringHourTracker;

struct {
  float totalVolumeToday     = 0.0f;
  float totalVolumeThisWeek  = 0.0f;
  unsigned long dayStartTime = 0;
  unsigned long weekStartTime = 0;
} wateringStats;

// — Network —
unsigned long systemStartTime    = 0;
unsigned long lastWiFiAttemptTime = 0;
bool wifiConnected  = false;
bool blynkConnected = false;
const unsigned long WIFI_RECONNECT_INTERVAL = 30000UL;

// — AI Hooks —
unsigned long lastDiseaseDetectionTime = 0;
unsigned long lastGeminiRequestTime    = 0;
char lastGeminiAdvice[512] = "Waiting for first advice...";
int  pendingVoiceCommand   = 0;

// — Loop timers —
unsigned long lastSensorReadMs      = 0;
unsigned long lastBlynkSyncMs       = 0;
unsigned long lastHistoryLogMs      = 0;
unsigned long lastWeatherUpdateMs   = 0;
unsigned long lastDiagnosticPrintMs = 0;
unsigned long lastGeminiAdviceMs    = 0;

// ============================================================================
// FLOW SENSOR ISR
// ============================================================================

void IRAM_ATTR flowSensorISR() {
  flowPulseCount++;
}

// ============================================================================
// SENSOR FUNCTIONS
// ============================================================================

void initializeSensors() {
  dht.begin();
  delay(100);
  analogSetWidth(12);
  pinMode(PIN_RELAY_CH1, OUTPUT);
  pinMode(PIN_RELAY_CH2, OUTPUT);
  digitalWrite(PIN_RELAY_CH1, LOW);
  digitalWrite(PIN_RELAY_CH2, LOW);
  moistureReadings.clear();
  phReadings.clear();
  ldrReadings.clear();
  Serial.println("[SENSORS] Initialized");
}

void initializeFlowSensor() {
  pinMode(PIN_FLOW_SENSOR, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowSensorISR, RISING);
  flowPulseCount = 0;
  flowPulseCountSnapshot = 0;
  flowMeasurementStartTime = millis();
  Serial.println("[FLOW] Interrupt attached");
}

float readSoilMoisturePercent() {
  int16_t raw = analogRead(PIN_SOIL_MOISTURE_ANALOG);
  if (raw < 0 || raw > 4095) return -1.0f;
  moistureReadings.push_back(raw);
  if (moistureReadings.size() > MOISTURE_SAMPLE_COUNT)
    moistureReadings.erase(moistureReadings.begin());
  float sum = 0;
  for (int16_t r : moistureReadings) sum += r;
  float avg = sum / moistureReadings.size();
  float pct = 100.0f * (MOISTURE_ADC_DRY - avg) / (MOISTURE_ADC_DRY - MOISTURE_ADC_WET);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float readPH() {
  long sum = 0;
  for (int i = 0; i < 5; i++) { sum += analogRead(PIN_PH_SENSOR_ANALOG); delayMicroseconds(100); }
  float voltage = (sum / 5.0f / 4095.0f) * 3.3f;
  phReadings.push_back(voltage);
  if (phReadings.size() > PH_SAMPLE_COUNT) phReadings.erase(phReadings.begin());
  float avgV = 0;
  for (float v : phReadings) avgV += v;
  avgV /= phReadings.size();
  return phCalibration.pH1 +
    (avgV - phCalibration.voltage1) *
    (phCalibration.pH2 - phCalibration.pH1) /
    (phCalibration.voltage2 - phCalibration.voltage1);
}

bool readDHT(float& tempC, float& humidity) {
  unsigned long now = millis();
  if ((now - lastDHTReadTime) < DHT_READ_INTERVAL_MS) return false;
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) return false;
  tempC = t; humidity = h;
  lastDHTReadTime = now;
  return true;
}

float readLightLevelPercent() {
  int16_t raw = analogRead(PIN_LDR_SENSOR_ANALOG);
  if (raw < 0 || raw > 4095) return -1.0f;
  ldrReadings.push_back(raw);
  if (ldrReadings.size() > LDR_SAMPLE_COUNT) ldrReadings.erase(ldrReadings.begin());
  float sum = 0;
  for (int16_t r : ldrReadings) sum += r;
  return (sum / ldrReadings.size() / 4095.0f) * 100.0f;
}

float readFlowRateMlPerMin() {
  unsigned long now = millis();
  unsigned long elapsed = now - flowMeasurementStartTime;
  if (elapsed < 1000) return 0.0f;
  unsigned long pulses = flowPulseCount - flowPulseCountSnapshot;
  float rate = (pulses / FLOW_SENSOR_PULSES_PER_ML) / (elapsed / 1000.0f) * 60.0f;
  flowPulseCountSnapshot = flowPulseCount;
  flowMeasurementStartTime = now;
  return rate;
}

float getCurrentCycleVolumeML() {
  return (float)flowPulseCount / FLOW_SENSOR_PULSES_PER_ML;
}

void resetFlowSensorCounter() {
  flowPulseCount = 0;
  flowPulseCountSnapshot = 0;
  flowMeasurementStartTime = millis();
}

bool performSensorSelfTest() {
  Serial.println("[SELF-TEST] Running...");
  bool ok = true;
  float m = readSoilMoisturePercent();
  Serial.printf("  Moisture: %.1f%% %s\n", m, (m>=0&&m<=100)?"PASS":"FAIL");
  if (m<0||m>100) ok=false;
  float pH = readPH();
  Serial.printf("  pH: %.2f %s\n", pH, (pH>=0&&pH<=14)?"PASS":"FAIL");
  if (pH<0||pH>14) ok=false;
  float t, h;
  if (readDHT(t, h)) { Serial.printf("  DHT: %.1f°C %.0f%% PASS\n", t, h); }
  else { Serial.println("  DHT: FAIL (first read ok — may need 2s)"); }
  float l = readLightLevelPercent();
  Serial.printf("  Light: %.1f%% %s\n", l, (l>=0&&l<=100)?"PASS":"FAIL");
  if (l<0||l>100) ok=false;
  Serial.printf("[SELF-TEST] Result: %s\n", ok?"PASS":"FAIL — check wiring!");
  return ok;
}

void printAllSensorReadings() {
  Serial.println("\n===== SENSOR READINGS =====");
  Serial.printf("Soil Moisture : %.1f %%\n", readSoilMoisturePercent());
  Serial.printf("pH            : %.2f\n",  readPH());
  float t=0, h=0;
  if (readDHT(t,h)) { Serial.printf("Temperature   : %.1f °C\n", t); Serial.printf("Humidity      : %.0f %%\n", h); }
  else { Serial.println("DHT           : No valid reading (yet)"); }
  Serial.printf("Light Level   : %.1f %%\n", readLightLevelPercent());
  Serial.printf("Flow Rate     : %.1f mL/min\n", readFlowRateMlPerMin());
  Serial.printf("Cycle Volume  : %.1f mL\n",  getCurrentCycleVolumeML());
  Serial.println("===========================");
}

// ============================================================================
// WATERING FSM
// ============================================================================

void relayPumpOn()  { digitalWrite(PIN_RELAY_CH1, HIGH); }
void relayPumpOff() { digitalWrite(PIN_RELAY_CH1, LOW);  }
bool isPumpRunning() { return digitalRead(PIN_RELAY_CH1) == HIGH; }

void initializeWatering() {
  relayPumpOff();
  currentState = WATERING_IDLE;
  stateChangeTime = millis();
  wateringHourTracker.cycleCount = 0;
  wateringHourTracker.hourStartTime = millis();
  wateringStats.dayStartTime  = millis();
  wateringStats.weekStartTime = millis();
  Serial.println("[WATERING] Initialized");
}

uint8_t getWateringCyclesThisHour() {
  if ((millis() - wateringHourTracker.hourStartTime) >= 3600000UL) {
    wateringHourTracker.cycleCount = 0;
    wateringHourTracker.hourStartTime = millis();
  }
  return wateringHourTracker.cycleCount;
}

float getTotalVolumeDispensedToday()    { return wateringStats.totalVolumeToday; }
unsigned long getLastWateringTime()     { return lastWateringTime; }

const char* getWateringStateString() {
  switch(currentState) {
    case WATERING_IDLE:             return "IDLE";
    case WATERING_CHECK_CONDITIONS: return "CHECK_CONDITIONS";
    case WATERING_WATERING:         return "WATERING";
    case WATERING_COOLDOWN:         return "COOLDOWN";
    default:                        return "UNKNOWN";
  }
}

void manualPumpOn() {
  manualPumpOverride = true;
  if (currentState == WATERING_IDLE) {
    currentState = WATERING_WATERING;
    stateChangeTime = pumpStartTime = millis();
    resetFlowSensorCounter();
    relayPumpOn();
    Serial.println("[MANUAL] Pump ON");
  }
}

void manualPumpOff() {
  manualPumpOverride = false;
  if (currentState == WATERING_WATERING) {
    relayPumpOff();
    float vol = getCurrentCycleVolumeML();
    wateringStats.totalVolumeToday += vol;
    lastWateringTime = millis();
    currentState = WATERING_COOLDOWN;
    cooldownStartTime = millis();
    Serial.printf("[MANUAL] Pump OFF — dispensed %.1f mL\n", vol);
  }
}

void updateWateringLogic() {
  unsigned long now = millis();

  // Reset daily stats
  if ((now - wateringStats.dayStartTime) >= 86400000UL) {
    wateringStats.totalVolumeToday = 0.0f;
    wateringStats.dayStartTime = now;
  }

  switch (currentState) {

    case WATERING_IDLE: {
      if (manualPumpOverride) {
        currentState = WATERING_WATERING;
        stateChangeTime = pumpStartTime = now;
        resetFlowSensorCounter();
        relayPumpOn();
        break;
      }
      float m = readSoilMoisturePercent();
      if (m >= 0 && m < MOISTURE_THRESHOLD_PERCENT) {
        currentState = WATERING_CHECK_CONDITIONS;
        stateChangeTime = now;
        Serial.println("[FSM] IDLE -> CHECK_CONDITIONS");
      }
      break;
    }

    case WATERING_CHECK_CONDITIONS: {
      if (cooldownStartTime != 0 && (now - cooldownStartTime) < WATERING_COOLDOWN_MS) {
        currentState = WATERING_IDLE; break;
      }
      if ((now - wateringHourTracker.hourStartTime) >= 3600000UL) {
        wateringHourTracker.cycleCount = 0;
        wateringHourTracker.hourStartTime = now;
      }
      if (wateringHourTracker.cycleCount >= MAX_WATERING_CYCLES_PER_HOUR) {
        currentState = WATERING_IDLE;
        Serial.println("[FSM] Max cycles/hr reached");
        break;
      }
      if (rainExpectedFlag) {
        currentState = WATERING_IDLE;
        Serial.println("[FSM] Rain expected — skip");
        break;
      }
      currentState = WATERING_WATERING;
      stateChangeTime = pumpStartTime = now;
      resetFlowSensorCounter();
      relayPumpOn();
      wateringHourTracker.cycleCount++;
      Serial.printf("[FSM] Starting cycle #%u\n", wateringHourTracker.cycleCount);
      break;
    }

    case WATERING_WATERING: {
      float vol   = getCurrentCycleVolumeML();
      bool target = (vol >= TARGET_WATER_VOLUME_ML);
      bool tmoout = ((now - pumpStartTime) >= PUMP_MAX_RUNTIME_MS);
      if (target || tmoout) {
        relayPumpOff();
        manualPumpOverride = false;
        wateringStats.totalVolumeToday += vol;
        lastWateringTime = now;
        currentState = WATERING_COOLDOWN;
        cooldownStartTime = now;
        Serial.printf("[FSM] Done: %.1f mL %s\n", vol, tmoout?"(TIMEOUT)":"(target)");
      }
      break;
    }

    case WATERING_COOLDOWN: {
      if ((now - cooldownStartTime) >= WATERING_COOLDOWN_MS) {
        currentState = WATERING_IDLE;
        Serial.println("[FSM] Cooldown done -> IDLE");
      }
      break;
    }
  }

  if (currentState != previousState) {
    previousState = currentState;
    Serial.printf("[WATERING] State: %s\n", getWateringStateString());
  }
}

void testRelayModule() {
  Serial.println("[RELAY] Testing ON...");
  relayPumpOn(); delay(2000);
  relayPumpOff();
  Serial.println("[RELAY] Test done");
}

void printWateringStatus() {
  Serial.println("\n===== WATERING STATUS =====");
  Serial.printf("State          : %s\n",  getWateringStateString());
  Serial.printf("Pump Running   : %s\n",  isPumpRunning()?"YES":"NO");
  Serial.printf("Cycle Volume   : %.1f mL\n", getCurrentCycleVolumeML());
  Serial.printf("Cycles/hr      : %u / %u\n", getWateringCyclesThisHour(), MAX_WATERING_CYCLES_PER_HOUR);
  Serial.printf("Volume Today   : %.1f mL\n", getTotalVolumeDispensedToday());
  Serial.printf("Rain Expected  : %s\n",  rainExpectedFlag?"YES":"NO");
  if (lastWateringTime==0) Serial.println("Last Watering  : Never");
  else Serial.printf("Last Watering  : %lu s ago\n", (millis()-lastWateringTime)/1000);
  Serial.println("===========================");
}

// ============================================================================
// BLYNK HANDLERS
// ============================================================================

BLYNK_CONNECTED() {
  Serial.println("[BLYNK] Connected!");
  blynkConnected = true;
  Blynk.syncVirtual(VPIN_PUMP_CONTROL);
}

BLYNK_WRITE(VPIN_PUMP_CONTROL) {
  int v = param.asInt();
  if (v == 1) manualPumpOn();
  else        manualPumpOff();
  Serial.printf("[BLYNK] Pump %s\n", v?"ON":"OFF");
}

BLYNK_WRITE(VPIN_CAMERA_SNAPSHOT) {
  if (param.asInt() == 1) {
    Serial.println("[BLYNK] Camera snapshot req (stub — needs ESP32-CAM)");
    Blynk.virtualWrite(VPIN_CAMERA_SNAPSHOT, 0);
  }
}

// ============================================================================
// NETWORK FUNCTIONS
// ============================================================================

void initializeNetwork() {
  systemStartTime = millis();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Blynk.config(BLYNK_AUTH_TOKEN);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); Serial.print("."); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Timeout — will retry in loop");
  }
}

void updateNetworkStatus() {
  unsigned long now = millis();
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConnected) {
      wifiConnected = true;
      Serial.printf("[WIFI] Reconnected! IP: %s\n", WiFi.localIP().toString().c_str());
    }
  } else {
    if (wifiConnected) { wifiConnected = false; Serial.println("[WIFI] Disconnected!"); }
    if ((now - lastWiFiAttemptTime) > WIFI_RECONNECT_INTERVAL) {
      WiFi.disconnect(); delay(100);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      lastWiFiAttemptTime = now;
      Serial.println("[WIFI] Reconnecting...");
    }
  }
  if (Blynk.connected()) {
    if (!blynkConnected) { blynkConnected = true; Serial.println("[BLYNK] Synced!"); }
    Blynk.run();
  } else {
    if (blynkConnected) { blynkConnected = false; Serial.println("[BLYNK] Disconnected!"); }
    if (wifiConnected) Blynk.connect();
  }
}

bool isWiFiConnected()  { return WiFi.status() == WL_CONNECTED; }
bool isBlynkSynced()    { return Blynk.connected(); }
unsigned long getUptimeSeconds() { return (millis() - systemStartTime) / 1000; }

void publishSensorDataToBlynk() {
  if (!Blynk.connected()) return;
  float m = readSoilMoisturePercent();
  float pH = readPH();
  float l = readLightLevelPercent();
  float t=0, h=0;
  bool dhtOk = readDHT(t, h);
  if (m >= 0)   Blynk.virtualWrite(VPIN_SOIL_MOISTURE, (int)m);
  Blynk.virtualWrite(VPIN_PH, pH);
  if (dhtOk)    { Blynk.virtualWrite(VPIN_TEMPERATURE, t); Blynk.virtualWrite(VPIN_HUMIDITY, (int)h); }
  if (l >= 0)   Blynk.virtualWrite(VPIN_LIGHT_LEVEL, (int)l);
  Blynk.virtualWrite(VPIN_FLOW_VOLUME, (int)getCurrentCycleVolumeML());
  Blynk.virtualWrite(VPIN_WATERING_COUNT, (int)getWateringCyclesThisHour());
  Serial.println("[BLYNK] Sensor data pushed");
}

void sendBlynkNotification(const char* title, const char* msg) {
  if (!Blynk.connected()) return;
  String n = String(title) + ": " + String(msg);
  Blynk.notify(n.c_str());
  Serial.printf("[NOTIF] %s\n", n.c_str());
}

void printNetworkStatus() {
  Serial.println("\n===== NETWORK STATUS =====");
  if (isWiFiConnected())
    Serial.printf("WiFi  : CONNECTED (%s) | IP: %s | RSSI: %d dBm\n",
      WiFi.SSID().c_str(), WiFi.localIP().toString().c_str(), WiFi.RSSI());
  else Serial.println("WiFi  : DISCONNECTED");
  Serial.printf("Blynk : %s\n", isBlynkSynced()?"SYNCED":"DISCONNECTED");
  unsigned long u = getUptimeSeconds();
  Serial.printf("Uptime: %lu h %lu m\n", u/3600, (u%3600)/60);
  Serial.println("===========================");
}

// ============================================================================
// AI HOOKS (STUBS)
// ============================================================================

void initializeAIHooks() {
  lastDiseaseDetectionTime = 0;
  lastGeminiRequestTime    = 0;
  strcpy(lastGeminiAdvice, "Waiting for first advice...");
  pendingVoiceCommand = 0;
  Serial.println("[AI] Hooks initialized (stubs)");
}

bool requestGeminiAdvice() {
  // TODO: Implement HTTPS POST to Gemini API
  // Build prompt with current sensor data and send to:
  //   https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=GEMINI_API_KEY
  Serial.println("[GEMINI] Advice stub — fill in API call");
  strcpy(lastGeminiAdvice, "[STUB] Keep moisture 40-50%, ensure 6-8h light daily.");
  lastGeminiRequestTime = millis();
  return true;
}

bool getLastGeminiAdvice(char* buf, size_t maxLen) {
  if (!lastGeminiRequestTime) return false;
  strncpy(buf, lastGeminiAdvice, maxLen - 1);
  buf[maxLen - 1] = '\0';
  return true;
}

bool shouldRunDiseaseDetection() {
  if (!lastDiseaseDetectionTime) return true;
  return ((millis() - lastDiseaseDetectionTime) >= 86400000UL);
}

bool isPendingVoiceCommand()    { return pendingVoiceCommand != 0; }
int  getPendingVoiceCommandType() { return pendingVoiceCommand; }
void clearPendingVoiceCommand() { pendingVoiceCommand = 0; }

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println(  "║  SproutSense ESP32-SENSOR-001 v1.0  ║");
  Serial.println(  "╚══════════════════════════════════════╝\n");

  initializeSensors();
  initializeFlowSensor();
  initializeWatering();
  initializeAIHooks();
  initializeNetwork();

  lastSensorReadMs = lastBlynkSyncMs = lastHistoryLogMs =
  lastWeatherUpdateMs = lastDiagnosticPrintMs = lastGeminiAdviceMs = millis();

  performSensorSelfTest();

  Serial.println("\n[SETUP] Ready! Press 'h' in Serial Monitor for debug commands.\n");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  unsigned long now = millis();

  // Network (critical — every loop tick)
  updateNetworkStatus();

  // Sensor read every 5s
  if ((now - lastSensorReadMs) >= SENSOR_SAMPLING_INTERVAL_MS) {
    lastSensorReadMs = now;
    float m = readSoilMoisturePercent();
    float pH = readPH();
    float l = readLightLevelPercent();
    float t=0, h=0;
    bool dhtOk = readDHT(t, h);
    float fr = readFlowRateMlPerMin();
    Serial.printf("[SENSORS] M:%.0f%% pH:%.1f T:%d°C H:%d%% L:%.0f%% Flow:%.1fmL/min\n",
      m, pH, dhtOk?(int)t:0, dhtOk?(int)h:0, l, fr);
  }

  // Watering FSM — non-blocking
  updateWateringLogic();

  // Blynk push every 10s
  if ((now - lastBlynkSyncMs) >= BLYNK_UPDATE_INTERVAL_MS) {
    lastBlynkSyncMs = now;
    if (isBlynkSynced()) publishSensorDataToBlynk();
  }

  // History log every 60s
  if ((now - lastHistoryLogMs) >= HISTORY_LOG_INTERVAL_MS && ENABLE_HISTORY_LOGGING) {
    lastHistoryLogMs = now;
    float m=readSoilMoisturePercent(), pH=readPH(), l=readLightLevelPercent(), t=0, h=0;
    readDHT(t, h);
    Serial.printf("[HISTORY] M:%.1f pH:%.2f T:%.1f H:%.0f L:%.1f\n", m, pH, t, h, l);
  }

  // Weather stub every 30 min
  if ((now - lastWeatherUpdateMs) >= WEATHER_UPDATE_INTERVAL_MS) {
    lastWeatherUpdateMs = now;
    if (isWiFiConnected()) Serial.println("[WEATHER] Stub — implement OpenWeatherMap fetch");
  }

  // Gemini advice every 1 hour
  if (ENABLE_GEMINI_ADVICE && (now - lastGeminiAdviceMs) >= 3600000UL) {
    lastGeminiAdviceMs = now;
    if (isBlynkSynced()) {
      requestGeminiAdvice();
      char adv[256];
      if (getLastGeminiAdvice(adv, sizeof(adv)))
        sendBlynkNotification("Plant Care", adv);
    }
  }

  // Diagnostics every 2 min
  if ((now - lastDiagnosticPrintMs) >= 120000UL) {
    lastDiagnosticPrintMs = now;
    printNetworkStatus();
    printAllSensorReadings();
    printWateringStatus();
  }

  // Serial debug commands
  if (Serial.available()) {
    char cmd = Serial.read();
    switch (cmd) {
      case 'h': case '?':
        Serial.println("\n[DEBUG] Commands: s=sensors, w=watering, c=network, p=pump ON, q=pump OFF, r=relay test, t=self-test, m=memory, d=full diag");
        break;
      case 's': printAllSensorReadings(); break;
      case 'w': printWateringStatus();    break;
      case 'c': printNetworkStatus();     break;
      case 'p': manualPumpOn();           break;
      case 'q': manualPumpOff();          break;
      case 'r': testRelayModule();        break;
      case 't': performSensorSelfTest();  break;
      case 'd':
        printNetworkStatus();
        printAllSensorReadings();
        printWateringStatus();
        Serial.printf("Uptime: %lu h\n", getUptimeSeconds()/3600);
        break;
      case 'm':
        Serial.printf("Free RAM: %u bytes | Min: %u bytes\n",
          ESP.getFreeHeap(), ESP.getMinFreeHeap());
        break;
    }
  }

  yield();
}

// ============================================================================
// FATAL ERROR HANDLER
// ============================================================================

void IRAM_ATTR onFatalError() {
  relayPumpOff();   // Safety: cut pump power
  delay(1000);
  ESP.restart();
}
