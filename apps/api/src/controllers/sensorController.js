import SensorReading from '../models/SensorReading.js';
import DeviceStatus from '../models/DeviceStatus.js';
import UserDevice from '../models/UserDevice.js';
import User from '../models/User.js';
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

// Get latest sensor reading for each user's linked devices
export const getLatestSensorsByUser = async (req, res, next) => {
  try {
    // Find active user devices
    const devices = await UserDevice.find({ isActive: true }).lean();
    if (!devices || devices.length === 0) {
      return successResponse(res, { users: [] });
    }

    const deviceIds = devices.map((d) => d.deviceId);

    // Aggregate latest reading per deviceId
    const latestAgg = await SensorReading.aggregate([
      { $match: { deviceId: { $in: deviceIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$deviceId', latest: { $first: '$$ROOT' } } },
    ]);

    const readingByDevice = new Map(latestAgg.map((r) => [r._id, r.latest]));

    // Fetch users referenced by devices
    const userIds = Array.from(new Set(devices.map((d) => String(d.userId))));
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    // Build result grouping by user
    const resultByUser = new Map();

    for (const device of devices) {
      const uid = String(device.userId);
      const user = userById.get(uid) || { id: uid, fullName: null, email: null };
      const reading = readingByDevice.get(device.deviceId) || null;

      if (!resultByUser.has(uid)) {
        resultByUser.set(uid, {
          user: {
            id: uid,
            fullName: user.fullName || null,
            email: user.email || null,
          },
          devices: [],
        });
      }

      resultByUser.get(uid).devices.push({
        deviceId: device.deviceId,
        displayName: device.displayName || device.deviceId,
        firmwareVersion: device.firmwareVersion || null,
        lastSeenAt: device.lastSeenAt || null,
        latestReading: reading,
      });
    }

    const usersArray = Array.from(resultByUser.values());

    return successResponse(res, { users: usersArray });
  } catch (error) {
    return next(error);
  }
};

// Create new sensor reading (called by ESP32 or for testing)
export const createSensorReading = async (req, res, next) => {
  try {
    const deviceAuthDeviceId = req.deviceAuth?.deviceId;
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
      deviceId = deviceAuthDeviceId || 'ESP32-SENSOR'
    } = req.body;

    const effectiveDeviceId = deviceAuthDeviceId || deviceId;

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
      deviceId: effectiveDeviceId
    });

    // Update device status
    const status = await DeviceStatus.getStatus(effectiveDeviceId);
    await status.markOnline();

    if (req.deviceAuth?.userDeviceId) {
      await UserDevice.findByIdAndUpdate(req.deviceAuth.userDeviceId, {
        lastSeenAt: new Date(),
      });
    }

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

