import SensorReading from '../models/SensorReading.js';
import DeviceStatus from '../models/DeviceStatus.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';
import wsService from '../utils/websocketService.js';

// Get latest sensor readings
export const getLatestSensors = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.query;
    const reading = await SensorReading.getLatest(deviceId);
    
    if (!reading) {
      return errorResponse(res, 'No sensor data available', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, reading);
  } catch (error) {
    next(error);
  }
};

// Get sensor history
export const getSensorHistory = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', hours, start, end } = req.query;
    let startDate, endDate;
    
    if (start && end) {
      // Use provided start and end dates
      startDate = new Date(start);
      endDate = new Date(end);
    } else {
      // Use hours parameter (default 24)
      const hoursValue = parseInt(hours) || 24;
      startDate = new Date(Date.now() - hoursValue * 60 * 60 * 1000);
      endDate = new Date();
    }
    
    const readings = await SensorReading.getRange(startDate, endDate, deviceId);

    successResponse(res, { count: readings.length, readings });
  } catch (error) {
    next(error);
  }
};

// Get hourly averages
export const getHourlyAverages = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', hours = 24 } = req.query;
    const averages = await SensorReading.getHourlyAverages(parseInt(hours), deviceId);

    successResponse(res, averages);
  } catch (error) {
    next(error);
  }
};

// Create new sensor reading (called by ESP32 or for testing)
export const createSensorReading = async (req, res, next) => {
  try {
    const {
      soilMoisture,
      pH,
      ph,
      temperature,
      humidity,
      light,
      flowRate,
      flowRateMlPerMin,
      waterFlowRate,
      flowVolume,
      cycleVolumeML,
      waterFlowVolume,
      leafCount,
      leaf_count,
      canopyLeafCount,
      deviceId = 'ESP32-SENSOR'
    } = req.body;

    // Accept multiple field names used by different ESP32 firmware variants.
    const normalizedPH = pH ?? ph;
    const normalizedFlowRate = flowRate ?? flowRateMlPerMin ?? waterFlowRate;
    const normalizedFlowVolume = flowVolume ?? cycleVolumeML ?? waterFlowVolume;
    const normalizedLeafCount = leafCount ?? leaf_count ?? canopyLeafCount;

    const reading = await SensorReading.create({
      soilMoisture,
      pH: normalizedPH,
      temperature,
      humidity,
      light,
      flowRate: normalizedFlowRate,
      flowVolume: normalizedFlowVolume,
      leafCount: normalizedLeafCount,
      deviceId
    });

    // Update device status
    const status = await DeviceStatus.getStatus(deviceId);
    await status.markOnline();

    // Emit to WebSocket clients
    wsService.broadcastSensorUpdate(reading);

    successResponse(res, reading, 'Sensor reading created', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Get sensor statistics
export const getSensorStats = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await SensorReading.aggregate([
      {
        $match: {
          deviceId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgSoilMoisture: { $avg: '$soilMoisture' },
          minSoilMoisture: { $min: '$soilMoisture' },
          maxSoilMoisture: { $max: '$soilMoisture' },
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgLight: { $avg: '$light' },
          avgFlowRate: { $avg: '$flowRate' },
          minFlowRate: { $min: '$flowRate' },
          maxFlowRate: { $max: '$flowRate' },
          totalFlowVolume: { $sum: { $ifNull: ['$flowVolume', 0] } },
          avgLeafCount: { $avg: '$leafCount' },
          minLeafCount: { $min: '$leafCount' },
          maxLeafCount: { $max: '$leafCount' },
          totalReadings: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, stats[0] || {});
  } catch (error) {
    next(error);
  }
};

