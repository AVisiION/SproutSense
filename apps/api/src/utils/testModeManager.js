import { startTestSensorSimulation, stopTestSensorSimulation } from './testDataGenerator.js';
import config from '../config/config.js';

// Global test mode state
export const testModeState = {
  enabled: false,
  intervalId: null,
  allowedInEnvironment: !config.IS_PRODUCTION // Disabled in production
};

// Toggle test mode on/off
export function toggleTestMode(enable) {
  // Prevent enabling test mode in production
  if (enable && !testModeState.allowedInEnvironment) {
    console.warn('⚠️  Test mode is disabled in production environment');
    return { 
      enabled: false, 
      message: 'Test mode is not available in production',
      error: 'PRODUCTION_MODE'
    };
  }

  if (enable) {
    // Start test mode
    if (!testModeState.intervalId) {
      testModeState.intervalId = startTestSensorSimulation(5000);
      testModeState.enabled = true;
      console.log('✅ Test mode ENABLED');
      return { enabled: true, message: 'Test mode enabled' };
    }
  } else {
    // Stop test mode
    if (testModeState.intervalId) {
      stopTestSensorSimulation(testModeState.intervalId);
      testModeState.intervalId = null;
      testModeState.enabled = false;
      console.log('✅ Test mode DISABLED');
      return { enabled: false, message: 'Test mode disabled' };
    }
  }
  return { enabled: testModeState.enabled };
}

// Initialize test mode for development
export function initTestMode(isDevelopment) {
  // Only auto-enable in development if not in production
  if (isDevelopment && testModeState.allowedInEnvironment && config.TEST_MODE.ENABLED) {
    console.log('📊 Starting test sensor data simulation...');
    testModeState.intervalId = startTestSensorSimulation(5000);
    testModeState.enabled = true;
    console.log('✅ Test sensor simulation running - broadcasting data via WebSocket');
  } else if (config.IS_PRODUCTION) {
    console.log('🔒 Test mode disabled in production environment');
  }
}
