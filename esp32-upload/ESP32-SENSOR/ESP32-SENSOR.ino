// =====================================================
// SPROUTSENSE ESP32-SENSOR - FINAL VERSION
// Static IP + TFT Display ST7735R
// Fixes: backend field names, lux conversion, DHT warmup
// =====================================================
//
// BOARD SETTINGS (Arduino IDE):
//   Board           : ESP32 Dev Module
//   Upload Speed    : 921600
//   CPU Frequency   : 240 MHz
//   Flash Size      : 4MB (32Mb)
//   Partition Scheme: Huge APP (3MB No OTA/1MB SPIFFS)  <- IMPORTANT!
//   Flash Mode      : QIO
//
// REQUIRED LIBRARIES (Library Manager):
//   - DHT sensor library     (Adafruit)
//   - Adafruit GFX Library   (Adafruit)
//   - Adafruit ST7735        (Adafruit)
//   - Blynk                  (Blynk)
//   - ArduinoJson            (Benoit Blanchon)
//   - HTTPClient             (built-in ESP32)
//
// BACKEND FIELD NAMES (must match API schema):
//   soilMoisture  -> 0-100 (%)
//   ph            -> 0-14
//   light         -> 0-100000 (lux)
//   temperature   -> Celsius
//   humidity      -> 0-100 (%)
//   deviceId      -> "ESP32-SENSOR-001"
// =====================================================


#define BLYNK_TEMPLATE_ID   "TMPL3EXpwJqdb"
#define BLYNK_TEMPLATE_NAME "SproutSense ESP32 Sensor"
#define BLYNK_AUTH_TOKEN    "xezZsP-lFO0Dz5TxHpOfJvIDFcx-5IY3"

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
const char* WIFI_SSID     = "Connect";
const char* WIFI_PASSWORD = "qwertyomm";


// ========== STATIC IP CONFIGURATION ==========
#define STATICIP_ENABLED true
const uint8_t STATIC_IP[]      = {192, 168, 1, 120};
const uint8_t STATIC_GATEWAY[] = {192, 168, 1, 1};
const uint8_t STATIC_SUBNET[]  = {255, 255, 255, 0};
const uint8_t STATIC_DNS1[]    = {8, 8, 8, 8};


// ========== PIN CONFIGURATION (ADC1 SAFE) ==========
#define PIN_SOIL_MOISTURE 35   // ADC1_CH7
#define PIN_PH_SENSOR     34   // ADC1_CH6
#define PIN_LDR           39   // ADC1_CH3
#define PIN_DHT           13   // DHT22
#define PIN_RELAY         14   // Pump relay
#define PIN_FLOW_SENSOR   12   // Flow meter (interrupt)

// TFT (ST7735R 128x160 SPI)
#define PIN_TFT_CS   5
#define PIN_TFT_RST  4
#define PIN_TFT_DC   27
// Hardware SPI: MOSI=23, SCLK=18 (fixed)


// ========== SENSOR SETTINGS ==========
#define DHT_TYPE           DHT22
#define MOISTURE_THRESHOLD 30.0
#define TARGET_WATER_ML    100.0
#define PUMP_MAX_TIME      20000

// Moisture ADC calibration (adjust for your sensor)
// Dry soil = higher ADC, Wet soil = lower ADC
#define MOISTURE_ADC_DRY  2800
#define MOISTURE_ADC_WET  1200

// LDR -> Lux conversion factor
// LDR raw 0-4095 mapped to 0-100000 lux (backend expects lux)
// Adjust LUX_MAX based on your LDR datasheet / calibration
#define LUX_MAX 100000.0


// ========== BACKEND API ==========
// IMPORTANT: Field names must match backend schema exactly!
const char* BACKEND_URL = "https://sproutsense-backend.onrender.com/api/sensors";
const char* DEVICE_ID   = "ESP32-SENSOR-001";


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


// ========== GLOBAL VARIABLES ==========
volatile unsigned long flowPulseCount = 0;

unsigned long lastSensorRead  = 0;
unsigned long lastBlynkSync   = 0;
unsigned long lastBackendSync = 0;
unsigned long lastTFTUpdate   = 0;
unsigned long pumpStartTime   = 0;

// Cached sensor values (updated every 5s)
float cachedMoisture = 0;
float cachedPH       = 7.0;
float cachedLux      = 0;
float cachedTemp     = 0;
float cachedHumidity = 0;
bool  dhtValid       = false;

bool    pumpRunning = false;
bool    manualPump  = false;
uint8_t tftPage     = 0;


// ========== FLOW SENSOR ISR ==========
void IRAM_ATTR flowISR() {
  flowPulseCount++;
}


// ========== SENSOR READ FUNCTIONS ==========

// Soil Moisture -> 0-100% (float)
float readSoilMoisture() {
  int raw = analogRead(PIN_SOIL_MOISTURE);
  // map() returns long - cast to float properly
  float percent = (float)(MOISTURE_ADC_DRY - raw) /
                  (float)(MOISTURE_ADC_DRY - MOISTURE_ADC_WET) * 100.0;
  return constrain(percent, 0.0, 100.0);
}

// pH -> 0-14
float readPH() {
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_PH_SENSOR);
    delayMicroseconds(200);
  }
  float voltage = ((sum / 5.0) / 4095.0) * 3.3;
  float ph = 7.0 - ((voltage - 2.5) / 0.18);
  return constrain(ph, 0.0, 14.0);
}

// Light -> lux (0 to LUX_MAX)
// Backend expects "light" field in lux (0-100000)
float readLux() {
  int raw = analogRead(PIN_LDR);
  return (raw / 4095.0) * LUX_MAX;
}

// Light -> percent (for TFT display only)
float readLightPercent() {
  int raw = analogRead(PIN_LDR);
  return (raw / 4095.0) * 100.0;
}

// Update all cached sensor values
void updateAllSensors() {
  cachedMoisture = readSoilMoisture();
  cachedPH       = readPH();
  cachedLux      = readLux();

  // DHT22: read with isnan check
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    cachedTemp     = t;
    cachedHumidity = h;
    dhtValid       = true;
  }
  // If isnan: keep last valid values, dhtValid stays true after first success
}

void readAndPrintSensors() {
  updateAllSensors();
  Serial.printf("M:%.1f%% | pH:%.2f | Lux:%.0f | T:", cachedMoisture, cachedPH, cachedLux);
  if (dhtValid) {
    Serial.printf("%.1fC | H:%.1f%%\n", cachedTemp, cachedHumidity);
  } else {
    Serial.println("-- DHT not ready");
  }
}


// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("  SPROUTSENSE ESP32-SENSOR v1.0");
  Serial.println("  Device: ESP32-SENSOR-001");
  Serial.println("========================================\n");

  // TFT
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_CYAN);
  tft.setTextSize(1);
  tft.setCursor(5, 5);
  tft.println("SproutSense v1.0");
  tft.println("Initializing...");
  Serial.println("[TFT] Initialized");

  // GPIO
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);
  pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowISR, FALLING);

  // ADC
  analogSetWidth(12);
  analogSetAttenuation(ADC_11db);

  // DHT - begin + warm-up reads to avoid isnan on first call
  dht.begin();
  delay(2500);   // DHT22 needs ~2s before first valid read
  // Attempt initial DHT read
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
  if (!dhtValid) Serial.println("[DHT] Warmup failed - check wiring on GPIO13");

  Serial.println("[SENSORS] Ready");

  // WiFi Static IP
  WiFi.mode(WIFI_STA);

#if STATICIP_ENABLED
  IPAddress localIP(STATIC_IP[0],      STATIC_IP[1],      STATIC_IP[2],      STATIC_IP[3]);
  IPAddress gateway(STATIC_GATEWAY[0], STATIC_GATEWAY[1], STATIC_GATEWAY[2], STATIC_GATEWAY[3]);
  IPAddress subnet (STATIC_SUBNET[0],  STATIC_SUBNET[1],  STATIC_SUBNET[2],  STATIC_SUBNET[3]);
  IPAddress dns1   (STATIC_DNS1[0],    STATIC_DNS1[1],    STATIC_DNS1[2],    STATIC_DNS1[3]);
  if (!WiFi.config(localIP, gateway, subnet, dns1)) {
    Serial.println("[WIFI] Static IP config failed - using DHCP");
  } else {
    Serial.printf("[WIFI] Static IP: %d.%d.%d.%d\n",
      STATIC_IP[0], STATIC_IP[1], STATIC_IP[2], STATIC_IP[3]);
  }
#endif

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  tft.setCursor(5, 30);
  tft.setTextColor(C_WHITE);
  tft.print("WiFi: "); tft.print(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500); Serial.print("."); tft.print("."); attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    tft.setCursor(5, 45); tft.setTextColor(C_GREEN);
    tft.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Timeout - retrying in loop");
    tft.setCursor(5, 45); tft.setTextColor(C_RED);
    tft.println("WiFi Failed!");
  }

  // Blynk
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect();
  Serial.println("[BLYNK] Configured");
  tft.setCursor(5, 60); tft.setTextColor(C_YELLOW);
  tft.println("Blynk: Ready");

  delay(2000);
  tft.fillScreen(C_BLACK);

  Serial.println("\n>>> SYSTEM READY <<<");
  Serial.println("Commands: h=help | s=sensors | p=pump on | o=pump off\n");
}


// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  if (WiFi.status() == WL_CONNECTED) Blynk.run();

  // Sensors every 5s
  if (now - lastSensorRead >= 5000) {
    lastSensorRead = now;
    readAndPrintSensors();
    checkAutoWatering();
  }

  // Blynk sync every 10s
  if (now - lastBlynkSync >= 10000) {
    lastBlynkSync = now;
    syncToBlynk();
  }

  // Backend sync every 15s
  if (now - lastBackendSync >= 15000) {
    lastBackendSync = now;
    sendToBackend();
  }

  // TFT update every 5s
  if (now - lastTFTUpdate >= 5000) {
    lastTFTUpdate = now;
    updateTFTDisplay();
    tftPage = (tftPage + 1) % 4;
  }

  updatePumpLogic();

  if (Serial.available()) handleSerialCommand(Serial.read());

  delay(100);
}


// ========== TFT DISPLAY ==========
void updateTFTDisplay() {
  float volume = flowPulseCount / 5.5;

  tft.fillScreen(C_BLACK);
  tft.setTextSize(1);
  tft.setCursor(2, 2);
  tft.setTextColor(C_CYAN);
  tft.print("SPROUTSENSE ");
  tft.setTextColor(C_DGRAY);
  tft.printf("P%u/4", tftPage + 1);
  tft.drawLine(0, 12, 160, 12, C_DGRAY);

  switch (tftPage) {
    case 0:  // Soil & Environment
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("SOIL & ENVIRONMENT");
      tft.setCursor(5, 32); tft.setTextColor(cachedMoisture < 30 ? C_RED : C_GREEN);
      tft.printf("Moisture : %.1f%%\n", cachedMoisture);
      tft.setCursor(5, 46); tft.setTextColor((cachedPH < 5.5 || cachedPH > 7.5) ? C_ORANGE : C_GREEN);
      tft.printf("pH       : %.2f\n", cachedPH);
      tft.setCursor(5, 60); tft.setTextColor(cachedLux < 2000 ? C_RED : C_GREEN);
      tft.printf("Light    : %.0f lux\n", cachedLux);
      tft.setCursor(5, 76); tft.setTextColor(C_DGRAY);
      tft.print("Auto-water at <30%");
      break;

    case 1:  // Climate
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("CLIMATE");
      if (dhtValid) {
        tft.setTextSize(2);
        tft.setCursor(10, 36); tft.setTextColor(C_CYAN);
        tft.printf("%.1f C\n", cachedTemp);
        tft.setTextSize(1);
        tft.setCursor(5, 62); tft.setTextColor(C_LGRAY); tft.println("Temperature");
        tft.setTextSize(2);
        tft.setCursor(10, 78); tft.setTextColor(C_GREEN);
        tft.printf("%.1f%%\n", cachedHumidity);
        tft.setTextSize(1);
        tft.setCursor(5, 104); tft.setTextColor(C_LGRAY); tft.println("Humidity");
      } else {
        tft.setCursor(5, 50); tft.setTextColor(C_RED);
        tft.println("DHT22 Error");
        tft.println("Check GPIO 13!");
      }
      break;

    case 2:  // Watering
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("WATERING SYSTEM");
      tft.setCursor(5, 32); tft.setTextColor(pumpRunning ? C_GREEN : C_LGRAY);
      tft.printf("Pump   : %s\n", pumpRunning ? "ON" : "OFF");
      tft.setCursor(5, 46); tft.setTextColor(C_CYAN);
      tft.printf("Volume : %.1f mL\n", volume);
      tft.setCursor(5, 60); tft.setTextColor(C_DGRAY); tft.println("Target : 100 mL");
      if (pumpRunning) {
        tft.setCursor(5, 76); tft.setTextColor(C_ORANGE);
        tft.printf("Runtime: %lus", (millis() - pumpStartTime) / 1000);
      }
      break;

    case 3:  // Network
      tft.setCursor(5, 18); tft.setTextColor(C_YELLOW); tft.println("NETWORK");
      tft.setCursor(5, 32);
      tft.setTextColor(WiFi.status() == WL_CONNECTED ? C_GREEN : C_RED);
      tft.printf("WiFi   : %s\n", WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");
      if (WiFi.status() == WL_CONNECTED) {
        tft.setCursor(5, 46); tft.setTextColor(C_LGRAY);
        tft.print("IP: "); tft.println(WiFi.localIP().toString().c_str());
        tft.setCursor(5, 60); tft.setTextColor(C_LGRAY);
        tft.printf("RSSI   : %d dBm\n", WiFi.RSSI());
      }
      tft.setCursor(5, 74);
      tft.setTextColor(Blynk.connected() ? C_GREEN : C_RED);
      tft.printf("Blynk  : %s\n", Blynk.connected() ? "OK" : "FAIL");
      tft.setCursor(5, 88); tft.setTextColor(C_CYAN);
      tft.printf("Uptime : %lu min\n", millis() / 60000);
      break;
  }
}


// ========== AUTO WATERING ==========
void checkAutoWatering() {
  if (pumpRunning || manualPump) return;
  if (cachedMoisture < MOISTURE_THRESHOLD) {
    startPump();
    Serial.printf("[AUTO WATER] Moisture %.1f%% < %.0f%%\n", cachedMoisture, MOISTURE_THRESHOLD);
  }
}

void startPump() {
  digitalWrite(PIN_RELAY, HIGH);
  pumpRunning    = true;
  pumpStartTime  = millis();
  flowPulseCount = 0;
  Serial.println("[PUMP] ON");
}

void stopPump() {
  digitalWrite(PIN_RELAY, LOW);
  pumpRunning = false;
  Serial.printf("[PUMP] OFF | Volume: %.1f mL\n", flowPulseCount / 5.5);
}

void updatePumpLogic() {
  if (!pumpRunning) return;
  float volume = flowPulseCount / 5.5;
  unsigned long runtime = millis() - pumpStartTime;
  if (volume >= TARGET_WATER_ML) {
    Serial.println("[PUMP] Target reached"); stopPump();
  } else if (runtime >= PUMP_MAX_TIME) {
    Serial.println("[PUMP] Safety timeout!"); stopPump();
  }
}


// ========== BLYNK ==========
void syncToBlynk() {
  if (!Blynk.connected()) return;
  Blynk.virtualWrite(V0, (int)cachedMoisture);
  Blynk.virtualWrite(V1, cachedPH);
  Blynk.virtualWrite(V2, dhtValid ? (int)cachedTemp     : 0);
  Blynk.virtualWrite(V3, dhtValid ? (int)cachedHumidity : 0);
  Blynk.virtualWrite(V4, (int)(cachedLux / LUX_MAX * 100)); // percent for display
  Blynk.virtualWrite(V5, (int)(flowPulseCount / 5.5));
  Blynk.virtualWrite(V6, pumpRunning ? 1 : 0);
  Serial.println("[BLYNK] Synced");
}

BLYNK_WRITE(V6) {
  int v = param.asInt();
  if (v == 1) { manualPump = true;  startPump(); }
  else        { manualPump = false; stopPump();  }
  Serial.printf("[BLYNK] Pump %s\n", v ? "ON" : "OFF");
}

BLYNK_CONNECTED() {
  Serial.println("[BLYNK] Connected!");
  Blynk.syncVirtual(V6);
}


// ========== BACKEND SYNC ==========
// Field names match backend schema (SensorReading model)
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[BACKEND] Skipped - no WiFi");
    return;
  }

  // Build JSON with CORRECT field names for the backend schema
  StaticJsonDocument<512> doc;
  doc["deviceId"]     = DEVICE_ID;                               // "ESP32-SENSOR-001"
  doc["soilMoisture"] = round(cachedMoisture * 10) / 10.0;      // 0-100 %
  doc["ph"]           = round(cachedPH * 100) / 100.0;          // 0-14  (NOT "phLevel"!)
  doc["light"]        = (int)cachedLux;                          // lux 0-100000 (NOT "lightLevel"!)
  doc["temperature"]  = dhtValid ? (round(cachedTemp * 10) / 10.0)     : 0;
  doc["humidity"]     = dhtValid ? (round(cachedHumidity * 10) / 10.0) : 0;

  String payload;
  serializeJson(doc, payload);

  Serial.println("[BACKEND] Sending: " + payload);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);  // 8s timeout (Render cold start can be slow)

  int code = http.POST(payload);
  String response = http.getString();

  if (code == 200 || code == 201) {
    Serial.println("[BACKEND] OK (" + String(code) + ")");
  } else {
    Serial.printf("[BACKEND] Error %d: %s\n", code, response.c_str());
  }
  http.end();
}


// ========== SERIAL COMMANDS ==========
void handleSerialCommand(char cmd) {
  switch (cmd) {
    case 'h':
      Serial.println("\n=== COMMANDS ===");
      Serial.println("s = Sensors  | p = Pump ON  | o = Pump OFF");
      Serial.println("w = WiFi     | b = Blynk    | t = TFT test");
      Serial.println("m = Memory   | d = Debug all");
      break;
    case 's': readAndPrintSensors(); break;
    case 'p': manualPump = true;  startPump(); break;
    case 'o': manualPump = false; stopPump();  break;
    case 'w':
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %d dBm\n",
        WiFi.status() == WL_CONNECTED ? "OK" : "FAIL",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      break;
    case 'b':
      Serial.printf("[BLYNK] %s\n", Blynk.connected() ? "Connected" : "Disconnected");
      break;
    case 't':
      for (int i = 0; i < 4; i++) { tftPage = i; updateTFTDisplay(); delay(2000); }
      break;
    case 'm':
      Serial.printf("[MEM] Free: %u | Min: %u bytes\n",
        ESP.getFreeHeap(), ESP.getMinFreeHeap());
      break;
    case 'd':
      readAndPrintSensors();
      Serial.printf("[PUMP] %s | Vol: %.1f mL\n",
        pumpRunning ? "ON" : "OFF", flowPulseCount / 5.5);
      Serial.printf("[WIFI] %s | [BLYNK] %s\n",
        WiFi.status() == WL_CONNECTED ? "OK" : "FAIL",
        Blynk.connected() ? "OK" : "FAIL");
      break;
  }
}

// =====================================================
// END OF SPROUTSENSE ESP32-SENSOR.INO
// =====================================================
