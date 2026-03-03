/*!
 * @file watering.cpp
 * @brief SproutSense Watering System FSM Implementation
 * 
 * Finite State Machine for plant watering with:
 * - Automatic trigger on low soil moisture
 * - Weather-based skip conditions
 * - Rate limiting (max 3 cycles per hour)
 * - Flow-based volume control
 * - Safety timeouts and relay protection
 */

#include "watering.h"
#include "config.h"
#include "sensors.h"

// ============================================================================
// STATE MACHINE VARIABLES
// ============================================================================

WateringState currentState = WATERING_IDLE;
WateringState previousState = WATERING_IDLE;

// Timing
unsigned long lastWateringTime = 0;
unsigned long pumpStartTime = 0;
unsigned long cooldownStartTime = 0;
unsigned long lastWeatherUpdateTime = 0;
unsigned long stateChangeTime = 0;

// Watering cycle tracking (rolling hour window)
struct {
  uint8_t cycleCount = 0;
  unsigned long hourStartTime = 0;
} wateringHourTracker;

// Statistics
struct {
  float totalVolumeToday = 0.0;
  float totalVolumeThisWeek = 0.0;
  unsigned long dayStartTime = 0;
  unsigned long weekStartTime = 0;
} wateringStats;

// Weather state
bool rainExpectedFlag = false;

// Manual override flag
bool manualPumpOverride = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

void initializeWatering() {
  pinMode(PIN_RELAY_CH1, OUTPUT);
  digitalWrite(PIN_RELAY_CH1, LOW);  // Pump OFF at startup
  
  currentState = WATERING_IDLE;
  previousState = WATERING_IDLE;
  stateChangeTime = millis();
  
  lastWateringTime = 0;
  pumpStartTime = 0;
  cooldownStartTime = 0;
  lastWeatherUpdateTime = millis();
  
  wateringHourTracker.cycleCount = 0;
  wateringHourTracker.hourStartTime = millis();
  
  wateringStats.dayStartTime = millis();
  wateringStats.weekStartTime = millis();
  wateringStats.totalVolumeToday = 0.0;
  wateringStats.totalVolumeThisWeek = 0.0;
  
  rainExpectedFlag = false;
  manualPumpOverride = false;
  
  Serial.println("[WATERING] System initialized");
}

// ============================================================================
// STATE MACHINE LOGIC (NON-BLOCKING)
// ============================================================================

void updateWateringLogic() {
  unsigned long now = millis();
  
  // State transition logic
  switch (currentState) {
    
    // -------- IDLE STATE --------
    case WATERING_IDLE: {
      // Check if we should transition to CHECK_CONDITIONS
      float moisture = readSoilMoisturePercent();
      
      if (manualPumpOverride) {
        // Manual override triggered - go directly to watering
        currentState = WATERING_WATERING;
        stateChangeTime = now;
        pumpStartTime = now;
        resetFlowSensorCounter();
        relayPumpOn();
        
        Serial.println("[WATERING] Manual pump ON requested");
        break;
      }
      
      if (moisture >= 0 && moisture < MOISTURE_THRESHOLD_PERCENT) {
        // Moisture too low - check conditions before watering
        currentState = WATERING_CHECK_CONDITIONS;
        stateChangeTime = now;
        Serial.println("[WATERING] Transition: IDLE -> CHECK_CONDITIONS");
      }
      break;
    }
    
    // -------- CHECK_CONDITIONS STATE --------
    case WATERING_CHECK_CONDITIONS: {
      // This is a quick state - evaluate conditions and move to next state
      
      // Check 1: Is watering already in cooldown?
      if ((now - cooldownStartTime) < WATERING_COOLDOWN_MS && cooldownStartTime != 0) {
        // Still in cooldown - go back to IDLE
        currentState = WATERING_IDLE;
        stateChangeTime = now;
        Serial.println("[WATERING] Still in cooldown - returning to IDLE");
        break;
      }
      
      // Check 2: Have we exceeded max cycles per hour?
      if ((now - wateringHourTracker.hourStartTime) >= (60 * 60 * 1000)) {
        // Hour elapsed - reset counter
        wateringHourTracker.cycleCount = 0;
        wateringHourTracker.hourStartTime = now;
      }
      
      if (wateringHourTracker.cycleCount >= MAX_WATERING_CYCLES_PER_HOUR) {
        currentState = WATERING_IDLE;
        stateChangeTime = now;
        Serial.println("[WATERING] Max cycles/hour reached - returning to IDLE");
        break;
      }
      
      // Check 3: Is rain expected? (OpenWeatherMap stub)
      if (getRainExpected()) {
        currentState = WATERING_IDLE;
        stateChangeTime = now;
        Serial.println("[WATERING] Rain expected - skipping watering");
        break;
      }
      
      // Check 4: All good - begin watering
      currentState = WATERING_WATERING;
      stateChangeTime = now;
      pumpStartTime = now;
      resetFlowSensorCounter();
      relayPumpOn();
      wateringHourTracker.cycleCount++;
      
      Serial.print("[WATERING] Starting watering cycle #");
      Serial.print(wateringHourTracker.cycleCount);
      Serial.println(" this hour");
      break;
    }
    
    // -------- WATERING STATE --------
    case WATERING_WATERING: {
      unsigned long pumpRunTime = now - pumpStartTime;
      float currentVolume = getCurrentCycleVolumeML();
      
      // Check exit conditions
      bool targetReached = (currentVolume >= TARGET_WATER_VOLUME_ML);
      bool timeoutReached = (pumpRunTime >= PUMP_MAX_RUNTIME_MS);
      bool manualStop = !manualPumpOverride && false;  // No manual stop yet
      
      if (targetReached) {
        // Target volume reached - stop pump and enter cooldown
        relayPumpOff();
        manualPumpOverride = false;
        
        float actualVolume = getCurrentCycleVolumeML();
        wateringStats.totalVolumeToday += actualVolume;
        wateringStats.totalVolumeThisWeek += actualVolume;
        lastWateringTime = now;
        
        currentState = WATERING_COOLDOWN;
        cooldownStartTime = now;
        stateChangeTime = now;
        
        Serial.print("[WATERING] Target reached: ");
        Serial.print(actualVolume);
        Serial.println(" mL - entering cooldown");
        
      } else if (timeoutReached) {
        // Safety timeout - stop pump immediately
        relayPumpOff();
        manualPumpOverride = false;
        
        float actualVolume = getCurrentCycleVolumeML();
        wateringStats.totalVolumeToday += actualVolume;
        wateringStats.totalVolumeThisWeek += actualVolume;
        lastWateringTime = now;
        
        currentState = WATERING_COOLDOWN;
        cooldownStartTime = now;
        stateChangeTime = now;
        
        Serial.print("[WATERING] TIMEOUT after ");
        Serial.print(pumpRunTime);
        Serial.print("ms, dispensed ");
        Serial.print(actualVolume);
        Serial.println(" mL");
        
      } else {
        // Still watering - log progress
        static unsigned long lastProgressLog = 0;
        if ((now - lastProgressLog) > 5000) {  // Log every 5 seconds
          Serial.print("[WATERING] In progress: ");
          Serial.print(currentVolume);
          Serial.print(" / ");
          Serial.print(TARGET_WATER_VOLUME_ML);
          Serial.println(" mL");
          lastProgressLog = now;
        }
      }
      break;
    }
    
    // -------- COOLDOWN STATE --------
    case WATERING_COOLDOWN: {
      unsigned long cooldownElapsed = now - cooldownStartTime;
      
      if (cooldownElapsed >= WATERING_COOLDOWN_MS) {
        // Cooldown period expired - return to IDLE
        currentState = WATERING_IDLE;
        stateChangeTime = now;
        Serial.println("[WATERING] Cooldown complete - returning to IDLE");
      }
      break;
    }
    
    default:
      currentState = WATERING_IDLE;
      break;
  }
  
  // Update weather forecast if needed
  if ((now - lastWeatherUpdateTime) >= WEATHER_UPDATE_INTERVAL_MS) {
    updateWeatherForecast();
    lastWeatherUpdateTime = now;
  }
  
  // Check if day has rolled over (reset daily stats)
  if ((now - wateringStats.dayStartTime) >= (24 * 60 * 60 * 1000)) {
    wateringStats.totalVolumeToday = 0.0;
    wateringStats.dayStartTime = now;
    Serial.println("[WATERING] Daily stats reset");
  }
  
  // Log state changes
  if (currentState != previousState) {
    previousState = currentState;
    Serial.print("[WATERING] State changed to: ");
    Serial.println(getWateringStateString());
  }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

WateringState getCurrentWateringState() {
  return currentState;
}

const char* getWateringStateString() {
  switch (currentState) {
    case WATERING_IDLE:
      return "IDLE";
    case WATERING_CHECK_CONDITIONS:
      return "CHECK_CONDITIONS";
    case WATERING_WATERING:
      return "WATERING";
    case WATERING_COOLDOWN:
      return "COOLDOWN";
    default:
      return "UNKNOWN";
  }
}

// ============================================================================
// MANUAL CONTROL
// ============================================================================

void manualPumpOn() {
  manualPumpOverride = true;
  if (currentState == WATERING_IDLE) {
    currentState = WATERING_WATERING;
    stateChangeTime = millis();
    pumpStartTime = millis();
    resetFlowSensorCounter();
    relayPumpOn();
    Serial.println("[MANUAL] Pump started via override");
  }
}

void manualPumpOff() {
  manualPumpOverride = false;
  if (currentState == WATERING_WATERING) {
    relayPumpOff();
    float volume = getCurrentCycleVolumeML();
    wateringStats.totalVolumeToday += volume;
    wateringStats.totalVolumeThisWeek += volume;
    lastWateringTime = millis();
    currentState = WATERING_COOLDOWN;
    cooldownStartTime = millis();
    Serial.print("[MANUAL] Pump stopped. Dispensed: ");
    Serial.print(volume);
    Serial.println(" mL");
  }
}

bool isPumpRunning() {
  // Check relay state
  return digitalRead(PIN_RELAY_CH1) == HIGH;
}

void relayPumpOff() {
  digitalWrite(PIN_RELAY_CH1, LOW);
}

void relayPumpOn() {
  digitalWrite(PIN_RELAY_CH1, HIGH);
}

float getCurrentWateringVolumeML() {
  return getCurrentCycleVolumeML();
}

unsigned long getLastWateringTime() {
  return lastWateringTime;
}

// ============================================================================
// STATISTICS
// ============================================================================

uint8_t getWateringCyclesThisHour() {
  unsigned long now = millis();
  
  // Reset counter if hour has passed
  if ((now - wateringHourTracker.hourStartTime) >= (60 * 60 * 1000)) {
    wateringHourTracker.cycleCount = 0;
    wateringHourTracker.hourStartTime = now;
  }
  
  return wateringHourTracker.cycleCount;
}

float getTotalVolumeDispensedToday() {
  return wateringStats.totalVolumeToday;
}

float getTotalVolumeDispensedThisWeek() {
  unsigned long now = millis();
  
  // Reset if 7 days have passed
  if ((now - wateringStats.weekStartTime) >= (7 * 24 * 60 * 60 * 1000)) {
    wateringStats.totalVolumeThisWeek = 0.0;
    wateringStats.weekStartTime = now;
  }
  
  return wateringStats.totalVolumeThisWeek;
}

void resetDailyWateringStats() {
  wateringStats.totalVolumeToday = 0.0;
  wateringStats.dayStartTime = millis();
  Serial.println("[WATERING] Manual daily stats reset");
}

// ============================================================================
// WEATHER & CONDITIONS
// ============================================================================

bool getRainExpected() {
  // TODO: Integrate with OpenWeatherMap API
  // 
  // Steps:
  // 1. Make HTTPS GET request to:
  //    https://api.openweathermap.org/data/2.5/forecast?q={LOCATION_NAME}&appid={OPENWEATHER_API_KEY}
  // 2. Parse JSON response
  // 3. Check "list[0:8]" (next 24 hours) for precipitation probability
  // 4. If any entry has "pop" (probability of precipitation) > 0.5, return true
  // 5. Also check "rain" or "snow" fields for actual precipitation amounts
  //
  // For now, return false (always water if conditions met)
  
  return rainExpectedFlag;
}

void updateWeatherForecast() {
  // TODO: Fetch weather from OpenWeatherMap
  // This is a stub function - implement later
  // For now, just log that we're checking
  
  Serial.println("[WEATHER] Fetching forecast... (stub)");
  // rainExpectedFlag = /* fetch from API */;
  
  // Stub: never predict rain
  rainExpectedFlag = false;
}

unsigned long getLastWeatherUpdateTime() {
  return lastWeatherUpdateTime;
}

void forceWeatherUpdate() {
  lastWeatherUpdateTime = millis() - WEATHER_UPDATE_INTERVAL_MS;  // Force next check
  Serial.println("[WEATHER] Forced weather update scheduled");
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

void printWateringStatus() {
  Serial.println("\n===== WATERING STATUS =====");
  
  Serial.print("State: ");
  Serial.println(getWateringStateString());
  
  Serial.print("Pump Running: ");
  Serial.println(isPumpRunning() ? "YES" : "NO");
  
  Serial.print("Current Cycle Volume: ");
  Serial.print(getCurrentCycleVolumeML());
  Serial.println(" mL");
  
  Serial.print("Cycles this hour: ");
  Serial.print(getWateringCyclesThisHour());
  Serial.print(" / ");
  Serial.println(MAX_WATERING_CYCLES_PER_HOUR);
  
  Serial.print("Volume today: ");
  Serial.print(getTotalVolumeDispensedToday());
  Serial.println(" mL");
  
  Serial.print("Volume this week: ");
  Serial.print(getTotalVolumeDispensedThisWeek());
  Serial.println(" mL");
  
  Serial.print("Last watering: ");
  if (lastWateringTime == 0) {
    Serial.println("Never");
  } else {
    Serial.print((millis() - lastWateringTime) / 1000);
    Serial.println(" seconds ago");
  }
  
  Serial.print("Rain expected: ");
  Serial.println(getRainExpected() ? "YES" : "NO");
  
  Serial.println("===========================\n");
}

void testRelayModule() {
  Serial.println("[RELAY TEST] Starting relay test...");
  
  Serial.println("  [1] Turning ON...");
  relayPumpOn();
  delay(2000);
  
  Serial.println("  [2] Turning OFF...");
  relayPumpOff();
  delay(1000);
  
  Serial.println("[RELAY TEST] Complete");
}
