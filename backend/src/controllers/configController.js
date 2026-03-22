import mongoose from 'mongoose';
import SystemConfig from '../models/SystemConfig.js';
import DeviceStatus from '../models/DeviceStatus.js';
import SensorReading from '../models/SensorReading.js';
import WateringLog from '../models/WateringLog.js';
import DiseaseDetection from '../models/DiseaseDetection.js';

// ─── GET CONFIG ────────────────────────────────────────────────────────────────
export const getConfig = async (req, res) => {
  try {
    const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-SENSOR';
    let config = await SystemConfig.findOne({ deviceId });
    if (!config) {
      config = await SystemConfig.create({ deviceId });
    }
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── UPDATE CONFIG ─────────────────────────────────────────────────────────────
export const updateConfig = async (req, res) => {
  try {
    const deviceId = req.params.deviceId || req.body.deviceId || 'ESP32-SENSOR';
    const updates = req.body;
    delete updates.deviceId;
    const config = await SystemConfig.findOneAndUpdate(
      { deviceId },
      { ...updates, lastUpdated: new Date() },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── GET STATUS ────────────────────────────────────────────────────────────────
export const getStatus = async (req, res) => {
  try {
    const deviceId = req.params.deviceId || req.query.deviceId;
    if (deviceId) {
      const status = await DeviceStatus.findOne({ deviceId });
      return res.json({ success: true, status: status || null });
    }
    const allStatuses = await DeviceStatus.find({}).sort({ lastSeen: -1 });
    res.json({ success: true, statuses: allStatuses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── UPDATE STATUS (Device heartbeat) ─────────────────────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const {
      deviceId, isOnline, state, ipAddress,
      wifiRSSI, firmwareVersion, uptime
    } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId required' });
    const status = await DeviceStatus.findOneAndUpdate(
      { deviceId },
      { isOnline: isOnline !== undefined ? isOnline : true, state, ipAddress, wifiRSSI, firmwareVersion, uptime, lastSeen: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
export const getHealth = async (req, res) => {
  try {
    const dbState    = mongoose.connection.readyState;
    const dbConnected = dbState === 1;
    const dbName     = dbConnected ? mongoose.connection.db.databaseName : 'disconnected';
    const isCorrectDb = dbName === 'sproutsense';

    // Count documents for diagnostics
    let counts = {};
    if (dbConnected) {
      const [sensors, watering, disease] = await Promise.all([
        SensorReading.countDocuments(),
        WateringLog.countDocuments(),
        DiseaseDetection.countDocuments()
      ]);
      counts = { sensorReadings: sensors, wateringLogs: watering, diseaseDetections: disease };
    }

    res.json({
      success:    true,
      status:     dbConnected ? 'ok' : 'degraded',
      database:   dbConnected ? 'connected' : 'disconnected',
      dbName,                             // ← shows 'sproutsense' if URI is correct
      dbCorrect:  isCorrectDb,            // ← true if using right database
      dbWarning:  !isCorrectDb ? 'Database is not sproutsense! Update MONGODB_URI on Render to include /sproutsense' : null,
      counts,
      uptime:     process.uptime(),
      memory:     process.memoryUsage(),
      timestamp:  new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ success: false, status: 'error', error: error.message });
  }
};

// ─── TEST MODE ─────────────────────────────────────────────────────────────────
export const getTestMode = async (req, res) => {
  res.json({ success: true, testMode: process.env.TEST_MODE === 'true' });
};

export const toggleTestMode = async (req, res) => {
  const current = process.env.TEST_MODE === 'true';
  process.env.TEST_MODE = (!current).toString();
  res.json({ success: true, testMode: !current });
};

// ─── CLEAR HISTORY ─────────────────────────────────────────────────────────────
export const clearSensorHistory = async (req, res) => {
  try {
    const result = await SensorReading.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearWateringHistory = async (req, res) => {
  try {
    const result = await WateringLog.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearDiseaseHistory = async (req, res) => {
  try {
    const result = await DiseaseDetection.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearAllHistory = async (req, res) => {
  try {
    const [s, w, d] = await Promise.all([
      SensorReading.deleteMany({}),
      WateringLog.deleteMany({}),
      DiseaseDetection.deleteMany({})
    ]);
    res.json({
      success: true,
      deleted: {
        sensorReadings: s.deletedCount,
        wateringLogs: w.deletedCount,
        diseaseDetections: d.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── DATA RETENTION ────────────────────────────────────────────────────────────
export const getDataRetentionPolicy = async (req, res) => {
  res.json({
    success: true,
    policy: {
      sensorReadings: '7 days',
      wateringLogs: '30 days',
      diseaseDetections: '30 days'
    }
  });
};

export const updateDataRetentionPolicy = async (req, res) => {
  res.json({ success: true, message: 'Retention policy updated', policy: req.body });
};
