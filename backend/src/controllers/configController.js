import SystemConfig from '../models/SystemConfig.js';
import DeviceStatus from '../models/DeviceStatus.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';
import wsService from '../utils/websocketService.js';
import { testModeState, toggleTestMode as setTestMode } from '../utils/testModeManager.js';

const DEFAULT_DEVICE_ID = 'ESP32-001';

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

  return updates;
};

const formatConfigResponse = (configDoc) => {
  const data = configDoc?.toObject ? configDoc.toObject() : configDoc;
  return {
    ...data,
    autoWaterEnabled: data?.autoMode ?? false,
    soilMoistureThreshold: data?.moistureThreshold,
    deviceIp: data?.espIp || ''
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
    const { deviceId = 'ESP32-001' } = req.body;
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
