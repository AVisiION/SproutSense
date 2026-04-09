import crypto from 'crypto';
import DeviceStatus from '../models/DeviceStatus.js';
import UserDevice from '../models/UserDevice.js';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';

function hashValue(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function extractIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || null;
}

export async function pairDevice(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const pairingKey = String(req.body?.pairingKey || '').trim().toUpperCase();
    const displayName = String(req.body?.displayName || '').trim();
    const firmwareVersion = String(req.body?.firmwareVersion || '').trim() || null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!pairingKey) {
      return res.status(400).json({ success: false, message: 'pairingKey is required.' });
    }

    // Validate against pre-registered device using the pairing code
    const preDevice = await PreRegisteredDevice.findOne({ pairingKey, isActive: true }).select('+deviceSecret +pairingKey');

    if (!preDevice) {
      return res.status(404).json({ success: false, message: 'Device not found. Please check pairingKey.' });
    }

    // Check if device already paired to another user
    const deviceId = preDevice.deviceId;
    const existingBinding = await UserDevice.findOne({ deviceId });
    if (existingBinding && existingBinding.isActive && String(existingBinding.userId) !== String(userId)) {
      return res.status(409).json({ success: false, message: 'This device is already paired to another user.' });
    }

    const now = new Date();
    const tokenHash = hashValue(preDevice.deviceSecret);

    // Create or update user-device binding
    const binding = await UserDevice.findOneAndUpdate(
      { deviceId },
      {
        userId,
        deviceId,
        displayName: displayName || preDevice.displayName || deviceId,
        tokenHash,
        tokenIssuedAt: now,
        lastSeenAt: now,
        lastSeenIp: extractIp(req),
        firmwareVersion: firmwareVersion || null,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Update device status
    await DeviceStatus.findOneAndUpdate(
      { deviceId },
      {
        online: true,
        lastSeen: now,
        ipAddress: binding.lastSeenIp,
        firmwareVersion: firmwareVersion || undefined,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      device: {
        deviceId,
        displayName: binding.displayName,
        pairedAt: now.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyDevices(req, res, next) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const devices = await UserDevice.find({ userId, isActive: true }).lean();
    const statusByDeviceId = new Map();

    const statuses = await DeviceStatus.find({ deviceId: { $in: devices.map((d) => d.deviceId) } }).lean();
    statuses.forEach((status) => statusByDeviceId.set(status.deviceId, status));

    const result = devices.map((device) => {
      const status = statusByDeviceId.get(device.deviceId);
      return {
        id: String(device._id),
        deviceId: device.deviceId,
        displayName: device.displayName || device.deviceId,
        tokenIssuedAt: device.tokenIssuedAt,
        lastSeenAt: device.lastSeenAt,
        lastSeenIp: device.lastSeenIp,
        firmwareVersion: device.firmwareVersion,
        online: Boolean(status?.online),
      };
    });

    return res.json({ success: true, devices: result });
  } catch (error) {
    return next(error);
  }
}

export async function rotateDeviceToken(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const deviceId = String(req.params?.deviceId || '').trim().toUpperCase();

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const device = await UserDevice.findOne({ userId, deviceId, isActive: true }).select('+tokenHash');
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found for this account.' });
    }

    const preDevice = await PreRegisteredDevice.findOne({ deviceId }).select('+deviceSecret');
    if (!preDevice?.deviceSecret) {
      return res.status(404).json({ success: false, message: 'Device secret not found for this device.' });
    }

    const now = new Date();

    device.tokenHash = hashValue(preDevice.deviceSecret);
    device.tokenIssuedAt = now;
    await device.save();

    return res.json({
      success: true,
      device: {
        deviceId,
        deviceToken: preDevice.deviceSecret,
        deviceSecret: preDevice.deviceSecret,
        rotatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function unpairDevice(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const deviceId = String(req.params?.deviceId || '').trim().toUpperCase();

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const device = await UserDevice.findOne({ userId, deviceId, isActive: true }).select('+tokenHash +pairingCodeHash');
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found for this account.' });
    }

    device.isActive = false;
    device.tokenHash = null;
    device.tokenIssuedAt = null;
    device.pairingCodeHash = null;
    device.pairingCodeExpiresAt = null;
    await device.save();

    await DeviceStatus.findOneAndUpdate(
      { deviceId },
      { online: false },
      { new: true }
    );

    return res.json({ success: true, message: 'Device unpaired successfully.' });
  } catch (error) {
    return next(error);
  }
}

export async function forcePairDevice(req, res, next) {
  try {
    const { deviceId, userId, displayName } = req.body;
    const adminId = req.auth?.userId;

    if (!deviceId || !userId) {
      return res.status(400).json({ success: false, message: 'deviceId and userId are required.' });
    }

    const normalizedDeviceId = String(deviceId).trim().toUpperCase();

    // Ensure device is pre-registered
    const preDevice = await PreRegisteredDevice.findOne({ deviceId: normalizedDeviceId });
    if (!preDevice) {
      return res.status(404).json({ success: false, message: 'Device not pre-registered.' });
    }

    const now = new Date();
    const tokenHash = hashValue(preDevice.deviceSecret);

    const binding = await UserDevice.findOneAndUpdate(
      { deviceId: normalizedDeviceId },
      {
        userId,
        deviceId: normalizedDeviceId,
        displayName: displayName || preDevice.displayName || normalizedDeviceId,
        tokenHash,
        tokenIssuedAt: now,
        lastSeenAt: now,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    await DeviceStatus.findOneAndUpdate(
      { deviceId: normalizedDeviceId },
      { online: true, lastSeen: now },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: `Device ${normalizedDeviceId} force-paired to user ${userId}`,
      device: {
        deviceId: normalizedDeviceId,
        deviceToken: preDevice.deviceSecret,
        deviceSecret: preDevice.deviceSecret,
        displayName: binding.displayName,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminUnpairDevice(req, res, next) {
  try {
    const deviceId = String(req.params?.deviceId || req.body?.deviceId || '').trim().toUpperCase();

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const device = await UserDevice.findOne({ deviceId, isActive: true });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Active device binding not found.' });
    }

    device.isActive = false;
    device.tokenHash = null;
    device.tokenIssuedAt = null;
    await device.save();

    await DeviceStatus.findOneAndUpdate(
      { deviceId },
      { online: false },
      { new: true }
    );

    return res.json({ success: true, message: `Device ${deviceId} force-unpaired by admin.` });
  } catch (error) {
    return next(error);
  }
}
