import wsService from './websocketService.js';
import SensorReading from '../models/SensorReading.js';

// Simulated sensor values that change over time
const sensorState = {
  soilMoisture: 65,
  temperature: 24,
  humidity: 58,
  light: 5000,
  pH: 6.8,
  flowRate: 0,
  flowVolume: 0,
  leafCount: 18
};

// Range for random variations
const sensorRanges = {
  soilMoisture: { min: 20, max: 85, changeRate: 0.5 },
  temperature: { min: 15, max: 35, changeRate: 0.2 },
  humidity: { min: 30, max: 80, changeRate: 0.3 },
  light: { min: 100, max: 30000, changeRate: 500 },
  pH: { min: 5.5, max: 7.5, changeRate: 0.05 },
  flowRate: { min: 0, max: 900, changeRate: 65 },
  leafCount: { min: 1, max: 400, changeRate: 1.5 }
};

// Helper function to keep value within bounds
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Helper function to generate random change
function getRandomWalk(current, min, max, changeRate) {
  const change = (Math.random() - 0.5) * changeRate * 2;
  return clamp(current + change, min, max);
}

// Generate realistic sensor data with slight variations
export function generateTestSensorData() {
  sensorState.soilMoisture = getRandomWalk(
    sensorState.soilMoisture,
    sensorRanges.soilMoisture.min,
    sensorRanges.soilMoisture.max,
    sensorRanges.soilMoisture.changeRate
  );

  sensorState.temperature = getRandomWalk(
    sensorState.temperature,
    sensorRanges.temperature.min,
    sensorRanges.temperature.max,
    sensorRanges.temperature.changeRate
  );

  sensorState.humidity = getRandomWalk(
    sensorState.humidity,
    sensorRanges.humidity.min,
    sensorRanges.humidity.max,
    sensorRanges.humidity.changeRate
  );

  sensorState.light = getRandomWalk(
    sensorState.light,
    sensorRanges.light.min,
    sensorRanges.light.max,
    sensorRanges.light.changeRate
  );

  sensorState.pH = getRandomWalk(
    sensorState.pH,
    sensorRanges.pH.min,
    sensorRanges.pH.max,
    sensorRanges.pH.changeRate
  );

  sensorState.flowRate = getRandomWalk(
    sensorState.flowRate,
    sensorRanges.flowRate.min,
    sensorRanges.flowRate.max,
    sensorRanges.flowRate.changeRate
  );

  sensorState.leafCount = getRandomWalk(
    sensorState.leafCount,
    sensorRanges.leafCount.min,
    sensorRanges.leafCount.max,
    sensorRanges.leafCount.changeRate
  );

  // Integrate flow over one simulation step to estimate dispensed volume.
  const intervalSeconds = 5;
  sensorState.flowVolume = Math.max(0, sensorState.flowVolume + (sensorState.flowRate / 60) * intervalSeconds);

  // Round values appropriately
  return {
    soilMoisture: Math.round(sensorState.soilMoisture * 10) / 10,
    temperature: Math.round(sensorState.temperature * 10) / 10,
    humidity: Math.round(sensorState.humidity * 10) / 10,
    light: Math.round(sensorState.light),
    pH: Math.round(sensorState.pH * 100) / 100,
    flowRate: Math.round(sensorState.flowRate * 10) / 10,
    flowVolume: Math.round(sensorState.flowVolume * 10) / 10,
    leafCount: Math.max(0, Math.round(sensorState.leafCount)),
    timestamp: new Date(),
    deviceId: 'ESP32-SENSOR'
  };
}

// Start generating test sensor data periodically
export function startTestSensorSimulation(intervalMs = 5000) {
  console.log(`[INFO] Starting test sensor simulation (updates every ${intervalMs}ms)`);

  const interval = setInterval(async () => {
    try {
      const testData = generateTestSensorData();

      // Save to database
      await SensorReading.create(testData);

      // Broadcast via WebSocket
      wsService.broadcastSensorUpdate(testData);

      console.log('[OK] Test sensor data sent:', {
        moisture: `${testData.soilMoisture}%`,
        temp: `${testData.temperature} °C`,
        humidity: `${testData.humidity}%`,
        light: `${testData.light}lux`,
        ph: testData.pH,
        flowRate: `${testData.flowRate} mL/min`,
        flowVolume: `${testData.flowVolume} mL`,
        leafCount: `${testData.leafCount} leaves`
      });
    } catch (error) {
      console.error('[ERROR] Error generating test sensor data:', error.message);
    }
  }, intervalMs);

  return interval;
}

// Stop test sensor simulation
export function stopTestSensorSimulation(intervalId) {
  clearInterval(intervalId);
  console.log('[INFO] Test sensor simulation stopped');
}

