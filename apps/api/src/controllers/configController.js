import mongoose from 'mongoose';
import SystemConfig from '../models/SystemConfig.js';
import DeviceStatus from '../models/DeviceStatus.js';
import SensorReading from '../models/SensorReading.js';
import WateringLog from '../models/WateringLog.js';
import DiseaseDetection from '../models/DiseaseDetection.js';
import UserDevice from '../models/UserDevice.js';
import AdminLog from '../models/AdminLog.js';

const flattenForSet = (source, prefix = '', target = {}) => {
  Object.entries(source || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === undefined) {
      return;
    }

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      flattenForSet(value, path, target);
      return;
    }

    target[path] = value;
  });

  return target;
};

const buildAdminLogQuery = (query = {}) => {
  const {
    level,
    actor,
    section,
    q,
    startDate,
    endDate
  } = query;

  const mongoQuery = {};

  if (level && level !== 'all') {
    mongoQuery.level = level;
  }

  if (actor) {
    mongoQuery.actor = actor;
  }

  if (section) {
    mongoQuery.section = section;
  }

  if (q) {
    mongoQuery.$or = [
      { action: { $regex: q, $options: 'i' } },
      { actor: { $regex: q, $options: 'i' } },
      { section: { $regex: q, $options: 'i' } }
    ];
  }

  if (startDate || endDate) {
    mongoQuery.createdAt = {};
    if (startDate) mongoQuery.createdAt.$gte = new Date(startDate);
    if (endDate) mongoQuery.createdAt.$lte = new Date(endDate);
  }

  return mongoQuery;
};

const csvEscape = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

// ─── GET CONFIG ────────────────────────────────────────────────────────────────
export const getConfig = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-SENSOR';
    let config = await SystemConfig.findOne({ deviceId });
    if (!config) {
      config = await SystemConfig.create({ deviceId });
    }
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE CONFIG ─────────────────────────────────────────────────────────────
export const updateConfig = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.body.deviceId || 'ESP32-SENSOR';
    const updates = req.body;
    delete updates.deviceId;
    const normalizedUpdates = flattenForSet(updates);

    const config = await SystemConfig.findOneAndUpdate(
      { deviceId },
      { $set: { ...normalizedUpdates, lastUpdated: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

// ─── GET STATUS ────────────────────────────────────────────────────────────────
export const getStatus = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.query.deviceId;
    if (deviceId) {
      const status = await DeviceStatus.findOne({ deviceId });
      return res.json({ success: true, status: status || null });
    }
    const allStatuses = await DeviceStatus.find({}).sort({ lastSeen: -1 });
    res.json({ success: true, statuses: allStatuses });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE STATUS (Device heartbeat) ─────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
  try {
    const deviceAuthDeviceId = req.deviceAuth?.deviceId;
    const {
      deviceId, isOnline, state, ipAddress,
      wifiRSSI, firmwareVersion, uptime
    } = req.body;
    const effectiveDeviceId = deviceAuthDeviceId || deviceId;
    if (!effectiveDeviceId) return res.status(400).json({ success: false, error: 'deviceId required' });

    const resolvedIpAddress = ipAddress || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;

    const status = await DeviceStatus.findOneAndUpdate(
      { deviceId: effectiveDeviceId },
      {
        online: isOnline !== undefined ? isOnline : true,
        currentState: state,
        ipAddress: resolvedIpAddress,
        wifiSignal: wifiRSSI,
        firmwareVersion,
        uptime,
        lastSeen: new Date()
      },
      { new: true, upsert: true }
    );

    if (req.deviceAuth?.userDeviceId) {
      await UserDevice.findByIdAndUpdate(req.deviceAuth.userDeviceId, {
        lastSeenAt: new Date(),
        lastSeenIp: resolvedIpAddress,
        firmwareVersion: firmwareVersion || undefined,
      });
    }

    res.json({ success: true, status });
  } catch (error) {
    next(error);
  }
};

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
export const getHealth = async (req, res, next) => {
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

    const mqttHealth = req.app?.locals?.mqttService?.getHealth?.() || {
      enabled: false,
      configured: false,
      connected: false
    };

    res.json({
      success:    true,
      status:     dbConnected ? 'ok' : 'degraded',
      database:   dbConnected ? 'connected' : 'disconnected',
      dbName,                             // ← shows 'sproutsense' if URI is correct
      dbCorrect:  isCorrectDb,            // ← true if using right database
      dbWarning:  !isCorrectDb ? 'Database is not sproutsense! Update MONGODB_URI on Render to include /sproutsense' : null,
      mqtt: mqttHealth,
      counts,
      uptime:     process.uptime(),
      memory:     process.memoryUsage(),
      timestamp:  new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    next(error);
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
export const clearSensorHistory = async (req, res, next) => {
  try {
    const result = await SensorReading.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

export const clearWateringHistory = async (req, res, next) => {
  try {
    const result = await WateringLog.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

export const clearDiseaseHistory = async (req, res, next) => {
  try {
    const result = await DiseaseDetection.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

export const clearAllHistory = async (req, res, next) => {
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
    next(error);
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

// ─── ADMIN LOGS ───────────────────────────────────────────────────────────────
export const createAdminLog = async (req, res, next) => {
  try {
    const {
      actor = 'admin',
      action,
      level = 'info',
      section = 'admin-panel',
      details = null
    } = req.body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ success: false, message: 'action is required' });
    }

    const log = await AdminLog.create({
      actor,
      action,
      level,
      section,
      details
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

export const getAdminLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const mongoQuery = buildAdminLogQuery(req.query);
    const logs = await AdminLog.find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminLogs = async (req, res, next) => {
  try {
    const mongoQuery = buildAdminLogQuery(req.query);
    const result = await AdminLog.deleteMany(mongoQuery);

    res.json({
      success: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const exportAdminLogs = async (req, res, next) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);
    const mongoQuery = buildAdminLogQuery(req.query);

    const logs = await AdminLog.find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (format === 'csv') {
      const headers = ['timestamp', 'actor', 'level', 'section', 'action', 'details'];
      const rows = logs.map((entry) => ([
        csvEscape(entry.createdAt ? new Date(entry.createdAt).toISOString() : ''),
        csvEscape(entry.actor),
        csvEscape(entry.level),
        csvEscape(entry.section),
        csvEscape(entry.action),
        csvEscape(entry.details ? JSON.stringify(entry.details) : '')
      ].join(',')));

      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="admin-logs-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="admin-logs-${Date.now()}.json"`);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
