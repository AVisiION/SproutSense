/******************************************************************************
 * SPROUTSENSE — ESP32-SENSOR v3.2 (No Blynk)
 * Tomato Plant Monitoring & Auto Watering
 *
 * Board   : ESP32 Dev Module (38-pin)
 * Sensors : Soil Moisture (ADC), LDR (ADC), DHT22 (Digital), Flow Meter (pulse)
 * Outputs : Relay → Water Pump (GPIO 14)
 *           Buzzer → Audible alert when pump is ON (GPIO 27)
 * Input   : YF-S401 Flow Meter (GPIO 12, interrupt)
 * Cloud   : Custom backend REST API only
 ******************************************************************************/

/* ============================================================
   LIBRARIES
   ============================================================ */
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Preferences.h>

/* ============================================================
   WIFI CREDENTIALS
   ============================================================ */
Preferences preferences;

const char* DEFAULT_WIFI_SSID = "@Connect";
const char* DEFAULT_WIFI_PASS = "qwertyomm";

String wifiSSID     = "";
String wifiPassword = "";

/* ============================================================
   DEVICE IDENTITY
   ============================================================ */
const char* DEVICE_ID    = "ESP32-SENSOR";
const char* DEVICE_TOKEN = "";

/* ============================================================
   BACKEND REST API ENDPOINTS
   ============================================================ */
const char* URL_SENSORS     = "https://sproutsense.onrender.com/api/sensors/device";
const char* URL_STATUS      = "https://sproutsense.onrender.com/api/config/status/device";
const char* URL_WATER_START = "https://sproutsense.onrender.com/api/water/device/start";
const char* URL_WATER_STOP  = "https://sproutsense.onrender.com/api/water/device/stop";

String URL_CONFIG_STR;
String URL_WATER_STATUS_STR;
const char* URL_CONFIG       = nullptr;
const char* URL_WATER_STATUS = nullptr;

// ISRG Root X1 (Let's Encrypt) used by Render-hosted HTTPS endpoints.
// Rotate this certificate if backend TLS chain changes in the future.
static const char RENDER_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

void configureSecureClient(WiFiClientSecure& client) {
  client.setCACert(RENDER_ROOT_CA);
}

/* ============================================================
   PIN CONFIGURATION
   ============================================================ */
#define PIN_SOIL    35
#define PIN_LDR     39
#define PIN_DHT     13
#define PIN_RELAY   14
#define PIN_FLOW    26
#define PIN_BUZZER  27

/* ============================================================
   SENSOR CALIBRATION
   ============================================================ */
#define DHT_TYPE            DHT22
#define MOISTURE_ADC_DRY    2800
#define MOISTURE_ADC_WET    1200
#define LUX_MAX             100000.0f
#define FLOW_PULSES_PER_ML  5.5f
#define MOISTURE_THRESHOLD  30.0f
#define TARGET_WATER_ML     100.0f
#define PUMP_MAX_MS         20000

/* ============================================================
   TIMING INTERVALS (ms)
   ============================================================ */
#define IV_SENSORS    5000
#define IV_BACKEND    15000
#define IV_HEARTBEAT  30000
#define IV_CMD_POLL   8000
#define IV_CONFIG     60000

/* ============================================================
   OBJECTS
   ============================================================ */
DHT dht(PIN_DHT, DHT_TYPE);

/* ============================================================
   FLOW SENSOR
   ============================================================ */
volatile unsigned long g_flowPulses = 0;

void IRAM_ATTR flowISR() { g_flowPulses++; }

unsigned long flowPulsesSnapshot() {
  noInterrupts();
  unsigned long pulses = g_flowPulses;
  interrupts();
  return pulses;
}

float flowMl() { return (float)flowPulsesSnapshot() / FLOW_PULSES_PER_ML; }

void resetFlow() {
  noInterrupts();
  g_flowPulses = 0;
  interrupts();
}

/* ============================================================
   PUMP STATE
   ============================================================ */
bool          g_pumpRunning = false;
bool          g_manualPump  = false;
unsigned long g_pumpStartMs = 0;
bool          g_safetyStop  = false;

/* ============================================================
   CACHED SENSOR VALUES
   ============================================================ */
float g_moisture = 0.0f;
float g_lux      = 0.0f;
float g_temp     = 25.0f;
float g_humidity = 50.0f;
bool  g_dhtValid = false;

/* ============================================================
   INTERVAL TIMERS
   ============================================================ */
unsigned long g_tSensors   = 0;
unsigned long g_tBackend   = 0;
unsigned long g_tHeartbeat = 0;
unsigned long g_tCmdPoll   = 0;
unsigned long g_tConfig    = 0;

/* ============================================================
   BACKEND HEALTH COUNTERS
   ============================================================ */
uint32_t g_backendOk   = 0;
uint32_t g_backendFail = 0;

/* ============================================================
   FORWARD DECLARATIONS
   ============================================================ */
void handleSerial(char c);
void startPump(const char* trigger = "manual");
void stopPump();
void pollRemoteCommand();
void buzzerBeep(uint16_t onMs, uint8_t times = 1, uint16_t gapMs = 100);

/* ============================================================
   BUZZER HELPER
   ============================================================ */
void buzzerBeep(uint16_t onMs, uint8_t times, uint16_t gapMs) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(onMs);
    digitalWrite(PIN_BUZZER, LOW);
    if (times > 1 && i < times - 1) delay(gapMs);
  }
}

/* ============================================================
   SERIAL LOGGING HELPERS
   ============================================================ */
void logSep(const char* tag) {
  Serial.printf("\n╔══════════════════════════════════[ %s ]\n", tag);
}

void logLine(const char* tag, const char* fmt, ...) {
  char buf[256]; va_list args; va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args); va_end(args);
  Serial.printf("║ [%-10s] %s\n", tag, buf);
}

void logOK(const char* tag, const char* fmt, ...) {
  char buf[256]; va_list args; va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args); va_end(args);
  Serial.printf("║ [%-10s] ✔ %s\n", tag, buf);
}

void logERR(const char* tag, const char* fmt, ...) {
  char buf[256]; va_list args; va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args); va_end(args);
  Serial.printf("║ [%-10s] ✖ %s\n", tag, buf);
}

void logWARN(const char* tag, const char* fmt, ...) {
  char buf[256]; va_list args; va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args); va_end(args);
  Serial.printf("║ [%-10s] ⚠ %s\n", tag, buf);
}

void logEnd() {
  Serial.println("╚══════════════════════════════════════════════");
}

/* ============================================================
   HTTP HELPERS
   ============================================================ */
int httpPost(const char* url, const String& payload, int timeoutMs = 8000) {
  WiFiClientSecure client;
  configureSecureClient(client);
  HTTPClient http;
  if (!http.begin(client, url)) return -1;

  http.addHeader("Content-Type", "application/json");
  if (strlen(DEVICE_TOKEN) > 0) {
    http.addHeader("X-Device-ID",    DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);
  }
  http.setTimeout(timeoutMs);

  int code = http.POST(payload);
  if (code > 0) {
    String resp = http.getString();
    if (code >= 400) logERR("HTTP", "POST %s → %d body=%s", url, code, resp.c_str());
  } else {
    logERR("HTTP", "POST %s failed (code=%d)", url, code);
  }
  http.end();
  return code;
}

String httpGet(const char* url, int timeoutMs = 6000) {
  WiFiClientSecure client;
  configureSecureClient(client);
  HTTPClient http;
  String body = "";
  if (!http.begin(client, url)) return body;

  if (strlen(DEVICE_TOKEN) > 0) {
    http.addHeader("X-Device-ID",    DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);
  }
  http.setTimeout(timeoutMs);

  int code = http.GET();
  if (code == 200) {
    body = http.getString();
  } else {
    logWARN("HTTP", "GET %s → %d", url, code);
  }
  http.end();
  return body;
}

/* ============================================================
   PUMP CONTROL
   ============================================================ */
void startPump(const char* trigger) {
  if (g_pumpRunning) return;

  resetFlow();
  digitalWrite(PIN_RELAY, HIGH);
  g_pumpRunning = true;
  g_pumpStartMs = millis();
  buzzerBeep(150, 2, 100);

  logSep("PUMP");
  logOK("PUMP", "ON  trigger=%-10s target=%.0f mL", trigger, TARGET_WATER_ML);
  logEnd();

  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<192> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["triggerType"] = trigger;
    String p; serializeJson(doc, p);
    int code = httpPost(URL_WATER_START, p);
    if (code == 200 || code == 201) logOK("PUMP", "Backend ACK start → %d", code);
    else logWARN("PUMP", "Backend start ACK failed → %d (non-critical)", code);
  }
}

void stopPump() {
  if (!g_pumpRunning) return;

  digitalWrite(PIN_RELAY, LOW);
  g_pumpRunning = false;
  g_manualPump  = false;

  float vol        = flowMl();
  unsigned long ms = millis() - g_pumpStartMs;
  if (!g_safetyStop) buzzerBeep(400, 1);

  logSep("PUMP");
  logOK("PUMP", "OFF dispensed=%.1f mL runtime=%lu ms", vol, ms);
  logEnd();

  if (WiFi.status() == WL_CONNECTED) {
    StaticJsonDocument<192> doc;
    doc["deviceId"] = DEVICE_ID;
    String p; serializeJson(doc, p);
    int code = httpPost(URL_WATER_STOP, p);
    if (code == 200 || code == 201) logOK("PUMP", "Backend ACK stop → %d", code);
    else logWARN("PUMP", "Backend stop ACK failed → %d (non-critical)", code);
  }
}

void updatePumpSafety() {
  if (!g_pumpRunning) return;

  float vol             = flowMl();
  unsigned long runtime = millis() - g_pumpStartMs;

  if (vol >= TARGET_WATER_ML) {
    logOK("PUMP", "Target %.0f mL reached (got %.1f mL) — stopping", TARGET_WATER_ML, vol);
    stopPump();
  } else if (runtime >= PUMP_MAX_MS) {
    logWARN("PUMP", "Safety timeout %u ms — force stop (%.1f mL)", PUMP_MAX_MS, vol);
    g_safetyStop = true;
    stopPump();
    g_safetyStop = false;
    buzzerBeep(200, 3);
  }
}

/* ============================================================
   SENSOR READS
   ============================================================ */
float readMoisture() {
  int raw = analogRead(PIN_SOIL);
  return constrain(
    (float)(MOISTURE_ADC_DRY - raw) / (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0f,
    0.0f, 100.0f
  );
}

float readLux() {
  return (analogRead(PIN_LDR) / 4095.0f) * LUX_MAX;
}

void updateSensors() {
  g_moisture = readMoisture();
  g_lux      = readLux();

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) { g_temp = t; g_humidity = h; g_dhtValid = true; }
}

void printSensors() {
  logSep("SENSORS");
  logLine("SENSORS", "Moisture : %6.1f %%  (threshold: %.0f%%  %s)",
          g_moisture, MOISTURE_THRESHOLD,
          g_moisture < MOISTURE_THRESHOLD ? "<-- DRY!" : "OK");
  logLine("SENSORS", "Light    : %6.0f lux  (%s)", g_lux, g_lux < 2000 ? "LOW" : "OK");
  if (g_dhtValid) {
    logLine("SENSORS", "Temp     : %6.1f °C", g_temp);
    logLine("SENSORS", "Humidity : %6.1f %%",  g_humidity);
  } else {
    logWARN("SENSORS", "DHT22 read failed — cached %.1f°C %.0f%%", g_temp, g_humidity);
  }
  logLine("SENSORS", "Flow vol : %6.1f mL  pulses=%lu", flowMl(), flowPulsesSnapshot());
  logLine("SENSORS", "Pump     : %s  Buzzer: GPIO%d", g_pumpRunning ? "ON" : "OFF", PIN_BUZZER);
  logEnd();
}

/* ============================================================
   AUTO WATERING
   ============================================================ */
void checkAutoWatering() {
  if (g_pumpRunning || g_manualPump) return;
  if (g_moisture < MOISTURE_THRESHOLD) {
    logWARN("AUTO", "Moisture %.1f%% < %.0f%% — triggering auto-water",
            g_moisture, MOISTURE_THRESHOLD);
    startPump("auto");
  }
}

/* ============================================================
   HEARTBEAT → POST /api/config/status/device
   ============================================================ */
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) { logWARN("HEARTBEAT", "Skipped — no WiFi"); return; }

  StaticJsonDocument<384> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["online"]       = true;
  doc["pumpActive"]   = g_pumpRunning;
  doc["currentState"] = g_pumpRunning ? "WATERING" : "IDLE";
  doc["ipAddress"]    = WiFi.localIP().toString();
  doc["uptime"]       = (int)(millis() / 1000);
  String p; serializeJson(doc, p);

  int code = httpPost(URL_STATUS, p);
  if (code == 200 || code == 201) {
    logOK("HEARTBEAT", "→ %d  uptime=%lus  pump=%s  ip=%s",
          code, millis() / 1000UL,
          g_pumpRunning ? "ON" : "OFF",
          WiFi.localIP().toString().c_str());
  } else {
    logERR("HEARTBEAT", "FAILED → %d", code);
  }
}

/* ============================================================
   SENSOR POST → POST /api/sensors/device
   ============================================================ */
void sendSensors() {
  if (WiFi.status() != WL_CONNECTED) { logWARN("BACKEND", "Skipped — no WiFi"); return; }

  float flowRateMlPerMin = 0.0f;
  if (g_pumpRunning) {
    float runMin = (millis() - g_pumpStartMs) / 60000.0f;
    if (runMin > 0.0f) flowRateMlPerMin = flowMl() / runMin;
  }

  StaticJsonDocument<384> doc;
  doc["deviceId"]         = DEVICE_ID;
  doc["soilMoisture"]     = round(g_moisture         * 10.0f) / 10.0f;
  doc["temperature"]      = round(g_temp             * 10.0f) / 10.0f;
  doc["humidity"]         = round(g_humidity         * 10.0f) / 10.0f;
  doc["light"]            = (float)(int)g_lux;
  doc["flowRateMlPerMin"] = round(flowRateMlPerMin   * 10.0f) / 10.0f;
  doc["flowVolume"]       = round(flowMl()           * 10.0f) / 10.0f;

  String payload; serializeJson(doc, payload);

  logSep("BACKEND");
  logLine("BACKEND", "POST %s", URL_SENSORS);
  logLine("BACKEND", "Payload: %s", payload.c_str());

  int code = -1;
  for (int attempt = 1; attempt <= 3 && code != 200 && code != 201; attempt++) {
    if (attempt > 1) { logWARN("BACKEND", "Retry %d/3…", attempt); delay(3000); }
    code = httpPost(URL_SENSORS, payload, 10000);
    if (code == 200 || code == 201) {
      g_backendOk++;
      logOK("BACKEND", "Saved → %d  (ok=%u fail=%u)", code, g_backendOk, g_backendFail);
    } else {
      logWARN("BACKEND", "Attempt %d failed → %d", attempt, code);
    }
  }
  if (code != 200 && code != 201) {
    g_backendFail++;
    logERR("BACKEND", "All 3 attempts failed → %d  (ok=%u fail=%u)",
           code, g_backendOk, g_backendFail);
  }
  logEnd();
}

/* ============================================================
   REMOTE COMMAND POLL → GET /api/water/device/status/:deviceId
   ============================================================ */
void pollRemoteCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = httpGet(URL_WATER_STATUS);
  if (body.isEmpty()) return;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) { logWARN("CMD-POLL", "JSON parse error: %s", err.c_str()); return; }

  bool remotePump = doc["pumpActive"] | false;

  if (remotePump && !g_pumpRunning && !g_manualPump) {
    logLine("CMD-POLL", "Remote pump=ON → starting");
    g_manualPump = true;
    startPump("manual");
  } else if (!remotePump && g_pumpRunning && g_manualPump) {
    logLine("CMD-POLL", "Remote pump=OFF → stopping");
    stopPump();
  }
}

/* ============================================================
   REMOTE CONFIG POLL → GET /api/config/device/:deviceId
   ============================================================ */
void pollRemoteConfig() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = httpGet(URL_CONFIG, 10000);
  if (body.isEmpty()) return;

  StaticJsonDocument<128> filter;
  filter["wifiConfiguration"]["ssid"] = true;
  filter["wifiConfiguration"]["password"] = true;
  filter["config"]["wifiConfiguration"]["ssid"] = true;
  filter["config"]["wifiConfiguration"]["password"] = true;

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, body, DeserializationOption::Filter(filter));
  if (err) return;

  const char* newSsid = doc["config"]["wifiConfiguration"]["ssid"]
                     | doc["wifiConfiguration"]["ssid"]
                     | (const char*)nullptr;
  const char* newPass = doc["config"]["wifiConfiguration"]["password"]
                     | doc["wifiConfiguration"]["password"]
                     | (const char*)nullptr;

  if (newSsid && strlen(newSsid) > 0) {
    if (String(newSsid) != wifiSSID || (newPass && String(newPass) != wifiPassword)) {
      logLine("CONFIG", "New WiFi credentials received — restarting");
      preferences.putString("ssid", newSsid);
      preferences.putString("pass", newPass ? newPass : "");
      delay(2000);
      ESP.restart();
    }
  }
}

/* ============================================================
   SERIAL HELP MENU
   ============================================================ */
void printHelp() {
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║       SPROUTSENSE v3.2 SERIAL COMMANDS           ║");
  Serial.println("╠══════════════════════════════════════════════════╣");
  Serial.println("║  h / ?  — This help menu                         ║");
  Serial.println("║  s      — Read & print all sensors now           ║");
  Serial.println("║  p      — Pump ON  (manual start)                ║");
  Serial.println("║  o      — Pump OFF (manual stop)                 ║");
  Serial.println("║  r      — Relay click test (1 second)            ║");
  Serial.println("║  f      — Flow counter status                    ║");
  Serial.println("║  w      — WiFi status + IP                       ║");
  Serial.println("║  b      — Force backend sensor POST now          ║");
  Serial.println("║  c      — Force heartbeat POST now               ║");
  Serial.println("║  z      — Buzzer test beep                       ║");
  Serial.println("╚══════════════════════════════════════════════════╝");
}

/* ============================================================
   SERIAL COMMAND HANDLER
   ============================================================ */
void handleSerial(char cmd) {
  switch (cmd) {
    case 'h': case '?': printHelp(); break;

    case 's': updateSensors(); printSensors(); break;

    case 'p':
      logLine("CMD", "Manual pump ON");
      g_manualPump = true; startPump("manual"); break;

    case 'o':
      logLine("CMD", "Manual pump OFF");
      g_manualPump = false; stopPump(); break;

    case 'r':
      logLine("TEST", "Relay click test…");
      digitalWrite(PIN_RELAY, HIGH); delay(1000); digitalWrite(PIN_RELAY, LOW);
      logOK("TEST", "Relay click done"); break;

    case 'f':
      logSep("FLOW");
      logLine("FLOW", "Pulses : %lu",     flowPulsesSnapshot());
      logLine("FLOW", "Volume : %.2f mL", flowMl());
      logLine("FLOW", "Cal    : %.1f pulses/mL", FLOW_PULSES_PER_ML);
      logEnd(); break;

    case 'w':
      logSep("WIFI");
      logLine("WIFI", "Status : %s", WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
      logLine("WIFI", "IP     : %s", WiFi.localIP().toString().c_str());
      logLine("WIFI", "RSSI   : %d dBm", WiFi.RSSI());
      logLine("WIFI", "SSID   : %s", WiFi.SSID().c_str());
      logEnd(); break;

    case 'b': logLine("CMD", "Forcing backend POST…"); sendSensors(); break;
    case 'c': logLine("CMD", "Forcing heartbeat POST…"); sendHeartbeat(); break;

    case 'z':
      logLine("TEST", "Buzzer test: pump-on pattern");
      buzzerBeep(150, 2, 100); delay(500);
      logLine("TEST", "Buzzer test: pump-off pattern");
      buzzerBeep(400, 1); delay(500);
      logLine("TEST", "Buzzer test: safety-timeout pattern");
      buzzerBeep(200, 3, 80);
      logOK("TEST", "Buzzer test done"); break;
  }
}

/* ============================================================
   SETUP
   ============================================================ */
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║        SPROUTSENSE ESP32-SENSOR v3.2             ║");
  Serial.println("║        Tomato Disease & Health Monitor           ║");
  Serial.println("╚══════════════════════════════════════════════════╝");

  // Build dynamic URLs from DEVICE_ID
  URL_CONFIG_STR       = String("https://sproutsense.onrender.com/api/config/device/") + DEVICE_ID;
  URL_WATER_STATUS_STR = String("https://sproutsense.onrender.com/api/water/device/status/") + DEVICE_ID;
  URL_CONFIG           = URL_CONFIG_STR.c_str();
  URL_WATER_STATUS     = URL_WATER_STATUS_STR.c_str();

  /* GPIO */
  pinMode(PIN_RELAY,  OUTPUT); digitalWrite(PIN_RELAY,  LOW);
  pinMode(PIN_BUZZER, OUTPUT); digitalWrite(PIN_BUZZER, LOW);
  pinMode(PIN_FLOW,   INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), flowISR, FALLING);
  logOK("INIT", "GPIO: relay=GPIO%d  flow=GPIO%d  buzzer=GPIO%d",
        PIN_RELAY, PIN_FLOW, PIN_BUZZER);

  /* ADC */
  analogSetWidth(12);
  analogSetPinAttenuation(PIN_SOIL, ADC_11db);
  analogSetPinAttenuation(PIN_LDR,  ADC_11db);
  logOK("INIT", "ADC 12-bit 11dB per-pin attenuation");

  /* DHT22 warmup */
  dht.begin();
  delay(2500);
  logLine("INIT", "DHT22 warmup…");
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      g_temp = t; g_humidity = h; g_dhtValid = true;
      logOK("INIT", "DHT22 OK: %.1f°C  %.0f%%", t, h);
      break;
    }
    logWARN("INIT", "DHT22 attempt %d failed — retrying…", i + 1);
    delay(2000);
  }
  if (!g_dhtValid) logERR("INIT", "DHT22 all attempts failed — using defaults");

  /* WiFi */
  preferences.begin("sproutsense", false);
  wifiSSID     = preferences.getString("ssid", DEFAULT_WIFI_SSID);
  wifiPassword = preferences.getString("pass", DEFAULT_WIFI_PASS);
  if (wifiSSID.length() == 0) { wifiSSID = DEFAULT_WIFI_SSID; wifiPassword = DEFAULT_WIFI_PASS; }

  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.mode(WIFI_STA);

  logLine("WIFI", "Connecting to %s…", wifiSSID.c_str());
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) { delay(500); Serial.print("."); tries++; }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    logWARN("WIFI", "Connection failed — restarting…");
    delay(5000); ESP.restart();
  }

  logOK("WIFI", "Connected — IP=%s  RSSI=%d dBm",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
  buzzerBeep(100, 1);

  sendHeartbeat();
  updateSensors();
  printSensors();
  buzzerBeep(80, 3, 80);   // boot OK — triple quick beep

  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════╗");
  Serial.println("║        SPROUTSENSE v3.2 READY                    ║");
  Serial.println("║        Type 'h' for commands                     ║");
  Serial.println("╚══════════════════════════════════════════════════╝");
  Serial.println();
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
void loop() {
  unsigned long now = millis();

  /* Auto-reconnect WiFi if dropped */
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconn = 0;
    if (now - lastReconn >= 30000UL) {
      lastReconn = now;
      logWARN("WIFI", "Disconnected — reconnecting…");
      WiFi.reconnect();
    }
  }

  if (now - g_tSensors >= IV_SENSORS) {
    g_tSensors = now;
    updateSensors(); printSensors(); checkAutoWatering();
  }

  if (now - g_tBackend >= IV_BACKEND)    { g_tBackend   = now; sendSensors();       }
  if (now - g_tHeartbeat >= IV_HEARTBEAT){ g_tHeartbeat = now; sendHeartbeat();     }
  if (now - g_tCmdPoll >= IV_CMD_POLL)   { g_tCmdPoll   = now; pollRemoteCommand(); }
  if (now - g_tConfig >= IV_CONFIG)      { g_tConfig     = now; pollRemoteConfig();  }

  updatePumpSafety();

  if (Serial.available()) handleSerial((char)Serial.read());

  delay(50);
}