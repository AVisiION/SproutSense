import User from '../models/User.js';
import Role from '../models/Role.js';
import DeviceStatus from '../models/DeviceStatus.js';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';
import { ROLE_KEYS } from '../config/rbac.js';

export async function getSystemStats(req, res, next) {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // 1. User Statistics
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ lastLoginAt: { $gt: fifteenMinutesAgo } });

    // Role distribution
    const roles = await Role.find().lean();
    const roleIdToKey = new Map(roles.map(r => [String(r._id), r.key]));
    
    const users = await User.find({}, 'roleId lastLoginAt preferredPlant').lean();
    
    const roleStats = {
      [ROLE_KEYS.ADMIN]: { total: 0, online: 0 },
      [ROLE_KEYS.USER]: { total: 0, online: 0 },
      [ROLE_KEYS.VIEWER]: { total: 0, online: 0 }
    };

    const plantCounts = {};

    users.forEach(u => {
      const roleKey = roleIdToKey.get(String(u.roleId));
      if (roleKey && roleStats[roleKey]) {
        roleStats[roleKey].total++;
        if (u.lastLoginAt && u.lastLoginAt > fifteenMinutesAgo) {
          roleStats[roleKey].online++;
        }
      }

      if (u.preferredPlant) {
        plantCounts[u.preferredPlant] = (plantCounts[u.preferredPlant] || 0) + 1;
      }
    });

    // Top plant
    let topPlant = 'None';
    let maxCount = 0;
    Object.entries(plantCounts).forEach(([plant, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPlant = plant;
      }
    });

    // 2. Device Statistics
    const allDevices = await PreRegisteredDevice.find({}, 'deviceId displayCategory').lean();
    const deviceStatuses = await DeviceStatus.find().lean();
    const statusMap = new Map(deviceStatuses.map(s => [s.deviceId, s]));

    const deviceStats = {
      sensors: { total: 0, online: 0, offline: 0, avgLatency: 0 },
      cams: { total: 0, online: 0, offline: 0, avgLatency: 0 }
    };

    let sensorLatencySum = 0;
    let camLatencySum = 0;

    allDevices.forEach(d => {
      const isCam = d.deviceId.startsWith('ESP32-CAM');
      const isSensor = d.deviceId.startsWith('ESP32-SENSOR');
      const status = statusMap.get(d.deviceId);
      const isOnline = status?.online && (new Date() - new Date(status.lastSeen) < 5 * 60 * 1000);

      if (isCam) {
        deviceStats.cams.total++;
        if (isOnline) {
          deviceStats.cams.online++;
          camLatencySum += (status.latency || 0);
        } else {
          deviceStats.cams.offline++;
        }
      } else if (isSensor) {
        deviceStats.sensors.total++;
        if (isOnline) {
          deviceStats.sensors.online++;
          sensorLatencySum += (status.latency || 0);
        } else {
          deviceStats.sensors.offline++;
        }
      }
    });

    if (deviceStats.sensors.online > 0) {
      deviceStats.sensors.avgLatency = Math.round(sensorLatencySum / deviceStats.sensors.online);
    }
    if (deviceStats.cams.online > 0) {
      deviceStats.cams.avgLatency = Math.round(camLatencySum / deviceStats.cams.online);
    }

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          online: onlineUsers,
          roleDistribution: roleStats,
          topPlant: topPlant.charAt(0).toUpperCase() + topPlant.slice(1)
        },
        devices: deviceStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
}
