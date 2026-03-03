/*!
 * ███████████████████████████████████████████████████████████████████████████
 * █                                                                         █
 * █  SPROTSENSE - Smart Plant Care System                                  █
 * █  ESP32-CAM Based IoT Irrigation Controller                             █
 * █                                                                         █
 * █  Main Sketch: src/main.cpp                                             █
 * █  ================================================================      █
 * █  Features:                                                              █
 * █    ✓ 5 sensor types (moisture, pH, temperature, humidity, light)      █
 * █    ✓ Automated watering with safety rules                             █
 * █    ✓ Real-time monitoring via Blynk IoT                               █
 * █    ✓ Weather-aware watering (OpenWeatherMap)                          █
 * █    ✓ Rate limiting (max 3 cycles/hour)                                █
 * █    ✓ Flow sensor volume control (100 mL target)                       █
 * █    ✓ Disease detection hooks (Edge Impulse)                           █
 * █    ✓ AI advice stubs (Google Gemini)                                  █
 * █    ✓ Voice control hooks (IFTTT)                                      █
 * █    ✓ Non-blocking code using millis()                                 █
 * █    ✓ 97%+ uptime target with auto-reconnection                        █
 * █                                                                         █
 * █  Hardware: ESP32-CAM-MB, DHT22, ZS-09 pH, Capacitive Moisture,       █
 * █            LDR, Water Pump (DC 3-6V), Relay Module (5V, 2ch)         █
 * █                                                                         █
 * █  Getting Started:                                                       █
 * █    1. Copy secrets.h.example → secrets.h                              █
 * █    2. Fill in Wi-Fi, Blynk, and API credentials                       █
 * █    3. Upload to ESP32-CAM-MB (Partition: Huge APP)                    █
 * █    4. Open Serial Monitor (115200 baud)                               █
 * █    5. Download Blynk app and add your device                          █
 * █                                                                         █
 * ███████████████████████████████████████████████████████████████████████████
 */

// ============================================================================
// INCLUDES
// ============================================================================

#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "watering.h"
#include "network.h"
#include "ai_hooks.h"

// ============================================================================
// TIMING VARIABLES (NON-BLOCKING MILLIS TIMERS)
// ============================================================================

unsigned long lastSensorReadMs = 0;
unsigned long lastBlynkSyncMs = 0;
unsigned long lastHistoryLogMs = 0;
unsigned long lastWateringLogMs = 0;
unsigned long lastWeatherUpdateMs = 0;
unsigned long lastDiagnosticPrintMs = 0;
unsigned long lastGeminiAdviceMs = 0;

// ============================================================================
// HELPER FUNCTION DECLARATIONS
// ============================================================================

void printWelcomeBanner();
void handleDebugSerialInput();
void runDiagnosticTests();

// ============================================================================
// SETUP - INITIALIZATION
// ============================================================================

void setup() {
  // Serial communication
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);  // Allow serial to stabilize
  
  printWelcomeBanner();
  
  Serial.println("\n[SETUP] Starting initialization sequence...\n");
  
  // Initialize all subsystems
  Serial.println("[SETUP] Initializing sensors...");
  initializeSensors();
  
  Serial.println("[SETUP] Initializing flow sensor interrupt...");
  initializeFlowSensor();
  
  Serial.println("[SETUP] Initializing watering system...");
  initializeWatering();
  
  Serial.println("[SETUP] Initializing AI hooks...");
  initializeAIHooks();
  
  Serial.println("[SETUP] Initializing network (Wi-Fi + Blynk)...");
  initializeNetwork();
  
  // Initialize timing trackers
  lastSensorReadMs = millis();
  lastBlynkSyncMs = millis();
  lastHistoryLogMs = millis();
  lastWateringLogMs = millis();
  lastWeatherUpdateMs = millis();
  lastDiagnosticPrintMs = millis();
  lastGeminiAdviceMs = millis();
  
  // Run self-test
  Serial.println("\n[SETUP] Running sensor self-test...");
  performSensorSelfTest();
  
  Serial.println("\n[SETUP] Initialization complete! Starting main loop.\n");
  Serial.println("========== SYSTEM RUNNING ==========\n");
}

// ============================================================================
// MAIN LOOP - NON-BLOCKING WITH MILLIS() TIMING
// ============================================================================

void loop() {
  unsigned long now = millis();
  
  // ========== NETWORK UPDATES (CRITICAL - RUN ONCE PER LOOP) ==========
  updateNetworkStatus();
  
  // ========== SENSOR READING (EVERY 5 SECONDS) ==========
  if ((now - lastSensorReadMs) >= SENSOR_SAMPLING_INTERVAL_MS) {
    lastSensorReadMs = now;
    
    // Read sensors
    float moisture = readSoilMoisturePercent();
    float pH = readPH();
    float light = readLightLevelPercent();
    
    float temp = 0.0, humidity = 0.0;
    bool dhtValid = readDHT(temp, humidity);
    
    float flowRate = readFlowRateMlPerMin();
    
    // Log to serial (optional)
    if (isWiFiConnected()) {
      Serial.print("[SENSORS] M:");
      Serial.print((int)moisture);
      Serial.print("% pH:");
      Serial.print(pH, 1);
      Serial.print(" T:");
      Serial.print(dhtValid ? (int)temp : 0);
      Serial.print("C H:");
      Serial.print(dhtValid ? (int)humidity : 0);
      Serial.print("% L:");
      Serial.print((int)light);
      Serial.print("% Flow:");
      Serial.print(flowRate, 1);
      Serial.println(" ml/min");
    }
  }
  
  // ========== WATERING LOGIC UPDATE (NON-BLOCKING FSM) ==========
  updateWateringLogic();
  
  // ========== BLYNK DATA SYNC (EVERY 10 SECONDS) ==========
  if ((now - lastBlynkSyncMs) >= BLYNK_UPDATE_INTERVAL_MS) {
    lastBlynkSyncMs = now;
    
    if (isBlynkSynced()) {
      publishSensorDataToBlynk();
      publishWateringStatusToBlynk();
    }
  }
  
  // ========== SENSOR HISTORY LOGGING (EVERY 60 SECONDS) ==========
  if ((now - lastHistoryLogMs) >= HISTORY_LOG_INTERVAL_MS && ENABLE_HISTORY_LOGGING) {
    lastHistoryLogMs = now;
    
    float moisture = readSoilMoisturePercent();
    float pH = readPH();
    float temp, humidity;
    bool dhtValid = readDHT(temp, humidity);
    float light = readLightLevelPercent();
    
    logSensorHistoryToBlynk(moisture, pH, 
                           dhtValid ? temp : 0, 
                           dhtValid ? humidity : 0, 
                           light);
  }
  
  // ========== WEATHER FORECAST UPDATE (EVERY 30 MINUTES) ==========
  if ((now - lastWeatherUpdateMs) >= WEATHER_UPDATE_INTERVAL_MS) {
    lastWeatherUpdateMs = now;
    
    if (isWiFiConnected()) {
      Serial.println("[WEATHER] Fetching forecast...");
      fetchWeatherAndUpdateRainFlag();
    }
  }
  
  // ========== GEMINI AI ADVICE (EVERY HOUR) ==========
  if ((now - lastGeminiAdviceMs) >= (60 * 60 * 1000) && ENABLE_GEMINI_ADVICE) {
    lastGeminiAdviceMs = now;
    
    if (isBlynkSynced()) {
      Serial.println("[AI] Requesting Gemini plant advice...");
      if (requestGeminiAdvice()) {
        char advice[256];
        if (getLastGeminiAdvice(advice, sizeof(advice))) {
          Serial.print("[AI] Advice: ");
          Serial.println(advice);
          sendBlynkNotification("Plant Care Advice", advice);
        }
      }
    }
  }
  
  // ========== DISEASE DETECTION (ONCE EVERY 24 HOURS) ==========
  if (ENABLE_DISEASE_DETECTION && shouldRunDiseaseDetection()) {
    // This only triggers if 24 hours have passed
    // To avoid blocking the loop, we'd implement async image capture
    // For now, just log when it would run
    
    static unsigned long lastDiseaseCheckMs = 0;
    if ((now - lastDiseaseCheckMs) > (24 * 60 * 60 * 1000)) {
      lastDiseaseCheckMs = now;
      
      // TODO: Queue async image capture
      // captureLeafImageAndSendToEdgeImpulse();
      Serial.println("[AI] Disease detection would run (stub - not implemented)");
    }
  }
  
  // ========== VOICE COMMAND PROCESSING ==========
  if (ENABLE_VOICE_CONTROL && isPendingVoiceCommand()) {
    int cmdType = getPendingVoiceCommandType();
    
    if (cmdType == 1) {
      handleVoiceCommandWaterPlant();
    } else if (cmdType == 2) {
      handleVoiceCommandCheckPlant();
    }
    
    clearPendingVoiceCommand();
  }
  
  // ========== DIAGNOSTIC OUTPUT (EVERY 2 MINUTES) ==========
  if ((now - lastDiagnosticPrintMs) >= (2 * 60 * 1000)) {
    lastDiagnosticPrintMs = now;
    
    Serial.println("\n[DIAGNOSTICS] System Status:");
    printNetworkStatus();
    printAllSensorReadings();
    printWateringStatus();
  }
  
  // ========== DEBUG SERIAL INPUT HANDLER ==========
  if (Serial.available()) {
    handleDebugSerialInput();
  }
  
  // Let other tasks run (WiFi, BLE, etc.)
  yield();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

void printWelcomeBanner() {
  Serial.println("\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║         SPROTSENSE - Smart Plant Care System           ║");
  Serial.println("║           ESP32-CAM IoT Irrigation Controller           ║");
  Serial.println("║                                                        ║");
  Serial.println("║  Build Date: March 2, 2026                            ║");
  Serial.println("║  Version: 1.0.0 (BETA)                                ║");
  Serial.println("║  Uptime Target: 97%+                                  ║");
  Serial.println("║  Sensor Accuracy: ±5%                                 ║");
  Serial.println("║                                                        ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.println();
}

void handleDebugSerialInput() {
  char cmd = Serial.read();
  
  switch (cmd) {
    case 'h':
    case '?':
      Serial.println("\n[DEBUG] Available commands:");
      Serial.println("  h/? : Show this help");
      Serial.println("  s   : Show sensor readings");
      Serial.println("  c   : Show network/Blynk status");
      Serial.println("  w   : Show watering status");
      Serial.println("  p   : Manual pump ON");
      Serial.println("  q   : Manual pump OFF");
      Serial.println("  r   : Relay test (ON/OFF)");
      Serial.println("  t   : Run sensor self-test");
      Serial.println("  d   : Show diagnostics");
      Serial.println("  m   : Memory info");
      break;
      
    case 's':
      printAllSensorReadings();
      break;
      
    case 'c':
      printNetworkStatus();
      break;
      
    case 'w':
      printWateringStatus();
      break;
      
    case 'p':
      Serial.println("[DEBUG] Turning pump ON...");
      manualPumpOn();
      break;
      
    case 'q':
      Serial.println("[DEBUG] Turning pump OFF...");
      manualPumpOff();
      break;
      
    case 'r':
      testRelayModule();
      break;
      
    case 't':
      performSensorSelfTest();
      break;
      
    case 'd':
      Serial.println("[DEBUG] === Full System Diagnostics ===");
      printWelcomeBanner();
      printNetworkStatus();
      printAllSensorReadings();
      printWateringStatus();
      Serial.print("Uptime: ");
      Serial.print(getUptimeSeconds() / 3600);
      Serial.println(" hours");
      break;
      
    case 'm':
      Serial.print("Free RAM: ");
      Serial.print(ESP.getFreeHeap());
      Serial.println(" bytes");
      Serial.print("Min free: ");
      Serial.print(ESP.getMinFreeHeap());
      Serial.println(" bytes");
      Serial.print("Max free block: ");
      Serial.print(ESP.getMaxAllocHeap());
      Serial.println(" bytes");
      break;
      
    default:
      // Ignore unknown commands silently
      break;
  }
}

void runDiagnosticTests() {
  Serial.println("\n[DIAGNOSTICS] Starting full system test...\n");
  
  // Test sensors
  Serial.println("1. Sensor Self-Test:");
  performSensorSelfTest();
  
  delay(100);
  
  // Test relay
  Serial.println("\n2. Relay Test:");
  testRelayModule();
  
  delay(100);
  
  // Test network
  Serial.println("\n3. Network Test:");
  if (isWiFiConnected()) {
    Serial.println("  Wi-Fi: PASS");
  } else {
    Serial.println("  Wi-Fi: Waiting for connection...");
  }
  
  if (isBlynkSynced()) {
    Serial.println("  Blynk: PASS");
  } else {
    Serial.println("  Blynk: Not yet synced");
  }
  
  Serial.println("\n[DIAGNOSTICS] Test complete\n");
}

// ============================================================================
// ERROR HANDLING CALLBACKS (OPTIONAL)
// ============================================================================

// Handle fatal errors or watchdog triggers
void IRAM_ATTR onFatalError() {
  Serial.println("\n[ERROR] Fatal error detected!");
  Serial.println("[ERROR] Initiating recovery...");
  
  // Cut power to pump if running
  relayPumpOff();
  
  // Wait a bit
  delay(1000);
  
  // Restart
  ESP.restart();
}

// ============================================================================
// END OF MAIN SKETCH
// ============================================================================

/*
 * NOTES:
 * 
 * 1. NON-BLOCKING ARCHITECTURE:
 *    All timing uses millis() instead of delay()
 *    No blocking operations in main loop
 *    Ensures responsiveness and network connectivity
 * 
 * 2. SAFETY RULES:
 *    - Max 3 watering cycles per hour
 *    - Target 100 mL per cycle
 *    - 20-second pump timeout
 *    - Check weather before watering
 *    - Manual override via Blynk
 * 
 * 3. RELIABILITY:
 *    - Auto Wi-Fi reconnection
 *    - Blynk heartbeat monitoring
 *    - Uptime tracking (getUptimeSeconds())
 *    - 97%+ uptime target
 * 
 * 4. EXTENSIBILITY:
 *    - AI hooks ready for Edge Impulse, Gemini, IFTTT
 *    - Stub functions marked TODO for API implementation
 *    - Modular design allows easy feature addition
 * 
 * 5. DEBUGGING:
 *    - Serial commands (press 'h' in Serial Monitor)
 *    - Comprehensive diagnostics output
 *    - Uptime and memory tracking
 *    - Per-subsystem logging
 * 
 * 6. CALIBRATION:
 *    - pH sensor: 2-point calibration (modify in config.h or at runtime)
 *    - Moisture: Adjust dry/wet ADC constants based on your sensor
 *    - Flow sensor: Pulses per mL (typically 5.5 for YF-S401)
 */
