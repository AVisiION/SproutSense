import wsService from './websocketService.js';
import SensorReading from '../models/SensorReading.js';

// Simulated sensor values that change over time
const sensorState = {
  soilMoisture: 65,
  temperature: 24,
  humidity: 58,
  light: 5000,
  pH: 6.8
};

// Range for random variations
const sensorRanges = {
  soilMoisture: { min: 20, max: 85, changeRate: 0.5 },
  temperature: { min: 15, max: 35, changeRate: 0.2 },
  humidity: { min: 30, max: 80, changeRate: 0.3 },
  light: { min: 100, max: 30000, changeRate: 500 },
  pH: { min: 5.5, max: 7.5, changeRate: 0.05 }
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

  // Round values appropriately
  return {
    soilMoisture: Math.round(sensorState.soilMoisture * 10) / 10,
    temperature: Math.round(sensorState.temperature * 10) / 10,
    humidity: Math.round(sensorState.humidity * 10) / 10,
    light: Math.round(sensorState.light),
    pH: Math.round(sensorState.pH * 100) / 100,
    timestamp: new Date(),
    deviceId: 'ESP32-001'
  };
}

// Start generating test sensor data periodically
export function startTestSensorSimulation(intervalMs = 5000) {
  console.log(`📊 Starting test sensor simulation (updates every ${intervalMs}ms)`);

  const interval = setInterval(async () => {
    try {
      const testData = generateTestSensorData();

      // Save to database
      await SensorReading.create(testData);

      // Broadcast via WebSocket
      wsService.broadcastSensorUpdate(testData);

      console.log(`✅ Test sensor data sent:`, {
        moisture: `${testData.soilMoisture}%`,
        temp: `${testData.temperature}°C`,
        humidity: `${testData.humidity}%`,
        light: `${testData.light}lux`,
        ph: testData.pH
      });
    } catch (error) {
      console.error('❌ Error generating test sensor data:', error.message);
    }
  }, intervalMs);

  return interval;
}

// Stop test sensor simulation
export function stopTestSensorSimulation(intervalId) {
  clearInterval(intervalId);
  console.log('🛑 Test sensor simulation stopped');
}
