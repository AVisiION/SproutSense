/*!
 * @file sensors.cpp
 * @brief SproutSense Sensor Implementation
 * 
 * Implements non-blocking sensor reading with:
 * - Analog smoothing and averaging
 * - DHT22 communication protocol
 * - Flow sensor interrupt handler
 * - Error checking and timeout protection
 */

#include "sensors.h"
#include "config.h"
#include <DHT.h>
#include <vector>

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

DHT dht(PIN_DHT_SENSOR, DHT_SENSOR_TYPE);

// Timing
unsigned long lastSensorReadTime = 0;
unsigned long lastDHTReadTime = 0;

// Flow sensor volatile counters (updated in ISR)
volatile unsigned long flowPulseCount = 0;
unsigned long flowPulseCountSnapshot = 0;
unsigned long flowMeasurementStartTime = 0;
unsigned long currentCycleVolumeML = 0;

// Sensor reading buffers for averaging
std::vector<int16_t> moistureReadings;
std::vector<float> phReadings;
std::vector<int16_t> ldrReadings;

// pH calibration (can be updated at runtime)
struct {
  float voltage1;  // Voltage at pH1
  float pH1;       // pH value 1
  float voltage2;  // Voltage at pH2
  float pH2;       // pH value 2
} phCalibration;

// ============================================================================
// FLOW SENSOR ISR
// ============================================================================

/**
 * @brief Interrupt handler for water flow sensor pulses
 * Increments pulse counter on rising edge
 */
void IRAM_ATTR flowSensorISR() {
  flowPulseCount++;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

void initializeSensors() {
  // Initialize DHT sensor
  dht.begin();
  delay(100);  // Allow DHT to stabilize
  
  // Set up ADC properties for analog pins
  analogSetWidth(12);  // 12-bit ADC (0-4095)
  
  // Initialize pin modes
  pinMode(PIN_RELAY_CH1, OUTPUT);
  pinMode(PIN_RELAY_CH2, OUTPUT);
  digitalWrite(PIN_RELAY_CH1, LOW);  // Start with pump OFF
  digitalWrite(PIN_RELAY_CH2, LOW);
  
  /* ADC pins are automatically configured as inputs, no need to pinMode() */
  
  // Load default pH calibration from config
  phCalibration.voltage1 = PH_CALIBRATION_VOLTAGE_PH4;
  phCalibration.pH1 = PH_CALIBRATION_VALUE_PH4;
  phCalibration.voltage2 = PH_CALIBRATION_VOLTAGE_PH7;
  phCalibration.pH2 = PH_CALIBRATION_VALUE_PH7;
  
  // Clear sensor buffers
  moistureReadings.clear();
  phReadings.clear();
  ldrReadings.clear();
  
  lastSensorReadTime = millis();
  lastDHTReadTime = millis();
  
  Serial.println("[SENSORS] Initialization complete");
}

void initializeFlowSensor() {
  pinMode(PIN_FLOW_SENSOR, INPUT);
  
  // Attach interrupt on rising edge
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), flowSensorISR, RISING);
  
  flowPulseCount = 0;
  flowPulseCountSnapshot = 0;
  flowMeasurementStartTime = millis();
  
  Serial.println("[FLOW SENSOR] Interrupt handler attached");
}

// ============================================================================
// SOIL MOISTURE SENSOR
// ============================================================================

int16_t readSoilMoistureRaw() {
  int16_t raw = analogRead(PIN_SOIL_MOISTURE_ANALOG);
  
  // Validate reading
  if (raw < 0 || raw > 4095) {
    return -1;
  }
  
  return raw;
}

float readSoilMoisturePercent() {
  // Read and add to buffer
  int16_t rawValue = readSoilMoistureRaw();
  if (rawValue < 0) {
    return -1.0;  // Error
  }
  
  moistureReadings.push_back(rawValue);
  
  // Keep only the last MOISTURE_SAMPLE_COUNT readings
  if (moistureReadings.size() > MOISTURE_SAMPLE_COUNT) {
    moistureReadings.erase(moistureReadings.begin());
  }
  
  // Calculate average
  float sum = 0;
  for (int16_t reading : moistureReadings) {
    sum += reading;
  }
  float avgRaw = sum / moistureReadings.size();
  
  // Convert to percentage (capacitive sensor is inverted)
  // High ADC = dry, Low ADC = wet
  float percent = 100.0 * (MOISTURE_ADC_DRY - avgRaw) / (MOISTURE_ADC_DRY - MOISTURE_ADC_WET);
  
  // Clamp to 0-100%
  if (percent < 0.0) percent = 0.0;
  if (percent > 100.0) percent = 100.0;
  
  return percent;
}

// ============================================================================
// PH SENSOR
// ============================================================================

float readPHVoltage() {
  // Average multiple ADC reads for stability
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_PH_SENSOR_ANALOG);
    delayMicroseconds(100);
  }
  
  int16_t rawValue = sum / 5;
  
  // Convert ADC to voltage (3.3V / 4095)
  float voltage = (rawValue / 4095.0) * 3.3;
  
  return voltage;
}

float readPH() {
  float voltage = readPHVoltage();
  
  phReadings.push_back(voltage);
  
  // Keep only last PH_SAMPLE_COUNT readings
  if (phReadings.size() > PH_SAMPLE_COUNT) {
    phReadings.erase(phReadings.begin());
  }
  
  // Average voltage readings
  float avgVoltage = 0;
  for (float v : phReadings) {
    avgVoltage += v;
  }
  avgVoltage /= phReadings.size();
  
  // Linear interpolation between two calibration points
  // pH = pH1 + (V - V1) * (pH2 - pH1) / (V2 - V1)
  float pH = phCalibration.pH1 + 
             (avgVoltage - phCalibration.voltage1) * 
             (phCalibration.pH2 - phCalibration.pH1) / 
             (phCalibration.voltage2 - phCalibration.voltage1);
  
  return pH;
}

void storePhCalibration(float acidPH, float acidVoltage, float basicPH, float basicVoltage) {
  phCalibration.pH1 = acidPH;
  phCalibration.voltage1 = acidVoltage;
  phCalibration.pH2 = basicPH;
  phCalibration.voltage2 = basicVoltage;
  
  Serial.print("[PH CALIB] Updated: ");
  Serial.print(acidPH); Serial.print(" @ "); Serial.print(acidVoltage); Serial.print("V, ");
  Serial.print(basicPH); Serial.print(" @ "); Serial.print(basicVoltage); Serial.println("V");
}

// ============================================================================
// TEMPERATURE & HUMIDITY SENSOR
// ============================================================================

bool readDHT(float& temperatureC, float& humidity) {
  // Check if enough time has passed since last read
  unsigned long now = millis();
  if ((now - lastDHTReadTime) < DHT_READ_INTERVAL_MS) {
    return false;  // Too soon to read again
  }
  
  // Perform read with timeout
  float temp = dht.readTemperature();      // Celsius
  float hum = dht.readHumidity();
  
  // Check for valid readings (DHT returns 0 or NaN on error)
  if (isnan(temp) || isnan(hum)) {
    return false;  // Read failed
  }
  
  temperatureC = temp;
  humidity = hum;
  lastDHTReadTime = now;
  
  return true;  // Success
}

unsigned long getLastDHTReadTime() {
  return lastDHTReadTime;
}

// ============================================================================
// LIGHT SENSOR
// ============================================================================

int16_t readLightLevelRaw() {
  return analogRead(PIN_LDR_SENSOR_ANALOG);
}

float readLightLevelPercent() {
  int16_t rawValue = readLightLevelRaw();
  
  // Validate
  if (rawValue < 0 || rawValue > 4095) {
    return -1.0;
  }
  
  ldrReadings.push_back(rawValue);
  
  // Keep only last LDR_SAMPLE_COUNT readings
  if (ldrReadings.size() > LDR_SAMPLE_COUNT) {
    ldrReadings.erase(ldrReadings.begin());
  }
  
  // Average
  float sum = 0;
  for (int16_t r : ldrReadings) {
    sum += r;
  }
  float avgRaw = sum / ldrReadings.size();
  
  // Convert to percentage (higher voltage = more light)
  float percent = (avgRaw / 4095.0) * 100.0;
  
  return percent;
}

// ============================================================================
// WATER FLOW SENSOR
// ============================================================================

float readFlowRateMlPerMin() {
  unsigned long now = millis();
  unsigned long elapsed = now - flowMeasurementStartTime;
  
  if (elapsed < 1000) {
    // Need at least 1 second for meaningful rate calculation
    return 0.0;
  }
  
  // Calculate rate: (pulses / time_in_seconds) / pulses_per_ml * 60
  unsigned long pulsesDifference = flowPulseCount - flowPulseCountSnapshot;
  float timeInSeconds = elapsed / 1000.0;
  
  float flowRateMlMin = (pulsesDifference / FLOW_SENSOR_PULSES_PER_ML) / timeInSeconds * 60.0;
  
  // Reset measurement window
  flowPulseCountSnapshot = flowPulseCount;
  flowMeasurementStartTime = now;
  
  return flowRateMlMin;
}

float getCurrentCycleVolumeML() {
  // Volume = pulses / pulses_per_ml
  float volumeML = (float)flowPulseCount / FLOW_SENSOR_PULSES_PER_ML;
  return volumeML;
}

void resetFlowSensorCounter() {
  flowPulseCount = 0;
  flowPulseCountSnapshot = 0;
  flowMeasurementStartTime = millis();
  currentCycleVolumeML = 0;
}

unsigned long getFlowSensorPulseCount() {
  return flowPulseCount;
}

// ============================================================================
// SENSOR UPDATE & TIMING
// ============================================================================

bool isSensorReadDue() {
  unsigned long now = millis();
  unsigned long elapsed = now - lastSensorReadTime;
  return (elapsed >= SENSOR_SAMPLING_INTERVAL_MS);
}

void updateLastSensorReadTime() {
  lastSensorReadTime = millis();
}

unsigned long getTimeSinceLastSensorRead() {
  return millis() - lastSensorReadTime;
}

// ============================================================================
// DIAGNOSTIC FUNCTIONS
// ============================================================================

void printAllSensorReadings() {
  Serial.println("\n===== SENSOR READINGS =====");
  
  // Moisture
  float moisture = readSoilMoisturePercent();
  Serial.print("Soil Moisture: ");
  Serial.print(moisture);
  Serial.println(" %");
  
  // pH
  float pH = readPH();
  Serial.print("pH: ");
  Serial.println(pH, 2);
  
  // Temperature & Humidity
  float temp, hum;
  if (readDHT(temp, hum)) {
    Serial.print("Temperature: ");
    Serial.print(temp);
    Serial.println(" °C");
    Serial.print("Humidity: ");
    Serial.print(hum);
    Serial.println(" %");
  } else {
    Serial.println("DHT: No valid reading yet");
  }
  
  // Light
  float light = readLightLevelPercent();
  Serial.print("Light Level: ");
  Serial.print(light);
  Serial.println(" %");
  
  // Flow rate
  float flowRate = readFlowRateMlPerMin();
  Serial.print("Flow Rate: ");
  Serial.print(flowRate);
  Serial.println(" mL/min");
  Serial.print("Total Volume: ");
  Serial.print(getCurrentCycleVolumeML());
  Serial.println(" mL");
  
  Serial.println("===========================\n");
}

bool performSensorSelfTest() {
  Serial.println("[SELF-TEST] Starting sensor validation...");
  
  bool allGood = true;
  
  // Test moisture
  float moisture = readSoilMoisturePercent();
  if (moisture < 0 || moisture > 100) {
    Serial.println("  FAIL: Moisture sensor out of range");
    allGood = false;
  } else {
    Serial.print("  PASS: Moisture = ");
    Serial.print(moisture);
    Serial.println(" %");
  }
  
  // Test pH
  float pH = readPH();
  if (pH < 0 || pH > 14) {
    Serial.println("  FAIL: pH sensor out of range");
    allGood = false;
  } else {
    Serial.print("  PASS: pH = ");
    Serial.println(pH, 2);
  }
  
  // Test DHT
  float temp, hum;
  if (!readDHT(temp, hum)) {
    Serial.println("  FAIL: DHT sensor not responding");
    allGood = false;
  } else if (temp < -50 || temp > 150 || hum < 0 || hum > 100) {
    Serial.println("  FAIL: DHT readings out of valid range");
    allGood = false;
  } else {
    Serial.print("  PASS: Temp = ");
    Serial.print(temp);
    Serial.print("°C, Humidity = ");
    Serial.print(hum);
    Serial.println(" %");
  }
  
  // Test LDR
  float light = readLightLevelPercent();
  if (light < 0 || light > 100) {
    Serial.println("  FAIL: LDR sensor out of range");
    allGood = false;
  } else {
    Serial.print("  PASS: Light = ");
    Serial.print(light);
    Serial.println(" %");
  }
  
  Serial.print("[SELF-TEST] Result: ");
  Serial.println(allGood ? "SUCCESS" : "FAILED - Check connections!");
  
  return allGood;
}
