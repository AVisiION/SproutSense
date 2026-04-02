import crypto from 'crypto';
import DeviceStatus from '../models/DeviceStatus.js';
import UserDevice from '../models/UserDevice.js';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';

function hashValue(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

function extractIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || null;
}

export async function pairDevice(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const deviceId = String(req.body?.deviceId || '').trim().toUpperCase();
    const deviceSecret = String(req.body?.deviceSecret || '').trim();
    const displayName = String(req.body?.displayName || '').trim();
    const firmwareVersion = String(req.body?.firmwareVersion || '').trim() || null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!deviceId || !deviceSecret) {
      return res.status(400).json({ success: false, message: 'deviceId and deviceSecret are required.' });
    }

    // Validate against pre-registered device
    const preDevice = await PreRegisteredDevice.findOne({
      deviceId,
      isActive: true,
    }).select('+deviceSecret');

    if (!preDevice) {
      return res.status(404).json({ success: false, message: 'Device not found. Please check deviceId.' });
    }

    // Verify secret matches
    if (preDevice.deviceSecret !== deviceSecret) {
      return res.status(401).json({ success: false, message: 'Invalid device secret.' });
    }

    // Check if device already paired to another user
    const existingBinding = await UserDevice.findOne({ deviceId });
    if (existingBinding && String(existingBinding.userId) !== String(userId)) {
      return res.status(409).json({ success: false, message: 'This device is already paired to another user.' });
    }

    const now = new Date();
    const deviceToken = generateDeviceToken();
    const tokenHash = hashValue(deviceToken);

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
        deviceToken,
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

    const now = new Date();
    const deviceToken = generateDeviceToken();

    device.tokenHash = hashValue(deviceToken);
    device.tokenIssuedAt = now;
    await device.save();

    return res.json({
      success: true,
      device: {
        deviceId,
        deviceToken,
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
