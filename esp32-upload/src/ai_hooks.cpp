/*!
 * @file ai_hooks.cpp
 * @brief SproutSense AI Integration Implementation (Stubs)
 * 
 * Stub implementations for:
 * - Edge Impulse disease detection (image capture & inference)
 * - Google Gemini advice generation (text-based AI)
 * - Google Assistant voice control (IFTTT webhooks)
 * 
 * All HTTP calls are marked TODO and can be implemented when ready.
 */

#include "ai_hooks.h"
#include "config.h"
#include "sensors.h"
#include "network.h"

// ============================================================================
// GLOBAL STATE
// ============================================================================

// Disease detection state
unsigned long lastDiseaseDetectionTime = 0;
char lastDetectedDisease[64] = "None";
float lastDiseaseConfidence = 0.0;
bool diseaseDetectionEnabled = ENABLE_DISEASE_DETECTION;

// Gemini state
unsigned long lastGeminiRequestTime = 0;
char lastGeminiAdvice[512] = "Waiting for first advice...";
bool geminiAdviceEnabled = ENABLE_GEMINI_ADVICE;

// Voice control state
int pendingVoiceCommand = 0;  // 0=none, 1=water, 2=check_status
unsigned long lastVoiceCommandTime = 0;
bool voiceControlEnabled = ENABLE_VOICE_CONTROL;

// ============================================================================
// INITIALIZATION
// ============================================================================

void initializeAIHooks() {
  Serial.println("[AI_HOOKS] Initializing...");
  
  lastDiseaseDetectionTime = 0;
  strcpy(lastDetectedDisease, "None");
  lastDiseaseConfidence = 0.0;
  
  lastGeminiRequestTime = 0;
  strcpy(lastGeminiAdvice, "Waiting for first advice...");
  
  pendingVoiceCommand = 0;
  lastVoiceCommandTime = 0;
  
  Serial.println("[AI_HOOKS] Ready");
}

void updateAIHooksState() {
  // Check for any state updates or pending operations
  // Currently a placeholder for future async operation handling
}

// ============================================================================
// EDGE IMPULSE - LEAF DISEASE DETECTION
// ============================================================================

bool captureLeafImageAndSendToEdgeImpulse() {
  if (!diseaseDetectionEnabled) {
    return false;
  }
  
  Serial.println("[DISEASE_DETECTION] Capturing image...");
  
  // TODO: Implement camera image capture
  // 1. Initialize camera (OV2640 via SD_MMC or parallel pins)
  // 2. Capture frame buffer
  // 3. JPEG compress (reduce size for API transmission)
  //
  // Code outline:
  //   camera_config_t config;
  //   config.ledc_channel = LEDC_CHANNEL_0;
  //   config.ledc_freq_hz = 20000000;
  //   config.pin_d0 = Y2_GPIO_NUM;
  //   // ... set other pins from config.h camera pin defines
  //   esp_camera_init(&config);
  //   camera_fb_t *fb = esp_camera_fb_get();
  //
  //   // TODO: Base64 encode frame buffer (fb->buf)
  //   // char base64_image[6000];  // Size depends on resolution
  //   // base64_encode(fb->buf, fb->len, base64_image);
  //   // esp_camera_fb_return(fb);
  
  // TODO: Send to Edge Impulse API
  //   HTTPClient http;
  //   http.begin(EDGE_IMPULSE_INFERENCE_URL);
  //   http.addHeader("Content-Type", "application/json");
  //   http.addHeader("x-api-key", EDGE_IMPULSE_API_KEY);
  //
  //   String payload = "{\"images\": [{\"data\": \"data:image/jpeg;base64," + 
  //                    String(base64_image) + "\"}]}";
  //   int httpCode = http.POST(payload);
  //
  //   // TODO: Parse JSON response
  //   //   Response format: {"result": {"classification": {"Healthy": 0.9, "Powdery": 0.05, ...}}}
  //   //   Find class with highest confidence
  //   //   Update lastDetectedDisease and lastDiseaseConfidence
  //
  //   http.end();
  
  Serial.println("[DISEASE_DETECTION] Capture stub - TODO: Implement actual image capture");
  
  lastDiseaseDetectionTime = millis();
  strcpy(lastDetectedDisease, "Test_Disease");
  lastDiseaseConfidence = 0.75;  // Dummy value for testing
  
  return true;
}

bool getLastDiseaseDetectionResult(char* disease_name, float& confidence) {
  if (lastDiseaseDetectionTime == 0) {
    return false;
  }
  
  strcpy(disease_name, lastDetectedDisease);
  confidence = lastDiseaseConfidence;
  return true;
}

unsigned long getLastDiseaseDetectionTime() {
  return lastDiseaseDetectionTime;
}

// ============================================================================
// GOOGLE GEMINI - PLANT CARE ADVICE
// ============================================================================

bool buildGeminiAdviceRequestJsonFromLatestSensors(char* json_payload, size_t max_length) {
  // Read current sensor values
  float moisture = readSoilMoisturePercent();
  float pH = readPH();
  float light = readLightLevelPercent();
  float temp, humidity;
  bool tempValid = readDHT(temp, humidity);
  
  unsigned long lastWateringMs = getLastWateringTime();
  unsigned long minutesAgo = (lastWateringMs == 0) ? 999 : (millis() - lastWateringMs) / 60000;
  
  // Build JSON payload
  snprintf(json_payload, max_length,
    "{"
    "\"timestamp\": %lu,"
    "\"location\": \"Sambalpur, Odisha\","
    "\"sensors\": {"
    "\"soil_moisture_percent\": %.1f,"
    "\"soil_pH\": %.2f,"
    "\"temperature_celsius\": %.1f,"
    "\"relative_humidity_percent\": %.1f,"
    "\"light_level_percent\": %.1f,"
    "\"last_watering_minutes_ago\": %lu"
    "},"
    "\"history\": {"
    "\"watering_cycles_today\": %u,"
    "\"water_volume_ml_today\": %.0f"
    "}"
    "}",
    millis() / 1000,
    moisture,
    pH,
    tempValid ? temp : 0.0,
    tempValid ? humidity : 0.0,
    light,
    minutesAgo,
    (unsigned)getWateringCyclesThisHour(),
    getTotalVolumeDispensedToday()
  );
  
  return true;
}

bool requestGeminiAdvice() {
  if (!geminiAdviceEnabled) {
    return false;
  }
  
  // Build JSON payload with sensor data
  char json_payload[512];
  if (!buildGeminiAdviceRequestJsonFromLatestSensors(json_payload, sizeof(json_payload))) {
    return false;
  }
  
  Serial.println("[GEMINI] Requesting advice...");
  
  // TODO: Send HTTPS POST request to Gemini API
  // 
  // Code outline:
  //   HTTPClient http;
  //   http.setConnectTimeout(5000);
  //   http.setTimeout(10000);
  //
  //   String url = String(GEMINI_API_ENDPOINT) + GEMINI_MODEL + ":generateContent";
  //   url += String("?key=") + GEMINI_API_KEY;
  //
  //   http.begin(url);
  //   http.addHeader("Content-Type", "application/json");
  //
  //   // Construct request with sensor data as context
  //   String request = "{\"contents\": [{\"parts\": [{"
  //     "\"text\": \"Based on these plant sensor readings, provide 2-3 specific care "
  //     "recommendations in 1-2 sentences:\\n" + String(json_payload) + "\"";
  //   request += "}]}]}";
  //
  //   int httpCode = http.POST(request);
  //
  //   if (httpCode == 200) {
  //     String response = http.getString();
  //     // TODO: Parse JSON and extract text content
  //     // Response structure: {"candidates":[{"content":{"parts":[{"text":"advice here"}]}}]}
  //     // Extract text and store in lastGeminiAdvice
  //   }
  //
  //   http.end();
  
  Serial.println("[GEMINI] Request stub - TODO: Implement actual API call");
  
  // Dummy advice for testing
  strcpy(lastGeminiAdvice, 
    "[STUB] Your plant looks good! Maintain moisture levels around 40-50% "
    "and provide 6-8 hours of indirect light daily.");
  
  lastGeminiRequestTime = millis();
  return true;
}

bool getLastGeminiAdvice(char* advice_text, size_t max_length) {
  if (lastGeminiRequestTime == 0) {
    return false;
  }
  
  strncpy(advice_text, lastGeminiAdvice, max_length - 1);
  advice_text[max_length - 1] = '\0';
  return true;
}

unsigned long getLastGeminiAdviceTime() {
  return lastGeminiRequestTime;
}

bool isGeminiAdviceDue(unsigned long interval_minutes) {
  if (lastGeminiRequestTime == 0) {
    return true;  // First time, should request
  }
  
  unsigned long elapsedMinutes = (millis() - lastGeminiRequestTime) / 60000;
  return (elapsedMinutes >= interval_minutes);
}

// ============================================================================
// GOOGLE ASSISTANT - VOICE CONTROL VIA IFTTT
// ============================================================================

void handleVoiceCommandWaterPlant() {
  if (!voiceControlEnabled) {
    return;
  }
  
  Serial.println("[VOICE_CONTROL] 'Water my plant' command received");
  
  // TODO: Implement voice command trigger mechanism
  // Option A: Simple HTTP server on ESP32
  //   Set up a tiny web server on port 8080 that listens for GET /api/water
  //   Configure IFTTT Maker Webhooks to call this endpoint
  //
  // Option B: Use Blynk virtual pin
  //   Have IFTTT trigger a virtual pin update via Blynk API
  //   Read in BLYNK_WRITE(VPIN_VOICE_COMMAND) handler
  //
  // Sample IFTTT trigger:
  //   IF: "Alexa/Google" recognize "water my plant"
  //   THEN: Make a webhook POST/GET to http://{device_ip}:8080/api/water
  //
  // This function would be called from the HTTP handler or BLYNK_WRITE
  
  manualPumpOn();
  
  // Set auto-off after default time or flow target
  // (depends on implementation in watering.cpp)
  
  Serial.println("[VOICE_CONTROL] Manual pump activated");
}

void handleVoiceCommandCheckPlant() {
  if (!voiceControlEnabled) {
    return;
  }
  
  Serial.println("[VOICE_CONTROL] 'Check my plant' command received");
  
  // TODO: Implement status response mechanism
  // 
  // Option A: Send email/SMS via IFTTT applet
  //   Parse sensor data into a readable message
  //   Send via IFTTT Email action
  //
  // Option B: Use Blynk notification
  //   Format latest readings
  //   Send as Blynk push notification
  //
  // Example message:
  //   "Your plant status: Moisture 45%, pH 6.5, Temperature 28°C
  //    Last watered 2 hours ago. Status: Good growth conditions!"
  
  float moisture = readSoilMoisturePercent();
  float pH = readPH();
  float temp, humidity;
  bool tempValid = readDHT(temp, humidity);
  
  char statusMessage[256];
  snprintf(statusMessage, sizeof(statusMessage),
    "Plant Status: Moisture %.0f%%, pH %.1f, Temp %.0f°C, Humidity %.0f%%",
    moisture, pH, tempValid ? temp : 0, tempValid ? humidity : 0);
  
  Serial.print("[VOICE_RESPONSE] ");
  Serial.println(statusMessage);
  
  // TODO: Send statusMessage via configured response method
}

bool isPendingVoiceCommand() {
  return (pendingVoiceCommand != 0);
}

int getPendingVoiceCommandType() {
  return pendingVoiceCommand;
}

void clearPendingVoiceCommand() {
  pendingVoiceCommand = 0;
}

// ============================================================================
// AI FEATURE MANAGEMENT
// ============================================================================

bool shouldRunDiseaseDetection() {
  // Run once every 24 hours or when manually triggered
  if (lastDiseaseDetectionTime == 0) {
    return true;  // First time
  }
  
  unsigned long elapsedHours = (millis() - lastDiseaseDetectionTime) / (60 * 60 * 1000);
  return (elapsedHours >= 24);
}

void setDiseaseDetectionEnabled(bool enabled) {
  diseaseDetectionEnabled = enabled;
  Serial.print("[AI_HOOKS] Disease detection ");
  Serial.println(enabled ? "ENABLED" : "DISABLED");
}

void setGeminiAdviceEnabled(bool enabled) {
  geminiAdviceEnabled = enabled;
  Serial.print("[AI_HOOKS] Gemini advice ");
  Serial.println(enabled ? "ENABLED" : "DISABLED");
}

void setVoiceControlEnabled(bool enabled) {
  voiceControlEnabled = enabled;
  Serial.print("[AI_HOOKS] Voice control ");
  Serial.println(enabled ? "ENABLED" : "DISABLED");
}
