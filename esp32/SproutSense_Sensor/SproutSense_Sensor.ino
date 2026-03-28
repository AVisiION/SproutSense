// =====================================================================
// SPROUTSENSE  ESP32-SENSOR  v3.0
// Board  : ESP32 Dev Module
// Sensors: Soil Moisture (ADC), pH (ADC), LDR (ADC), DHT22 (Digital)
// Actuator: Relay GPIO-14  |  Flow sensor GPIO-12
// Backend : https://sproutsense-backend.onrender.com
// Blynk   : Cloud IoT mirror
//
// Serial baud : 115200
// Commands    : h/? s p o r f w b c
// =====================================================================

// ── Blynk  (MUST be before all includes) ─────────────────────────────
#define BLYNK_TEMPLATE_ID   "TMPL_YOUR_ID"
#define BLYNK_TEMPLATE_NAME "SproutSense"
#define BLYNK_AUTH_TOKEN    "YOUR_BLYNK_AUTH_TOKEN"
#define BLYNK_PRINT         Serial

// ── Libraries ─────────────────────────────────────────────────────────
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── WiFi credentials ──────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Backend endpoints (match backend/src/routes exactly) ──────────────
// POST /api/sensors           — sensor data
// POST /api/config/status     — heartbeat / device status
// POST /api/water/start       — pump start command ACK
// POST /api/water/stop        — pump stop  command ACK
// GET  /api/water/status/ESP32-SENSOR — poll for remote pump commands
const char* BASE_URL          = "https://sproutsense-backend.onrender.com";
const char* URL_SENSORS       = "https://sproutsense-backend.onrender.com/api/sensors";
const char* URL_STATUS        = "https://sproutsense-backend.onrender.com/api/config/status";
const char* URL_WATER_START   = "https://sproutsense-backend.onrender.com/api/water/start";
const char* URL_WATER_STOP    = "https://sproutsense-backend.onrender.com/api/water/stop";
const char* URL_WATER_STATUS  = "https://sproutsense-backend.onrender.com/api/water/status/ESP32-SENSOR";
const char* DEVICE_ID         = "ESP32-SENSOR";

// ── Pin configuration (ADC1 only — WiFi safe) ─────────────────────────
#define PIN_SOIL   35   // ADC1_CH7  capacitive moisture
#define PIN_PH     34   // ADC1_CH6  analog pH probe
#define PIN_LDR    39   // ADC1_CH3  LDR
#define PIN_DHT    13   // Digital   DHT22
#define PIN_RELAY  14   // Output    relay → pump
#define PIN_FLOW   12   // Interrupt YF-S401 flow meter

// ── Sensor / actuator settings ────────────────────────────────────────
#define DHT_TYPE             DHT22
#define MOISTURE_ADC_DRY     2800
#define MOISTURE_ADC_WET     1200
#define LUX_MAX              100000.0f
#define FLOW_PULSES_PER_ML   5.5f
#define MOISTURE_THRESHOLD   30.0f   // auto-water below this %
#define TARGET_WATER_ML      100.0f  // target volume per cycle
#define PUMP_MAX_MS          20000   // hard safety timeout ms

// ── Timing intervals (ms) ─────────────────────────────────────────────
#define IV_SENSORS    5000   // sensor read + Blynk push
#define IV_BACKEND    15000  // POST sensor data to backend
#define IV_HEARTBEAT  30000  // POST device status (heartbeat)
#define IV_CMD_POLL   8000   // GET watering status (remote pump command)

// ── Objects ───────────────────────────────────────────────────────────
DHT dht(PIN_DHT, DHT_TYPE);

// ── Flow sensor (interrupt-driven) ────────────────────────────────────
volatile unsigned long flowPulses = 0;
void IRAM_ATTR flowISR()            { flowPulses++; }
float  flowMl()                     { return (float)flowPulses / FLOW_PULSES_PER_ML; }
void   resetFlow()                  { flowPulses = 0; }

// ── Pump state ────────────────────────────────────────────────────────
bool          pumpRunning  = false;
bool          manualPump   = false;
unsigned long pumpStartMs  = 0;

// ── Cached sensor values ──────────────────────────────────────────────
float cachedMoisture = 0.0f;
float cachedPH       = 7.0f;
float cachedLux      = 0.0f;
float cachedTemp     = 25.0f;
float cachedHumidity = 50.0f;
bool  dhtValid       = false;

// ── Timers ────────────────────────────────────────────────────────────
unsigned long tSensors   = 0;
unsigned long tBackend   = 0;
unsigned long tHeartbeat = 0;
unsigned long tCmdPoll   = 0;

// ── Backend health tracking ───────────────────────────────────────────
uint32_t backendOkCount   = 0;
uint32_t backendFailCount = 0;

// ── Forward declarations ──────────────────────────────────────────────
void handleSerial(char c);
void startPump(const char* trigger);
void stopPump();
void pollRemoteCommand();

// ─────────────────────────────────────────────────────────────────────
// SERIAL LOGGER — structured, tag-based output
// ─────────────────────────────────────────────────────────────────────
void logSep(const char* tag) {
  Serial.printf("\n╔══════════════════════════════════[ %s ]\n", tag);
}
void logLine(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] %s\n", tag, buf);
}
void logOK(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ✔  %s\n", tag, buf);
}
void logERR(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ✖  %s\n", tag, buf);
}
void logWARN(const char* tag, const char* fmt, ...) {
  char buf[256];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  Serial.printf("║ [%-10s] ⚠  %s\n", tag, buf);
}
void logEnd() {
  Serial.println("╚══════════════════════════════════════════════");
}

// ─────────────────────────────────────────────────────────────────────
// HTTP HELPER — POST JSON, returns HTTP status code
// ─────────────────────────────────────────────────────────────────────
int httpPost(const char* url, const String& payload, int timeoutMs = 8000) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(timeoutMs);
  int code = http.POST(payload);
  if (code > 0) {
    String resp = http.getString();
    // Only log response body on errors for brevity
    if (code >= 400)
      logERR("HTTP", "Response: %s", resp.c_str());
  }
  http.end();
  return code;
}

// HTTP GET — returns body string, empty on failure
String httpGet(const char* url, int timeoutMs = 6000) {
  HTTPClient http;
  http.begin(url);
  http.setTimeout(timeoutMs);
  int code = http.GET();
  String body = "";
  if (code == 200) body = http.getString();
  else logWARN("HTTP", "GET %s → %d", url, code);
  http.end();
  return body;
}

// ─────────────────────────────────────────────────────────────────────
// PUMP CONTROL
// ─────────────────────────────────────────────────────────────────────
void startPump(const char* trigger = "manual") {
  if (pumpRunning) return;
  resetFlow();
  digitalWrite(PIN_RELAY, HIGH);
  pumpRunning  = true;
  pumpStartMs  = millis();
  Blynk.virtualWrite(V5, 1);

  logSep("PUMP");
  logOK("PUMP", "ON  trigger=%-10s  target=%.0f mL", trigger, TARGET_WATER_ML);
  logEnd();

  // Notify backend — POST /api/water/start
  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<128> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["triggerType"] = trigger;   // "auto" | "manual" | "scheduled" | "ai"
    String p; serializeJson(doc, p);
    int code = httpPost(URL_WATER_START, p);
    if (code == 200 || code == 201)
      logOK("PUMP", "Backend ACK start → %d", code);
    else
      logWARN("PUMP", "Backend start ACK failed → %d (non-critical)", code);
  }
}

void stopPump() {
  if (!pumpRunning) return;
  digitalWrite(PIN_RELAY, LOW);
  pumpRunning = false;
  manualPump  = false;
  Blynk.virtualWrite(V5, 0);

  float vol     = flowMl();
  unsigned long ms = millis() - pumpStartMs;

  logSep("PUMP");
  logOK("PUMP", "OFF  dispensed=%.1f mL  runtime=%lu ms", vol, ms);
  logEnd();

  // Notify backend — POST /api/water/stop
  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<128> doc;
    doc["deviceId"] = DEVICE_ID;
    String p; serializeJson(doc, p);
    int code = httpPost(URL_WATER_STOP, p);
    if (code == 200 || code == 201)
      logOK("PUMP", "Backend ACK stop  → %d", code);
    else
      logWARN("PUMP", "Backend stop  ACK failed → %d (non-critical)", code);
  }
}

void updatePumpSafety() {
  if (!pumpRunning) return;
  float vol             = flowMl();
  unsigned long runtime = millis() - pumpStartMs;

  if (vol >= TARGET_WATER_ML) {
    logOK("PUMP", "Target %.0f mL reached (got %.1f mL) — stopping",
      TARGET_WATER_ML, vol);
    stopPump();
  } else if (runtime >= PUMP_MAX_MS) {
    logWARN("PUMP", "Safety timeout %u ms reached — force stop (%.1f mL)",
      PUMP_MAX_MS, vol);
    stopPump();
  }
}

// ─────────────────────────────────────────────────────────────────────
// BLYNK — virtual pin V5 = manual pump toggle from app
// ─────────────────────────────────────────────────────────────────────
BLYNK_WRITE(V5) {
  int v = param.asInt();
  if (v == 1) { manualPump = true;  startPump("manual"); }
  else         { manualPump = false; stopPump(); }
}

// ─────────────────────────────────────────────────────────────────────
// SENSOR READS
// ─────────────────────────────────────────────────────────────────────
float readMoisture() {
  int raw = analogRead(PIN_SOIL);
  return constrain(
    (float)(MOISTURE_ADC_DRY - raw) / (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0f,
    0.0f, 100.0f);
}

float readPH() {
  long sum = 0;
  for (int i = 0; i < 5; i++) { sum += analogRead(PIN_PH); delayMicroseconds(200); }
  float v = (sum / 5.0f / 4095.0f) * 3.3f;
  return constrain(7.0f - ((v - 2.5f) / 0.18f), 0.0f, 14.0f);
}

float readLux() {
  return (analogRead(PIN_LDR) / 4095.0f) * LUX_MAX;
}

void updateSensors() {
  cachedMoisture = readMoisture();
  cachedPH       = readPH();
  cachedLux      = readLux();
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    cachedTemp = t; cachedHumidity = h; dhtValid = true;
  }
}

void printSensors() {
  logSep("SENSORS");
  logLine("SENSORS", "Moisture  : %6.1f %%   (threshold: %.0f%%  %s)",
    cachedMoisture, MOISTURE_THRESHOLD,
    cachedMoisture < MOISTURE_THRESHOLD ? "<-- DRY" : "OK");
  logLine("SENSORS", "pH        : %6.2f     (%s)",
    cachedPH, (cachedPH >= 5.5f && cachedPH <= 7.5f) ? "optimal" : "OUT OF RANGE");
  logLine("SENSORS", "Light     : %6.0f lux (%s)",
    cachedLux, cachedLux < 2000 ? "LOW" : "OK");
  if (dhtValid) {
    logLine("SENSORS", "Temp      : %6.1f C",   cachedTemp);
    logLine("SENSORS", "Humidity  : %6.1f %%",   cachedHumidity);
  } else {
    logWARN("SENSORS", "DHT22 read failed — using cached %.1f C  %.0f %%",
      cachedTemp, cachedHumidity);
  }
  logLine("SENSORS", "Flow vol  : %6.1f mL  pulses=%lu", flowMl(), flowPulses);
  logLine("SENSORS", "Pump      : %s", pumpRunning ? "ON" : "OFF");
  logEnd();
}

// ─────────────────────────────────────────────────────────────────────
// AUTO WATERING
// ─────────────────────────────────────────────────────────────────────
void checkAutoWatering() {
  if (pumpRunning || manualPump) return;
  if (cachedMoisture < MOISTURE_THRESHOLD) {
    logWARN("AUTO", "Moisture %.1f%% < %.0f%% — triggering auto-water",
      cachedMoisture, MOISTURE_THRESHOLD);
    startPump("auto");
  }
}

// ─────────────────────────────────────────────────────────────────────
// BLYNK SYNC
// ─────────────────────────────────────────────────────────────────────
// Blynk virtual pins:
//   V0 = soilMoisture   V1 = pH         V2 = lux
//   V3 = temperature    V4 = humidity   V5 = pump toggle
//   V6 = flowVolume
void sendToBlynk() {
  if (WiFi.status() != WL_CONNECTED) return;
  Blynk.virtualWrite(V0, cachedMoisture);
  Blynk.virtualWrite(V1, cachedPH);
  Blynk.virtualWrite(V2, cachedLux);
  if (dhtValid) {
    Blynk.virtualWrite(V3, cachedTemp);
    Blynk.virtualWrite(V4, cachedHumidity);
  }
  Blynk.virtualWrite(V6, flowMl());
  logOK("BLYNK", "V0-V6 updated");
}

// ─────────────────────────────────────────────────────────────────────
// HEARTBEAT  →  POST /api/config/status
// Exact fields per validateDeviceStatus in requestValidator.js
// ─────────────────────────────────────────────────────────────────────
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    logWARN("HEARTBEAT", "Skipped — no WiFi"); return;
  }
  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["online"]       = true;
  doc["pumpActive"]   = pumpRunning;
  doc["currentState"] = pumpRunning ? "WATERING" : "IDLE";  // IDLE|WATERING|COOLDOWN|ERROR
  doc["ipAddress"]    = WiFi.localIP().toString();
  doc["uptime"]       = (int)(millis() / 1000);
  String p; serializeJson(doc, p);

  int code = httpPost(URL_STATUS, p);
  if (code == 200 || code == 201) {
    logOK("HEARTBEAT", "→ %d  uptime=%lus  pump=%s  ip=%s",
      code, millis()/1000, pumpRunning?"ON":"OFF",
      WiFi.localIP().toString().c_str());
  } else {
    logERR("HEARTBEAT", "FAILED → %d", code);
  }
}

// ─────────────────────────────────────────────────────────────────────
// SENSOR POST  →  POST /api/sensors
// Required fields per validateSensorReading in requestValidator.js:
//   soilMoisture, temperature, humidity, light
//   optional: pH, flowRate (flowRateMlPerMin), flowVolume, deviceId
// ─────────────────────────────────────────────────────────────────────
void sendSensors() {
  if (WiFi.status() != WL_CONNECTED) {
    logWARN("BACKEND", "Skipped — no WiFi"); return;
  }

  float flowRateMlPerMin = 0.0f;
  if (pumpRunning) {
    float runMin = (millis() - pumpStartMs) / 60000.0f;
    if (runMin > 0.0f) flowRateMlPerMin = flowMl() / runMin;
  }

  // Round to reduce JSON payload size and match frontend normalization
  StaticJsonDocument<384> doc;
  doc["deviceId"]          = DEVICE_ID;
  doc["soilMoisture"]      = round(cachedMoisture * 10.0f) / 10.0f;  // required
  doc["temperature"]       = round(cachedTemp     * 10.0f) / 10.0f;  // required
  doc["humidity"]          = round(cachedHumidity * 10.0f) / 10.0f;  // required
  doc["light"]             = (float)(int)cachedLux;                   // required (lux as float)
  doc["pH"]                = round(cachedPH        * 100.0f) / 100.0f; // optional
  doc["flowRateMlPerMin"]  = round(flowRateMlPerMin * 10.0f) / 10.0f;  // optional alias
  doc["flowVolume"]        = round(flowMl()          * 10.0f) / 10.0f;  // optional

  String payload; serializeJson(doc, payload);

  logSep("BACKEND");
  logLine("BACKEND", "POST %s", URL_SENSORS);
  logLine("BACKEND", "Payload: %s", payload.c_str());

  int code = -1;
  for (int attempt = 1; attempt <= 3 && code != 200 && code != 201; attempt++) {
    if (attempt > 1) {
      logWARN("BACKEND", "Retry %d/3 …", attempt);
      delay(3000);
    }
    code = httpPost(URL_SENSORS, payload, 10000);
    if (code == 200 || code == 201) {
      backendOkCount++;
      logOK("BACKEND", "Saved to DB → %d  (ok=%u fail=%u)",
        code, backendOkCount, backendFailCount);
    } else {
      logWARN("BACKEND", "Attempt %d failed → %d", attempt, code);
    }
  }

  if (code != 200 && code != 201) {
    backendFailCount++;
    logERR("BACKEND", "All 3 attempts failed → %d  (ok=%u fail=%u)",
      code, backendOkCount, backendFailCount);
  }
  logEnd();
}

// ─────────────────────────────────────────────────────────────────────
// REMOTE COMMAND POLL  →  GET /api/water/status/ESP32-SENSOR
// Web dashboard can set pumpActive=true to start remote watering.
// The ESP polls this and reacts, keeping the hardware in sync with UI.
// ─────────────────────────────────────────────────────────────────────
void pollRemoteCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = httpGet(URL_WATER_STATUS);
  if (body.isEmpty()) return;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) { logWARN("CMD-POLL", "JSON parse error: %s", err.c_str()); return; }

  // Backend responds with { pumpActive: bool, ... }
  bool remotePump = doc["pumpActive"] | false;

  if (remotePump && !pumpRunning && !manualPump) {
    logLine("CMD-POLL", "Remote pump=ON command received → starting");
    manualPump = true;
    startPump("manual");
  } else if (!remotePump && pumpRunning && manualPump) {
    logLine("CMD-POLL", "Remote pump=OFF command received → stopping");
    stopPump();
  }
}

// ─────────────────────────────────────────────────────────────────────
// SERIAL COMMANDS
// ─────────────────────────────────────────────────────────────────────
void printHelp() {
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════╗");
  Serial.println("║       SPROUTSENSE v3.0  SERIAL COMMANDS      ║");
  Serial.println("╠══════════════════════════════════════════════╣");
  Serial.println("║  h / ?  — This help menu                     ║");
  Serial.println("║  s      — Read & print all sensors now        ║");
  Serial.println("║  p      — Pump ON  (manual)                   ║");
  Serial.println("║  o      — Pump OFF (manual)                   ║");
  Serial.println("║  r      — Relay click test (1 s)              ║");
  Serial.println("║  f      — Flow counter status                 ║");
  Serial.println("║  w      — WiFi status + IP                    ║");
  Serial.println("║  b      — Force backend sensor POST now       ║");
  Serial.println("║  c      — Force heartbeat POST now            ║");
  Serial.println("╚══════════════════════════════════════════════╝");
}

void handleSerial(char cmd) {
  switch (cmd) {
    case 'h': case '?':
      printHelp();
      break;

    case 's':
      updateSensors();
      printSensors();
      break;

    case 'p':
      manualPump = true;
      startPump("manual");
      break;

    case 'o':
      manualPump = false;
      stopPump();
      break;

    case 'r':
      logLine("TEST", "Relay click test…");
      digitalWrite(PIN_RELAY, HIGH); delay(1000); digitalWrite(PIN_RELAY, LOW);
      logOK("TEST", "Relay click done");
      break;

    case 'f':
      logSep("FLOW");
      logLine("FLOW", "Pulses  : %lu", flowPulses);
      logLine("FLOW", "Volume  : %.2f mL", flowMl());
      logLine("FLOW", "Cal     : %.1f pulses/mL", FLOW_PULSES_PER_ML);
      logEnd();
      break;

    case 'w':
      logSep("WIFI");
      logLine("WIFI", "Status  : %s",
        WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
      logLine("WIFI", "IP      : %s", WiFi.localIP().toString().c_str());
      logLine("WIFI", "RSSI    : %d dBm", WiFi.RSSI());
      logLine("WIFI", "SSID    : %s", WiFi.SSID().c_str());
      logEnd();
      break;

    case 'b':
      logLine("CMD", "Forcing backend POST…");
      sendSensors();
      break;

    case 'c':
      logLine("CMD", "Forcing heartbeat POST…");
      sendHeartbeat();
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════╗");
  Serial.println("║    SPROUTSENSE  ESP32-SENSOR  v3.0           ║");
  Serial.println("║    Booting…                                  ║");
  Serial.println("╚══════════════════════════════════════════════╝");

  // ── GPIO setup ───────────────────────────────────────────────────
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);   // pump OFF at boot
  pinMode(PIN_FLOW, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), flowISR, FALLING);
  logOK("INIT", "GPIO configured  relay=GPIO%d  flow=GPIO%d",
    PIN_RELAY, PIN_FLOW);

  // ── ADC ──────────────────────────────────────────────────────────
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);
  logOK("INIT", "ADC  12-bit  11 dB attenuation");

  // ── DHT22 warmup ─────────────────────────────────────────────────
  dht.begin();
  delay(2500);
  logLine("INIT", "DHT22 warmup…");
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature(), h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      cachedTemp = t; cachedHumidity = h; dhtValid = true;
      logOK("INIT", "DHT22 OK  %.1f C  %.0f %%", t, h);
      break;
    }
    logWARN("INIT", "DHT22 attempt %d failed, retrying…", i + 1);
    delay(2000);
  }
  if (!dhtValid) logERR("INIT", "DHT22 all warmup attempts failed — using defaults");

  // ── WiFi ─────────────────────────────────────────────────────────
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  logLine("WIFI", "Connecting to %s ", WIFI_SSID);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print("."); tries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    logOK("WIFI", "Connected!  IP=%s  RSSI=%d dBm",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());

    // ── Blynk  (non-blocking config) ───────────────────────────────
    Blynk.config(BLYNK_AUTH_TOKEN);
    logOK("BLYNK", "Configured (non-blocking)");

    // ── Initial heartbeat ──────────────────────────────────────────
    sendHeartbeat();
  } else {
    logERR("WIFI", "Connection FAILED after %d tries — will retry in loop", tries);
  }

  // ── Initial sensor read ──────────────────────────────────────────
  updateSensors();
  printSensors();

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════╗");
  Serial.println("║    SPROUTSENSE  v3.0  READY                  ║");
  Serial.println("║    Type 'h' for command list                  ║");
  Serial.println("╚══════════════════════════════════════════════╝");
  Serial.println();
}

// ─────────────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // ── Blynk ────────────────────────────────────────────────────────
  if (WiFi.status() == WL_CONNECTED) Blynk.run();

  // ── WiFi auto-reconnect ──────────────────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconn = 0;
    if (now - lastReconn >= 30000) {
      lastReconn = now;
      logWARN("WIFI", "Disconnected — attempting reconnect…");
      WiFi.reconnect();
    }
  }

  // ── Sensor read  (every IV_SENSORS ms) ───────────────────────────
  if (now - tSensors >= IV_SENSORS) {
    tSensors = now;
    updateSensors();
    printSensors();
    checkAutoWatering();
    sendToBlynk();
  }

  // ── Backend sensor POST  (every IV_BACKEND ms) ───────────────────
  if (now - tBackend >= IV_BACKEND) {
    tBackend = now;
    sendSensors();
  }

  // ── Heartbeat  (every IV_HEARTBEAT ms) ───────────────────────────
  if (now - tHeartbeat >= IV_HEARTBEAT) {
    tHeartbeat = now;
    sendHeartbeat();
  }

  // ── Poll remote pump command  (every IV_CMD_POLL ms) ─────────────
  if (now - tCmdPoll >= IV_CMD_POLL) {
    tCmdPoll = now;
    pollRemoteCommand();
  }

  // ── Pump safety ──────────────────────────────────────────────────
  updatePumpSafety();

  // ── Serial input ─────────────────────────────────────────────────
  if (Serial.available()) handleSerial((char)Serial.read());

  delay(50);
}
