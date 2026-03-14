// =====================================================
// SPROUTSENSE ESP32-CAM-001 — DISEASE DETECTION
// Board: AI Thinker ESP32-CAM
// Role: Capture leaf image, run Edge Impulse inference,
//       POST results to Render backend
// Backend DB: sproutsense (set MONGODB_URI on Render)
// =====================================================
//
// ARDUINO IDE SETTINGS:
//   Board           : AI Thinker ESP32-CAM
//   Upload Speed    : 115200
//   CPU Frequency   : 240 MHz
//   Flash Size      : 4MB (32Mb)
//   Partition Scheme: Huge APP (3MB No OTA)
//   Programmer      : Esptool
//
// REQUIRED LIBRARIES:
//   - ArduinoJson        (Benoit Blanchon)
//   - HTTPClient         (built-in ESP32)
//   - esp32-camera       (Espressif — built into ESP32 board package)
//
// EDGE IMPULSE:
//   - Train model at studio.edgeimpulse.com
//   - Export as Arduino library
//   - Import into Arduino IDE -> Sketch -> Include Library -> .zip
//   - Replace #include below with your exported header
//
// WIRING (AI Thinker ESP32-CAM):
//   - Camera: built-in (OV2640)
//   - Flash LED: GPIO 4 (active HIGH)
//   - FTDI for flashing: GPIO 0 to GND during upload, remove after
//   - Power: 5V 2A (camera needs more current than USB can supply)
// =====================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"

// *** UNCOMMENT after installing your Edge Impulse exported library ***
// #include <SproutSense_inferencing.h>
// #define EDGE_IMPULSE_ENABLED true
#define EDGE_IMPULSE_ENABLED false  // Set true after installing EI library

// ========== WIFI CREDENTIALS ==========
const char* WIFI_SSID     = "@Connect";
const char* WIFI_PASSWORD = "qwertyomm";

// ========== BACKEND ==========
const char* BACKEND_URL_DISEASE = "https://sproutsense-backend.onrender.com/api/ai/disease";
const char* BACKEND_URL_STATUS  = "https://sproutsense-backend.onrender.com/api/config/status";
const char* DEVICE_ID           = "ESP32-CAM-001";

// ========== TIMING ==========
#define CAPTURE_INTERVAL_MS  30000  // Capture every 30 seconds
#define WIFI_TIMEOUT_MS      15000  // WiFi connect timeout

// ========== CAMERA PINS (AI Thinker ESP32-CAM) ==========
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_GPIO_NUM     4

// ========== DISEASE CLASSES (9 classes) ==========
// Must match your Edge Impulse model labels exactly
const char* DISEASE_LABELS[] = {
  "healthy",
  "leaf_spot",
  "powdery_mildew",
  "rust",
  "blight",
  "mosaic_virus",
  "downy_mildew",
  "leaf_curl",
  "nutrient_deficiency"
};
const int NUM_CLASSES = 9;
const float CONFIDENCE_THRESHOLD = 0.70; // 70% minimum confidence

// ========== GLOBALS ==========
unsigned long lastCapture  = 0;
unsigned long captureCount = 0;
bool cameraReady = false;

// ========== CAMERA INIT ==========
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = FRAMESIZE_QVGA;   // 320x240 — fast + EI compatible
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Init failed: 0x%x\n", err);
    return false;
  }
  Serial.println("[CAM] Camera initialized OK");
  return true;
}

// ========== WIFI CONNECT ==========
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("\n[WIFI] FAILED");
  return false;
}

// ========== SEND DEVICE STATUS ==========
void sendDeviceStatus(const char* state) {
  if (WiFi.status() != WL_CONNECTED) return;
  StaticJsonDocument<256> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["isOnline"]  = true;
  doc["state"]     = state;
  doc["wifiRSSI"]  = WiFi.RSSI();
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["firmwareVersion"] = "2.0.0";
  String body; serializeJson(doc, body);
  HTTPClient http;
  http.begin(BACKEND_URL_STATUS);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);
  int code = http.POST(body);
  Serial.printf("[STATUS] %s -> %d\n", state, code);
  http.end();
}

// ========== MOCK INFERENCE (when EI disabled) ==========
// Returns a simulated result for testing without Edge Impulse model
void mockInference(String& outLabel, float& outConf, int& outHealth) {
  // Cycle through results for demo
  static int mockIdx = 0;
  outLabel  = String(DISEASE_LABELS[mockIdx % NUM_CLASSES]);
  outConf   = 0.72 + (mockIdx % 5) * 0.05;  // 72-92%
  outHealth = (outLabel == "healthy") ? 90 : 55 + (mockIdx % 4) * 10;
  mockIdx++;
  Serial.printf("[MOCK] Inference: %s (%.0f%%) health=%d\n",
    outLabel.c_str(), outConf * 100, outHealth);
}

// ========== SEND DETECTION TO BACKEND ==========
void sendDiseaseDetection(const String& disease, float confidence, int healthScore) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[DISEASE] Skipped — no WiFi");
    return;
  }

  // Build payload matching DiseaseDetection.js schema
  StaticJsonDocument<512> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["detectedDisease"] = disease;
  doc["confidence"]      = confidence;
  doc["growthStage"]     = "vegetative"; // TODO: detect from model
  doc["alertRequired"]   = (disease != "healthy" && confidence >= CONFIDENCE_THRESHOLD);

  JsonObject health = doc.createNestedObject("plantHealth");
  health["overallScore"]    = healthScore;
  health["diseasePresent"]  = (disease != "healthy");
  health["confidenceLevel"] = confidence;

  // All 9 class scores (mock 0.0 except detected)
  JsonArray scores = doc.createNestedArray("allScores");
  for (int i = 0; i < NUM_CLASSES; i++) {
    JsonObject s = scores.createNestedObject();
    s["label"] = DISEASE_LABELS[i];
    s["score"] = (DISEASE_LABELS[i] == disease) ? confidence : (1.0 - confidence) / (NUM_CLASSES - 1);
  }

  String payload; serializeJson(doc, payload);
  Serial.println("[DISEASE] Sending: " + payload.substring(0, 100) + "...");

  HTTPClient http;
  http.begin(BACKEND_URL_DISEASE);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);
  if (code == 200 || code == 201) {
    Serial.printf("[DISEASE] Saved to sproutsense DB (%d) — %s %.0f%%\n",
      code, disease.c_str(), confidence * 100);
  } else {
    Serial.printf("[DISEASE] Error %d: %s\n", code, http.getString().c_str());
  }
  http.end();
}

// ========== CAPTURE + INFER ==========
void captureAndInfer() {
  captureCount++;
  Serial.printf("\n[CAP] Capture #%lu\n", captureCount);

  String  detectedDisease = "healthy";
  float   confidence      = 0.85;
  int     healthScore     = 90;

  // Flash on for capture
  digitalWrite(FLASH_GPIO_NUM, HIGH);
  delay(200);

  if (cameraReady) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[CAP] Failed to capture frame");
      digitalWrite(FLASH_GPIO_NUM, LOW);
      return;
    }
    Serial.printf("[CAP] Frame: %d bytes (%dx%d)\n",
      fb->len, fb->width, fb->height);

#if EDGE_IMPULSE_ENABLED
    // *** Edge Impulse inference goes here ***
    // ei_impulse_result_t result = { 0 };
    // signal_t signal;
    // ... (see Edge Impulse Arduino documentation)
    // Run_classifier(&signal, &result, false);
    // Parse result.classification[] for best label
    // detectedDisease = result.classification[bestIdx].label;
    // confidence      = result.classification[bestIdx].value;
    // healthScore     = (detectedDisease == "healthy") ? 90 : 50;
    Serial.println("[EI] Edge Impulse inference — implement after model export");
#else
    mockInference(detectedDisease, confidence, healthScore);
#endif

    esp_camera_fb_return(fb);
  } else {
    // Camera failed — still mock for testing
    mockInference(detectedDisease, confidence, healthScore);
  }

  digitalWrite(FLASH_GPIO_NUM, LOW);

  // Only send if above confidence threshold
  if (confidence >= CONFIDENCE_THRESHOLD) {
    sendDiseaseDetection(detectedDisease, confidence, healthScore);
  } else {
    Serial.printf("[DISEASE] Confidence %.0f%% below threshold %.0f%% — skipped\n",
      confidence * 100, CONFIDENCE_THRESHOLD * 100);
  }

  // Update device heartbeat
  sendDeviceStatus("IDLE");
}

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n====================================");
  Serial.println("  SPROUTSENSE ESP32-CAM-001");
  Serial.println("  Disease Detection Module");
  Serial.println("  Mode: " + String(EDGE_IMPULSE_ENABLED ? "Edge Impulse" : "Mock/Demo"));
  Serial.println("====================================\n");

  // Flash LED
  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);

  // Camera init
  cameraReady = initCamera();
  if (!cameraReady) {
    Serial.println("[CAM] WARNING: Camera init failed — using mock data");
  }

  // WiFi
  if (!connectWiFi()) {
    Serial.println("[WIFI] No connection — will retry");
  }

  // Send online status
  sendDeviceStatus("IDLE");

  Serial.println("\n>>> ESP32-CAM-001 READY <<<");
  Serial.printf("Capture interval: %d seconds\n", CAPTURE_INTERVAL_MS / 1000);
  Serial.printf("Confidence threshold: %.0f%%\n", CONFIDENCE_THRESHOLD * 100);
  Serial.printf("Backend: %s\n", BACKEND_URL_DISEASE);
  Serial.println("Commands: c=capture now  s=status  w=wifi  d=diag\n");

  // First capture immediately
  lastCapture = millis() - CAPTURE_INTERVAL_MS;
}

// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  // Auto WiFi reconnect
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnect = 0;
    if (now - lastReconnect > 30000) {
      lastReconnect = now;
      Serial.println("[WIFI] Reconnecting...");
      connectWiFi();
    }
  }

  // Periodic capture
  if (now - lastCapture >= CAPTURE_INTERVAL_MS) {
    lastCapture = now;
    captureAndInfer();
  }

  // Serial commands
  if (Serial.available()) {
    handleSerialCommand((char)Serial.read());
  }

  delay(100);
}

// ========== SERIAL COMMANDS ==========
void handleSerialCommand(char cmd) {
  switch (cmd) {
    case 'c':
      Serial.println("[CMD] Force capture now...");
      lastCapture = 0;
      break;
    case 's':
      sendDeviceStatus("IDLE");
      break;
    case 'w':
      Serial.printf("[WIFI] %s | IP: %s | RSSI: %d dBm\n",
        WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
      break;
    case 'd':
      Serial.println("[DIAG] ESP32-CAM-001");
      Serial.printf("  Camera    : %s\n", cameraReady ? "OK" : "FAILED");
      Serial.printf("  WiFi      : %s\n", WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");
      Serial.printf("  EI Mode   : %s\n", EDGE_IMPULSE_ENABLED ? "ON" : "Mock/Demo");
      Serial.printf("  Captures  : %lu\n", captureCount);
      Serial.printf("  Free heap : %u bytes\n", ESP.getFreeHeap());
      Serial.printf("  Uptime    : %lu min\n", millis() / 60000);
      break;
    case '?':
    case 'h':
      Serial.println("Commands: c=capture s=status w=wifi d=diag h=help");
      break;
  }
}

// =====================================================
// END — SPROUTSENSE ESP32-CAM-001.INO
// Device ID : ESP32-CAM-001
// Backend   : /api/ai/disease  (POST)
// DB        : sproutsense (set MONGODB_URI /sproutsense on Render)
// =====================================================
