import WateringLog from '../models/WateringLog.js';
import SensorReading from '../models/SensorReading.js';
import DeviceStatus from '../models/DeviceStatus.js';
import SystemConfig from '../models/SystemConfig.js';

import config from '../config/config.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';
import wsService from '../utils/websocketService.js';

// Start watering
export const startWatering = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', triggerType = 'manual' } = req.body;

    // Get current soil moisture
    const currentReading = await SensorReading.getLatest(deviceId);
    const soilMoistureBefore = currentReading?.soilMoisture || null;

    // Create watering log
    const log = await WateringLog.create({
      deviceId,
      triggerType,
      soilMoistureBefore,
      startTime: new Date()
    });

    // We no longer push via axios.post to the ESP32 because it polls the backend 
    // every 8 seconds via GET /api/water/status. This eliminates the 5s API latency!

    // Update device status
    const status = await DeviceStatus.getStatus(deviceId);
    status.pumpActive = true;
    status.currentState = 'WATERING';
    await status.save();

    // Emit to WebSocket clients
    wsService.broadcastWateringStarted(log);

    successResponse(res, log, 'Watering started');
  } catch (error) {
    next(error);
  }
};

// Stop watering
export const stopWatering = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.body;

    // Find the active watering log
    const activeLog = await WateringLog.findOne({
      deviceId,
      endTime: null
    }).sort({ startTime: -1 });

    if (activeLog) {
      // Get current soil moisture
      const currentReading = await SensorReading.getLatest(deviceId);
      
      activeLog.endTime = new Date();
      activeLog.soilMoistureAfter = currentReading?.soilMoisture || null;
      await activeLog.save();
    }

    // We no longer push via axios.post to the ESP32 because it polls the backend 
    // every 8 seconds via GET /api/water/status. This eliminates the 5s API latency!

    // Update device status
    const status = await DeviceStatus.getStatus(deviceId);
    status.pumpActive = false;
    status.currentState = 'IDLE';
    await status.save();

    // Emit to WebSocket clients
    wsService.broadcastWateringStopped(activeLog);

    successResponse(res, activeLog, 'Watering stopped');
  } catch (error) {
    next(error);
  }
};

// Get watering history
export const getWateringHistory = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', days = 7 } = req.query;
    const history = await WateringLog.getHistory(parseInt(days), deviceId);

    successResponse(res, { count: history.length, history });
  } catch (error) {
    next(error);
  }
};

// Get today's watering stats
export const getTodayStats = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.query;
    
    const count = await WateringLog.getTodayCount(deviceId);
    const volumeData = await WateringLog.getTodayVolume(deviceId);
    
    const totalVolume = volumeData.length > 0 ? volumeData[0].totalVolume : 0;

    successResponse(res, {
      cyclesCompleted: count,
      totalVolumeML: totalVolume,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get device watering status
export const getWateringStatus = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.params;
    const status = await DeviceStatus.findOne({ deviceId }) || await DeviceStatus.create({ deviceId });

    successResponse(res, {
      deviceId: status.deviceId,
      pumpActive: status.pumpActive,
      currentState: status.currentState,
      online: status.online,
      lastSeen: status.lastSeen
    });
  } catch (error) {
    next(error);
  }
};

// Update watering log (called by ESP32 to report volume, etc.)
export const updateWateringLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { volumeML, endTime, success, notes } = req.body;

    const log = await WateringLog.findById(id);
    
    if (!log) {
      return errorResponse(res, 'Watering log not found', HTTP_STATUS.NOT_FOUND);
    }

    if (volumeML !== undefined) log.volumeML = volumeML;
    if (endTime !== undefined) log.endTime = new Date(endTime);
    if (success !== undefined) log.success = success;
    if (notes !== undefined) log.notes = notes;

    await log.save();

    successResponse(res, log, 'Watering log updated');
  } catch (error) {
    next(error);
  }
};

