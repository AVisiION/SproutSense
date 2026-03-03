/*!
 * @file network.cpp
 * @brief SproutSense Network & IoT Implementation
 * 
 * Implements:
 * - Wi-Fi auto-connection with reconnection logic
 * - Blynk IoT virtual pin handlers
 * - Sensor data publishing
 * - Alert notifications
 * - Weather API stubs
 */

#include "network.h"
#include "config.h"
#include "sensors.h"
#include "watering.h"
#include <WiFi.h>
#include <BlynkSimpleWiFi.h>

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

unsigned long lastBlynkSyncTime = 0;
unsigned long systemStartTime = 0;
bool wifiConnected = false;
bool blynkConnected = false;

const char* lastWeatherDesc = "Unknown";
float lastWeatherTemp = 0.0;

// Connection attempt tracking
unsigned long lastWiFiAttemptTime = 0;
const unsigned long WIFI_RECONNECT_INTERVAL = 30000;  // Try every 30 sec

// ============================================================================
// BLYNK EVENT HANDLERS
// ============================================================================

/**
 * @brief Called when Blynk is successfully connected
 */
BLYNK_CONNECTED() {
  Serial.println("[BLYNK] Connected!");
  blynkConnected = true;
  
  // Sync virtual pin values with device
  Blynk.syncVirtual(VPIN_PUMP_CONTROL);
}

/**
 * @brief Blynk Virtual Pin 6 - Manual Pump Control
 * Button widget: sends 1 (ON) or 0 (OFF)
 */
BLYNK_WRITE(VPIN_PUMP_CONTROL) {
  int pumpValue = param.asInt();
  
  if (pumpValue == 1) {
    manualPumpOn();
    Serial.println("[BLYNK] Manual pump ON");
  } else {
    manualPumpOff();
    Serial.println("[BLYNK] Manual pump OFF");
  }
}

/**
 * @brief Blynk Virtual Pin 7 - Camera Snapshot Request
 */
BLYNK_WRITE(VPIN_CAMERA_SNAPSHOT) {
  int snapshotRequest = param.asInt();
  
  if (snapshotRequest == 1) {
    Serial.println("[BLYNK] Camera snapshot requested");
    // TODO: Call captureLeafImageAndSendToEdgeImpulse() from ai_hooks.cpp
    Blynk.virtualWrite(VPIN_CAMERA_SNAPSHOT, 0);  // Reset button
  }
}

/**
 * @brief Blynk Virtual Pin 8 - Watering Cycles Display (read-only)
 */
BLYNK_READ(VPIN_WATERING_COUNT) {
  uint8_t cyclesThisHour = getWateringCyclesThisHour();
  Blynk.virtualWrite(VPIN_WATERING_COUNT, (int)cyclesThisHour);
}

/**
 * @brief Blynk Virtual Pin 9 - Last Watering Time
 */
BLYNK_READ(VPIN_LAST_WATERING) {
  unsigned long lastWateringMs = getLastWateringTime();
  
  if (lastWateringMs == 0) {
    Blynk.virtualWrite(VPIN_LAST_WATERING, "Never");
  } else {
    unsigned long secondsAgo = (millis() - lastWateringMs) / 1000;
    unsigned long minutesAgo = secondsAgo / 60;
    unsigned long hoursAgo = minutesAgo / 60;
    
    if (hoursAgo > 0) {
      Blynk.setProperty(VPIN_LAST_WATERING, "label", "Last Watering");
      Blynk.virtualWrite(VPIN_LAST_WATERING, hoursAgo + " hours ago");
    } else if (minutesAgo > 0) {
      Blynk.virtualWrite(VPIN_LAST_WATERING, minutesAgo + " min ago");
    } else {
      Blynk.virtualWrite(VPIN_LAST_WATERING, secondsAgo + " sec ago");
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

void initializeNetwork() {
  systemStartTime = millis();
  lastBlynkSyncTime = millis();
  
  Serial.println("[NETWORK] Initializing...");
  
  // Set WiFi mode
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Configure Blynk
  Blynk.config(BLYNK_TEMPLATE_ID, BLYNK_TEMPLATE_NAME, BLYNK_AUTH_TOKEN);
  
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  
  // Wait briefly for initial connection (non-blocking in main loop)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WIFI] Connected!");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Connection timeout - will retry in loop");
  }
}

// ============================================================================
// NETWORK UPDATES (CALL FROM LOOP)
// ============================================================================

void updateNetworkStatus() {
  unsigned long now = millis();
  
  // Handle Wi-Fi connection state
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConnected) {
      wifiConnected = true;
      Serial.println("[WIFI] Connected!");
      Serial.print("[WIFI] IP: ");
      Serial.println(WiFi.localIP());
    }
  } else {
    if (wifiConnected) {
      wifiConnected = false;
      Serial.println("[WIFI] Disconnected!");
    }
    
    // Try to reconnect periodically
    if ((now - lastWiFiAttemptTime) > WIFI_RECONNECT_INTERVAL) {
      Serial.println("[WIFI] Attempting reconnection...");
      WiFi.disconnect();
      delay(100);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      lastWiFiAttemptTime = now;
    }
  }
  
  // Handle Blynk connection
  if (Blynk.connected()) {
    if (!blynkConnected) {
      blynkConnected = true;
      Serial.println("[BLYNK] Synced!");
    }
    Blynk.run();
  } else {
    if (blynkConnected) {
      blynkConnected = false;
      Serial.println("[BLYNK] Disconnected!");
    }
    
    // Try Blynk connection if WiFi is available
    if (wifiConnected) {
      Blynk.connect();
    }
  }
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

bool isWiFiConnected() {
  return (WiFi.status() == WL_CONNECTED);
}

bool isBlynkSynced() {
  return Blynk.connected();
}

int getWiFiSignalStrength() {
  if (!isWiFiConnected()) {
    return 0;
  }
  return WiFi.RSSI();  // dBm (-30 to -100)
}

const char* getConnectedSSID() {
  return WiFi.SSID().c_str();
}

// ============================================================================
// BLYNK DATA PUBLISHING
// ============================================================================

void publishSensorDataToBlynk() {
  if (!Blynk.connected()) {
    return;  // Skip if not synced
  }
  
  // Read all sensors
  float moisture = readSoilMoisturePercent();
  float pH = readPH();
  float light = readLightLevelPercent();
  float flowVolume = getCurrentCycleVolumeML();
  
  float temp = 0, humidity = 0;
  bool dhtValid = readDHT(temp, humidity);
  
  // Send to virtual pins
  if (moisture >= 0) {
    Blynk.virtualWrite(VPIN_SOIL_MOISTURE, (int)moisture);
  }
  
  Blynk.virtualWrite(VPIN_PH, pH);
  
  if (dhtValid) {
    Blynk.virtualWrite(VPIN_TEMPERATURE, temp);
    Blynk.virtualWrite(VPIN_HUMIDITY, (int)humidity);
  }
  
  if (light >= 0) {
    Blynk.virtualWrite(VPIN_LIGHT_LEVEL, (int)light);
  }
  
  Blynk.virtualWrite(VPIN_FLOW_VOLUME, (int)flowVolume);
  
  Serial.println("[BLYNK] Published sensor data");
}

void publishWateringStatusToBlynk() {
  if (!Blynk.connected()) {
    return;
  }
  
  uint8_t cyclesThisHour = getWateringCyclesThisHour();
  float volumeToday = getTotalVolumeDispensedToday();
  
  Blynk.virtualWrite(VPIN_WATERING_COUNT, (int)cyclesThisHour);
  
  // Could add a virtual display widget for volume
  Serial.print("[BLYNK] Watering status: ");
  Serial.print(cyclesThisHour);
  Serial.print(" cycles, ");
  Serial.print(volumeToday);
  Serial.println(" mL today");
}

void sendBlynkNotification(const char* title, const char* message) {
  if (!Blynk.connected()) {
    return;
  }
  
  // Construct notification
  String notification = String(title) + ": " + String(message);
  
  // Send to mobile via Blynk notification
  Blynk.notify(notification.c_str());
  
  Serial.print("[NOTIFICATION] ");
  Serial.println(notification);
}

void logSensorHistoryToBlynk(float moisture, float pH, float temp, float humidity, float light) {
  if (!Blynk.connected()) {
    return;
  }
  
  // Optional: Use a virtual pin as a timeline/chart widget
  // This could store historical data for 7-day viewing
  // Implementation depends on Blynk widget type selected
  
  // For now, just log to serial
  Serial.print("[HISTORY] Logged: M=");
  Serial.print(moisture);
  Serial.print("% pH=");
  Serial.print(pH);
  Serial.print(" T=");
  Serial.print(temp);
  Serial.print("°C H=");
  Serial.print(humidity);
  Serial.print("% L=");
  Serial.println(light);
}

// ============================================================================
// TIMING
// ============================================================================

bool isBlynkUpdateDue() {
  unsigned long now = millis();
  unsigned long elapsed = now - lastBlynkSyncTime;
  return (elapsed >= BLYNK_UPDATE_INTERVAL_MS);
}

void updateBlynkSyncTime() {
  lastBlynkSyncTime = millis();
}

unsigned long getTimeSinceLastBlynkUpdate() {
  return millis() - lastBlynkSyncTime;
}

// ============================================================================
// WEATHER API STUBS
// ============================================================================

bool fetchWeatherAndUpdateRainFlag() {
  // TODO: Implement OpenWeatherMap API call
  //
  // This stub currently does nothing.
  // When implemented:
  // 1. Make HTTPS request to: api.openweathermap.org/data/2.5/forecast
  // 2. Include query: q={LOCATION_NAME}&appid={OPENWEATHER_API_KEY}
  // 3. Parse JSON response
  // 4. Check list[0:8] (first 8 entries = 24 hours) for precipitation
  // 5. Update rainExpectedFlag in watering.cpp if pop > 0.5
  // 6. Return true on success, false on failure
  
  Serial.println("[WEATHER] Fetching weather forecast... (stub - not implemented)");
  return false;
}

const char* getLastWeatherDescription() {
  return lastWeatherDesc;
}

float getWeatherTemperature() {
  return lastWeatherTemp;
}

// ============================================================================
// ERROR HANDLING & DIAGNOSTICS
// ============================================================================

void handleNetworkDisconnection() {
  Serial.println("[NETWORK] Disconnection detected - attempting recovery");
  
  if (!isWiFiConnected()) {
    WiFi.disconnect();
    delay(100);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

unsigned long getUptimeSeconds() {
  return (millis() - systemStartTime) / 1000;
}

void printNetworkStatus() {
  Serial.println("\n===== NETWORK STATUS =====");
  
  Serial.print("Wi-Fi: ");
  if (isWiFiConnected()) {
    Serial.print("CONNECTED (");
    Serial.print(WiFi.SSID());
    Serial.print(") IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("  Signal: ");
    Serial.print(getWiFiSignalStrength());
    Serial.println(" dBm");
  } else {
    Serial.println("DISCONNECTED");
  }
  
  Serial.print("Blynk: ");
  Serial.println(isBlynkSynced() ? "SYNCED" : "DISCONNECTED");
  
  Serial.print("Uptime: ");
  unsigned long uptime = getUptimeSeconds();
  Serial.print(uptime / 3600);
  Serial.print(" hours, ");
  Serial.print((uptime % 3600) / 60);
  Serial.println(" minutes");
  
  Serial.println("===========================\n");
}
