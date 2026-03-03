import SystemConfig from '../models/SystemConfig.js';
import DeviceStatus from '../models/DeviceStatus.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';
import wsService from '../utils/websocketService.js';

// Get system configuration
export const getConfig = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-001' } = req.query;
    const config = await SystemConfig.getConfig(deviceId);

    successResponse(res, config);
  } catch (error) {
    next(error);
  }
};

// Update system configuration
export const updateConfig = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-001' } = req.query;
    const updates = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { deviceId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Emit to WebSocket clients
    wsService.broadcastConfigUpdated(config);

    successResponse(res, config, 'Configuration updated');
  } catch (error) {
    next(error);
  }
};

// Get device status
export const getStatus = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-001' } = req.query;
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
    const { deviceId = 'ESP32-001' } = req.query;
    
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
