import SystemConfig from '../models/SystemConfig.js';
import DeviceStatus from '../models/DeviceStatus.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';
import wsService from '../utils/websocketService.js';
import { testModeState, toggleTestMode as setTestMode } from '../utils/testModeManager.js';

const DEFAULT_DEVICE_ID = 'ESP32-SENSOR';

const resolveDeviceId = (req) => {
  const id = req.params.deviceId || req.query.deviceId || req.body.deviceId;
  return (typeof id === 'string' && id.trim()) ? id.trim() : DEFAULT_DEVICE_ID;
};

const normalizeConfigUpdates = (payload = {}) => {
  const updates = { ...payload };

  if (Object.prototype.hasOwnProperty.call(updates, 'autoWaterEnabled')) {
    updates.autoMode = updates.autoWaterEnabled;
    delete updates.autoWaterEnabled;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'soilMoistureThreshold')) {
    updates.moistureThreshold = updates.soilMoistureThreshold;
    delete updates.soilMoistureThreshold;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'deviceIp')) {
    updates.espIp = updates.deviceIp;
    delete updates.deviceIp;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'esp32IP')) {
    updates.espIp = updates.esp32IP;
    delete updates.esp32IP;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'scheduleEnabled')) {
    updates.schedule = {
      ...(updates.schedule || {}),
      enabled: updates.scheduleEnabled,
      times: updates.scheduleTime ? [updates.scheduleTime] : (updates.schedule?.times || [])
    };
    delete updates.scheduleEnabled;
    delete updates.scheduleTime;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'plantGrowthEnabled')) {
    updates.plantGrowth = {
      ...(updates.plantGrowth || {}),
      enabled: updates.plantGrowthEnabled
    };
    delete updates.plantGrowthEnabled;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'plantGrowthStage')) {
    updates.plantGrowth = {
      ...(updates.plantGrowth || {}),
      stage: updates.plantGrowthStage
    };
    delete updates.plantGrowthStage;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'aiInsightsSource')) {
    updates.aiInsightsMode = updates.aiInsightsSource;
    delete updates.aiInsightsSource;
  }

  return updates;
};

const formatConfigResponse = (configDoc) => {
  const data = configDoc?.toObject ? configDoc.toObject() : configDoc;
  return {
    ...data,
    autoWaterEnabled: data?.autoMode ?? false,
    soilMoistureThreshold: data?.moistureThreshold,
    deviceIp: data?.espIp || '',
    plantGrowthEnabled: data?.plantGrowth?.enabled ?? true,
    plantGrowthStage: data?.plantGrowth?.stage || 'vegetative',
    aiInsightsMode: data?.aiInsightsMode || 'snapshots'
  };
};

const getCleanupState = (configDoc) => {
  const data = configDoc?.toObject ? configDoc.toObject() : configDoc;
  return {
    autoCleanupEnabled: data?.dataCleanup?.autoCleanupEnabled ?? true,
    lastCleanupDate: data?.dataCleanup?.lastCleanupDate ?? null,
    cleanupSchedule: data?.dataCleanup?.cleanupSchedule || 'weekly',
  };
};

// Get system configuration
export const getConfig = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const config = await SystemConfig.getConfig(deviceId);

    successResponse(res, formatConfigResponse(config));
  } catch (error) {
    next(error);
  }
};

// Update system configuration
export const updateConfig = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const updates = normalizeConfigUpdates(req.body);

    const config = await SystemConfig.findOneAndUpdate(
      { deviceId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Emit to WebSocket clients
    wsService.broadcastConfigUpdated(config);

    successResponse(res, formatConfigResponse(config), 'Configuration updated');
  } catch (error) {
    next(error);
  }
};

// Get device status
export const getStatus = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const status = await DeviceStatus.getStatus(deviceId);

    // Check if device is stale
    if (status.isStale() && status.online) {
      status.online = false;
      await status.save();
    }

    successResponse(res, status);
  } catch (error) {
    next(error);
  }
};

// Update device status (called by ESP32)
export const updateStatus = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.body;
    const updates = req.body;

    const status = await DeviceStatus.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          ...updates,
          lastSeen: new Date(),
          online: true
        }
      },
      { new: true, upsert: true }
    );

    successResponse(res, status, 'Device status updated');
  } catch (error) {
    next(error);
  }
};

// System health check
export const getHealth = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    
    const [config, status] = await Promise.all([
      SystemConfig.getConfig(deviceId),
      DeviceStatus.getStatus(deviceId)
    ]);

    const health = {
      backend: 'healthy',
      database: 'connected',
      device: status.online ? 'online' : 'offline',
      lastSeen: status.lastSeen,
      uptime: status.uptime,
      errors: status.errors.slice(-5) // Last 5 errors
    };

    successResponse(res, health);
  } catch (error) {
    next(error);
  }
};

// Get test mode status
export const getTestMode = async (req, res, next) => {
  try {
    successResponse(res, {
      enabled: testModeState.enabled,
      interval: testModeState.intervalId ? 'running' : 'stopped',
      allowedInEnvironment: testModeState.allowedInEnvironment,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle test mode
export const toggleTestMode = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    const result = setTestMode(enabled);

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DATA HISTORY & CLEANUP ENDPOINTS
// ============================================================================

/**
 * POST /api/config/clear-sensor-history
 * Clear sensor data history based on retention policy
 */
export const clearSensorHistory = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const days = Number(req.body?.days ?? req.body?.retentionDays ?? 90);

    // Import models for cleanup
    const SensorReading = (await import('../models/SensorReading.js')).default;

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Delete old sensor readings
    const deleteResult = await SensorReading.deleteMany({
      deviceId,
      timestamp: { $lt: cutoffDate }
    });

    // Update config
    const config = await SystemConfig.clearSensorHistory(deviceId, days);
    const cleanupState = getCleanupState(config);

    successResponse(res, {
      recordsDeleted: deleteResult.deletedCount,
      retentionDays: days,
      cutoffDate,
      nextCleanup: cleanupState.lastCleanupDate,
      message: `Deleted ${deleteResult.deletedCount} sensor readings older than ${days} days`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/config/clear-watering-history
 * Clear watering logs history based on retention policy
 */
export const clearWateringHistory = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const days = Number(req.body?.days ?? req.body?.retentionDays ?? 365);

    // Import models for cleanup
    const WateringLog = (await import('../models/WateringLog.js')).default;

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Delete old watering logs
    const deleteResult = await WateringLog.deleteMany({
      deviceId,
      startTime: { $lt: cutoffDate }
    });

    // Update config
    const config = await SystemConfig.clearWateringHistory(deviceId, days);
    const cleanupState = getCleanupState(config);

    successResponse(res, {
      recordsDeleted: deleteResult.deletedCount,
      retentionDays: days,
      cutoffDate,
      nextCleanup: cleanupState.lastCleanupDate,
      message: `Deleted ${deleteResult.deletedCount} watering logs older than ${days} days`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/config/clear-disease-history
 * Clear disease detection history based on retention policy
 */
export const clearDiseaseHistory = async (req, res, next) => {
  try {
    const diseaseDeviceId = req.body?.diseaseDeviceId || 'ESP32-CAM';
    const configDeviceId = resolveDeviceId(req);
    const days = Number(req.body?.days ?? req.body?.retentionDays ?? 180);

    // Import models for cleanup
    const DiseaseDetection = (await import('../models/DiseaseDetection.js')).default;

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Delete old disease detections
    const deleteResult = await DiseaseDetection.deleteMany({
      deviceId: diseaseDeviceId,
      timestamp: { $lt: cutoffDate }
    });

    const config = await SystemConfig.clearDiseaseHistory(configDeviceId, days);
    const cleanupState = getCleanupState(config);

    successResponse(res, {
      recordsDeleted: deleteResult.deletedCount,
      retentionDays: days,
      cutoffDate,
      nextCleanup: cleanupState.lastCleanupDate,
      message: `Deleted ${deleteResult.deletedCount} disease detection records older than ${days} days`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/config/clear-all-history
 * Clear all historical data (sensor, watering, disease)
 */
export const clearAllHistory = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const sensorDeviceId = req.body.sensorDeviceId || deviceId;
    const diseaseDeviceId = req.body.diseaseDeviceId || 'ESP32-CAM';
    const { sensorDays = 90, wateringDays = 365, diseaseDays = 180 } = req.body;

    // Import models
    const SensorReading = (await import('../models/SensorReading.js')).default;
    const WateringLog = (await import('../models/WateringLog.js')).default;
    const DiseaseDetection = (await import('../models/DiseaseDetection.js')).default;

    // Calculate cutoff dates
    const sensorCutoff = new Date(Date.now() - sensorDays * 24 * 60 * 60 * 1000);
    const wateringCutoff = new Date(Date.now() - wateringDays * 24 * 60 * 60 * 1000);
    const diseaseCutoff = new Date(Date.now() - diseaseDays * 24 * 60 * 60 * 1000);

    // Delete from all collections in parallel
    const [sensorResult, wateringResult, diseaseResult] = await Promise.all([
      SensorReading.deleteMany({
        deviceId: sensorDeviceId,
        timestamp: { $lt: sensorCutoff }
      }),
      WateringLog.deleteMany({
        deviceId,
        startTime: { $lt: wateringCutoff }
      }),
      DiseaseDetection.deleteMany({
        deviceId: diseaseDeviceId,
        timestamp: { $lt: diseaseCutoff }
      })
    ]);

    // Update config with cleanup info
    const config = await SystemConfig.clearAllHistory(deviceId);
    const cleanupState = getCleanupState(config);

    successResponse(res, {
      summary: {
        totalRecordsDeleted: 
          sensorResult.deletedCount + wateringResult.deletedCount + diseaseResult.deletedCount,
        timestamp: new Date()
      },
      details: {
        sensorReadings: {
          deleted: sensorResult.deletedCount,
          retentionDays: sensorDays,
          cutoffDate: sensorCutoff
        },
        wateringLogs: {
          deleted: wateringResult.deletedCount,
          retentionDays: wateringDays,
          cutoffDate: wateringCutoff
        },
        diseaseDetections: {
          deleted: diseaseResult.deletedCount,
          retentionDays: diseaseDays,
          cutoffDate: diseaseCutoff
        }
      },
      nextCleanup: cleanupState.lastCleanupDate,
      message: 'All historical data cleanup completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/config/data-retention
 * Get current data retention policy and cleanup schedule
 */
export const getDataRetentionPolicy = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const config = await SystemConfig.getConfig(deviceId);
    const cleanupState = getCleanupState(config);

    successResponse(res, {
      retention: config.dataRetention,
      cleanup: {
        autoCleanupEnabled: cleanupState.autoCleanupEnabled,
        lastCleanupDate: cleanupState.lastCleanupDate,
        schedule: cleanupState.cleanupSchedule
      },
      estimatedStorageSize: 'Contact system administrator for details',
      nextScheduledCleanup: calculateNextCleanup(
        cleanupState.lastCleanupDate,
        cleanupState.cleanupSchedule
      )
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/config/data-retention
 * Update data retention policy
 */
export const updateDataRetentionPolicy = async (req, res, next) => {
  try {
    const deviceId = resolveDeviceId(req);
    const { retention, cleanup } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          dataRetention: { ...retention },
          dataCleanup: { 
            ...cleanup,
            lastCleanupDate: new Date()
          }
        }
      },
      { new: true }
    );

    successResponse(res, {
      dataRetention: config.dataRetention,
      dataCleanup: config.dataCleanup,
      message: 'Data retention policy updated'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate next scheduled cleanup date
 */
function calculateNextCleanup(lastCleanupDate, schedule) {
  const lastCleanup = lastCleanupDate ? new Date(lastCleanupDate) : new Date();
  const nextCleanup = new Date(lastCleanup);

  switch (schedule) {
    case 'daily':
      nextCleanup.setDate(nextCleanup.getDate() + 1);
      break;
    case 'weekly':
      nextCleanup.setDate(nextCleanup.getDate() + 7);
      break;
    case 'monthly':
      nextCleanup.setMonth(nextCleanup.getMonth() + 1);
      break;
    default:
      nextCleanup.setDate(nextCleanup.getDate() + 7); // Default to weekly
  }

  return nextCleanup;
}


