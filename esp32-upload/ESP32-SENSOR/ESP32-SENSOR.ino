// =====================================================
// SPROUTSENSE ESP32-SENSOR — FINAL PRODUCTION v2.1 + BLYNK
// Board: ESP32 Dev Module
// Sensors: Soil Moisture, pH, LDR, DHT22
// Actuators: Relay (GPIO 14) + Flow Sensor (GPIO 12)
// Display: TFT ST7735R (SPI)
// Backend: Render.com & Blynk IoT
// =====================================================

// ========== BLYNK CONFIGURATION ==========
// IMPORTANT: These must be the VERY FIRST lines before any includes!
#define BLYNK_TEMPLATE_ID "TMPL_YOUR_ID"
#define BLYNK_TEMPLATE_NAME "SproutSense"
#define BLYNK_AUTH_TOKEN "YOUR_BLYNK_AUTH_TOKEN"
#define BLYNK_PRINT Serial

// ========== LIBRARIES ==========
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>

// ========== WIFI CREDENTIALS ==========
const char* WIFI_SSID     = "@Connect";
const char* WIFI_PASSWORD = "qwertyomm";

// ========== STATIC IP (optional) ==========
#define STATICIP_ENABLED true
const uint8_t STATIC_IP[]      = {192, 168, 1, 120};
const uint8_t STATIC_GATEWAY[] = {192, 168, 1,   1};
const uint8_t STATIC_SUBNET[]  = {255, 255, 255, 0};
const uint8_t STATIC_DNS1[]    = {8,   8,   8,   8};

// ========== BACKEND URLs ==========
const char* BACKEND_URL   = "https://sproutsense-backend.onrender.com/api/sensors";
const char* HEARTBEAT_URL = "https://sproutsense-backend.onrender.com/api/config/status";
const char* DEVICE_ID     = "ESP32-SENSOR";

// ========== BACKEND STATUS (for TFT) ==========
bool   backendOk        = true;
String backendLastError = "";

// ========== PIN CONFIGURATION (ADC1 ONLY — WiFi safe) ==========
#define PIN_SOIL_MOISTURE  35   // ADC1_CH7 — Capacitive moisture sensor
#define PIN_PH_SENSOR      34   // ADC1_CH6 — Analog pH probe
#define PIN_LDR            39   // ADC1_CH3 — LDR light sensor
#define PIN_DHT            13   // Digital  — DHT22 temperature/humidity
#define PIN_RELAY          14   // Output   — Relay CH1 → Water pump
#define PIN_FLOW_SENSOR    12   // Interrupt — YF-S401 flow meter

// TFT ST7735R (128x160) — Hardware SPI
#define PIN_TFT_CS  5
#define PIN_TFT_RST 4
#define PIN_TFT_DC  27

// ========== SENSOR SETTINGS ==========
#define DHT_TYPE           DHT22
#define MOISTURE_THRESHOLD 30.0    // Auto-water below this %
#define TARGET_WATER_ML    100.0   // Volume per watering cycle
#define PUMP_MAX_TIME_MS   20000   // Safety timeout (20 seconds)

// Moisture ADC calibration
#define MOISTURE_ADC_DRY   2800
#define MOISTURE_ADC_WET   1200

// LDR calibration
#define LUX_MAX 100000.0

// Flow sensor calibration
#define FLOW_PULSES_PER_ML  5.5    // YF-S401: adjust if measurement drifts

// ========== TIMING (milliseconds) ==========
#define INTERVAL_SENSORS   5000    // Read sensors every 5s
#define INTERVAL_BACKEND   15000   // Send to backend every 15s
#define INTERVAL_TFT       4000    // Update TFT every 4s
#define INTERVAL_HEARTBEAT 30000   // Heartbeat every 30s

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

// ========== FORWARD DECLARATIONS ==========
void handleSerialCommand(char cmd);

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
  Blynk.virtualWrite(V5, 1); // Update Blynk switch to ON
  Serial.println("[PUMP] ON — target: " + String(TARGET_WATER_ML) + " mL");
}

void stopPump() {
  digitalWrite(PIN_RELAY, LOW);
  pumpRunning = false;
  Blynk.virtualWrite(V5, 0); // Update Blynk switch to OFF
  Serial.printf("[PUMP] OFF — dispensed: %.1f mL in %lums\n",
    getFlowVolumeMl(), millis() - pumpStartTime);
}

void updatePumpLogic() {
  if (!pumpRunning) return;
  float vol             = getFlowVolumeMl();
  unsigned long runtime = millis() - pumpStartTime;
  if (vol >= TARGET_WATER_ML) {
    Serial.println("[PUMP] Target volume reached");
    stopPump();
  } else if (runtime >= PUMP_MAX_TIME_MS) {
    Serial.println("[PUMP] Safety timeout — stopping");
    stopPump();
  }
}

// ========== BLYNK MANUAL PUMP CONTROL ==========
// Triggers when you press the button (V5) in the Blynk app
BLYNK_WRITE(V5) {
  int pinValue = param.asInt();
  if (pinValue == 1) {
    manualPump = true;
    startPump();
  } else {
    manualPump = false;
    stopPump();
  }
}

// ========== CACHED SENSOR VALUES ==========
float cachedMoisture = 0;
float cachedPH       = 7.0;
float cachedLux      = 0;
float cachedTemp     = 25.0;    
float cachedHumidity = 50.0;    
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
  Serial.printf("[SENSORS] Moisture:%.1f%% pH:%.2f Lux:%.0f",
    cachedMoisture, cachedPH, cachedLux);
  if (dhtValid)
    Serial.printf(" Temp:%.1fC Hum:%.1f%%", cachedTemp, cachedHumidity);
  else
    Serial.print(" Temp:CACHED Hum:CACHED");
  Serial.printf(" Flow:%.1fmL Pump:%s\n",
    getFlowVolumeMl(), pumpRunning ? "ON" : "OFF");
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

// ========== BLYNK SYNC ==========
void sendToBlynk() {
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.virtualWrite(V0, cachedMoisture);
    Blynk.virtualWrite(V1, cachedPH);
    Blynk.virtualWrite(V2, cachedLux);
    if (dhtValid) {
      Blynk.virtualWrite(V3, cachedTemp);
      Blynk.virtualWrite(V4, cachedHumidity);
    }
    Blynk.virtualWrite(V6, getFlowVolumeMl());
  }
}

// ========== HEARTBEAT ==========
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["online"]       = true;
  doc["pumpActive"]   = pumpRunning;
  doc["currentState"] = pumpRunning ? "WATERING" : "IDLE";
  doc["ipAddress"]    = WiFi.localIP().toString();
  doc["uptime"]       = millis() / 1000;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(HEARTBEAT_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  int code = http.POST(payload);
  http.end();
  Serial.printf("[HEARTBEAT] %d | Pump:%s | Uptime:%lus\n",
    code, pumpRunning ? "ON" : "OFF", millis() / 1000);
}

// ========== BACKEND SYNC ==========
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[BACKEND] Skipped — no WiFi");
    return;
  }

  float flowRateMlPerMin = 0.0;
  if (pumpRunning) {
    float runtimeMin = (millis() - pumpStartTime) / 60000.0;
    if (runtimeMin > 0.0)
      flowRateMlPerMin = getFlowVolumeMl() / runtimeMin;
  }

  StaticJsonDocument<512> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["soilMoisture"] = round(cachedMoisture * 10) / 10.0;
  doc["pH"]           = round(cachedPH * 100) / 100.0;
  doc["light"]        = (int)cachedLux;
  doc["temperature"]  = round(cachedTemp * 10) / 10.0;
  doc["humidity"]     = round(cachedHumidity * 10) / 10.0;
  doc["flowRate"]     = round(flowRateMlPerMin * 10) / 10.0;
  doc["flowVolume"]   = round(getFlowVolumeMl() * 10) / 10.0;

  String payload;
  serializeJson(doc, payload);
  Serial.println("[BACKEND] Sending: " + payload);

  int code = -1;
  for (int attempt = 0; attempt < 3 && code != 200 && code != 201; attempt++) {
    if (attempt > 0) {
      Serial.printf("[BACKEND] Retry %d/2...\n", attempt);
      delay(3000);
    }
    HTTPClient http;
    http.begin(BACKEND_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000); 
    code = http.POST(payload);
    
    if (code == 200 || code == 201) {
      Serial.println("[BACKEND] OK (" + String(code) + ") — saved to DB");
      backendOk = true;
      backendLastError = "";
    } else {
      Serial.printf("[BACKEND] Attempt %d failed: %d\n", attempt + 1, code);
    }
    http.end();
  }

  if (code != 200 && code != 201) {
    Serial.println("[BACKEND] All 3 attempts failed — data lost for this cycle");
    backendOk = false;
    backendLastError = "HTTP " + String(code);
  }
}

// ========== TFT DISPLAY ==========
uint8_t tftPage = 0;
unsigned long lastTFTUpdate = 0;

void updateTFTDisplay() {
  tft.fillScreen(C_BLACK);
  
  // --- 1. GLOBAL HEADER ---
  tft.setTextSize(1);
  tft.setCursor(5, 4);
  tft.setTextColor(C_CYAN);  tft.print("SPROUTSENSE");
  tft.setCursor(130, 4);
  tft.setTextColor(C_DGRAY); tft.printf("%u/4", tftPage + 1);
  tft.drawLine(0, 14, 160, 14, C_DGRAY);

  // --- 2. MAIN CONTENT AREA ---
  switch (tftPage) {
    case 0: // Soil & Light
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("SOIL & LIGHT");
      
      tft.setCursor(5, 34); tft.setTextSize(2);
      tft.setTextColor(cachedMoisture < 30 ? C_RED : C_GREEN);
      tft.printf("%.0f%%\n", cachedMoisture);
      tft.setCursor(5, 52); tft.setTextSize(1); tft.setTextColor(C_LGRAY); tft.print("Moisture");

      tft.setCursor(85, 34); tft.setTextSize(2);
      tft.setTextColor((cachedPH < 5.5 || cachedPH > 7.5) ? C_ORANGE : C_GREEN);
      tft.printf("%.1f\n", cachedPH);
      tft.setCursor(85, 52); tft.setTextSize(1); tft.setTextColor(C_LGRAY); tft.print("pH Lvl");

      tft.setCursor(5, 72); tft.setTextSize(2);
      tft.setTextColor(cachedLux < 2000 ? C_RED : C_GREEN);
      tft.printf("%.0f\n", cachedLux);
      tft.setCursor(5, 90); tft.setTextSize(1); tft.setTextColor(C_LGRAY); tft.print("Lux");
      break;

    case 1: // Climate
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("CLIMATE");
      if (dhtValid) {
        tft.setCursor(5, 38); tft.setTextSize(2); tft.setTextColor(C_CYAN);
        tft.printf("%.1fC\n", cachedTemp);
        tft.setCursor(5, 56); tft.setTextSize(1); tft.setTextColor(C_LGRAY); tft.print("Temp");

        tft.setCursor(85, 38); tft.setTextSize(2); tft.setTextColor(C_GREEN);
        tft.printf("%.0f%%\n", cachedHumidity);
        tft.setCursor(85, 56); tft.setTextSize(1); tft.setTextColor(C_LGRAY); tft.print("Hum");
      } else {
        tft.setCursor(5, 38); tft.setTextSize(1); tft.setTextColor(C_RED);
        tft.println("DHT22 OFFLINE!");
        tft.setCursor(5, 52); tft.setTextColor(C_ORANGE);
        tft.printf("Temp: %.1fC (cached)\n", cachedTemp);
        tft.setCursor(5, 64);
        tft.printf("Hum : %.0f%% (cached)\n", cachedHumidity);
      }
      break;

    case 2: // Watering
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("WATERING");
      
      tft.setCursor(5, 34); tft.setTextSize(2);
      tft.setTextColor(pumpRunning ? C_CYAN : C_DGRAY);
      tft.print(pumpRunning ? "PUMP ON" : "PUMP OFF");
      
      tft.setCursor(5, 56); tft.setTextSize(1); tft.setTextColor(C_LGRAY);
      tft.printf("Vol: %.1f / %.0f mL\n", getFlowVolumeMl(), TARGET_WATER_ML);
      tft.setCursor(5, 70); tft.setTextColor(C_DGRAY);
      tft.printf("Auto-Trg : %.0f%%\n", MOISTURE_THRESHOLD);
      
      if (pumpRunning) {
        tft.setCursor(5, 88); tft.setTextColor(C_ORANGE);
        tft.printf("Running  : %lus", (millis() - pumpStartTime) / 1000);
      }
      break;

    case 3: // Network
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("NETWORK");
      
      tft.setCursor(5, 32); tft.setTextSize(1);
      tft.setTextColor(WiFi.status() == WL_CONNECTED ? C_GREEN : C_RED);
      tft.printf("WiFi : %s\n", WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");
      if (WiFi.status() == WL_CONNECTED) {
        tft.setCursor(5, 44); tft.setTextColor(C_LGRAY);
        tft.print(WiFi.localIP().toString().c_str());
      }
      
      tft.setCursor(5, 62); 
      tft.setTextColor(backendOk ? C_GREEN : C_RED);
      tft.print("Cloud: ");
      if (backendOk) {
        tft.print("SYNC OK");
      } else {
        tft.setCursor(5, 76); tft.setTextSize(2);
        tft.print("ERR: ");
        tft.print(backendLastError);
        tft.setTextSize(1);
      }
      break;
  }

  // --- 3. GLOBAL STATUS FOOTER ---
  tft.drawLine(0, 112, 160, 112, C_DGRAY);
  tft.setCursor(5, 118);
  tft.setTextSize(1);
  if (!backendOk) {
    tft.setTextColor(C_RED); tft.print("! BACKEND OFFLINE !");
  } else if (pumpRunning) {
    tft.setTextColor(C_CYAN); tft.print(">>> WATERING <<<");
  } else if (!dhtValid) {
    tft.setTextColor(C_ORANGE); tft.print("! SENSOR WARNING !");
  } else {
    tft.setTextColor(C_GREEN); tft.print("SYSTEM NORMAL");
  }
}

// ========== TIMERS ==========
unsigned long lastSensorRead  = 0;
unsigned long lastBackendSync = 0;
unsigned long lastHeartbeat   = 0;

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n====================================");
  Serial.println("  SPROUTSENSE ESP32-SENSOR v2.1");
  Serial.println("  Flow + Relay + TFT + Cloud + Blynk");
  Serial.println("====================================\n");

  // TFT init
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_CYAN); tft.setTextSize(1);
  tft.setCursor(5, 5);  tft.println("SproutSense v2.1");
  tft.setCursor(5, 20); tft.setTextColor(C_WHITE); tft.println("Initializing...");

  // GPIO
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); // Pump OFF at boot
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowISR, FALLING);

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

  // WiFi
  WiFi.mode(WIFI_STA);
#if STATICIP_ENABLED
  IPAddress ip(STATIC_IP[0],      STATIC_IP[1],      STATIC_IP[2],      STATIC_IP[3]);
  IPAddress gw(STATIC_GATEWAY[0], STATIC_GATEWAY[1], STATIC_GATEWAY[2], STATIC_GATEWAY[3]);
  IPAddress sn(STATIC_SUBNET[0],  STATIC_SUBNET[1],  STATIC_SUBNET[2],  STATIC_SUBNET[3]);
  IPAddress d1(STATIC_DNS1[0],    STATIC_DNS1[1],    STATIC_DNS1[2],    STATIC_DNS1[3]);
  WiFi.config(ip, gw, sn, d1);
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
    sendHeartbeat();
    
    // Initialize Blynk (non-blocking method)
    Blynk.config(BLYNK_AUTH_TOKEN);
    Serial.println("[BLYNK] Configured");
  } else {
    Serial.println("\n[WIFI] FAILED — will retry in loop");
    tft.setCursor(5, 35); tft.setTextColor(C_RED); tft.println("WiFi FAILED");
  }

  delay(2000);
  tft.fillScreen(C_BLACK);
  Serial.println("\n>>> SPROUTSENSE v2.1 READY <<<");
}

// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  // Handle Blynk communication
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.run();
  }

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
    sendToBlynk(); // Sync realtime data to Blynk
  }

  // Send to backend every 15s
  if (now - lastBackendSync >= INTERVAL_BACKEND) {
    lastBackendSync = now;
    sendToBackend();
  }

  // Heartbeat every 30s
  if (now - lastHeartbeat >= INTERVAL_HEARTBEAT) {
    lastHeartbeat = now;
    sendHeartbeat();
  }

  // Update TFT every 4s
  if (now - lastTFTUpdate >= INTERVAL_TFT) {
    lastTFTUpdate = now;
    
    // IF BACKEND FAILED: Force display to stay on Network Page (Page 3)
    if (!backendOk) {
      tftPage = 3; 
    }

    updateTFTDisplay();
    
    if (backendOk) {
      tftPage = (tftPage + 1) % 4;
    }
  }

  // Pump safety logic
  updatePumpLogic();

  // Serial commands
  if (Serial.available()) {
    handleSerialCommand((char)Serial.read());
  }

  delay(50); 
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
    case 'r':
      Serial.println("[TEST] Relay click test...");
      digitalWrite(PIN_RELAY, HIGH); delay(1000); digitalWrite(PIN_RELAY, LOW);
      break;
    case 'f':
      Serial.printf("[FLOW] Pulses: %lu | Volume: %.1f mL\n", flowPulseCount, getFlowVolumeMl());
      break;
    case 'w':
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %d dBm\n", 
        WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED", WiFi.localIP().toString().c_str(), WiFi.RSSI());
      break;
    case 't':
      Serial.println("[TFT] Cycling all 4 pages...");
      for (int i = 0; i < 4; i++) {
        tftPage = i; updateTFTDisplay(); delay(2000);
      }
      break;
  }
}
