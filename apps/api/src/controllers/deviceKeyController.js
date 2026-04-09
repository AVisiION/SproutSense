import crypto from 'crypto';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';

function generateProvisioningSeed() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

function formatPairingKey(seed) {
  const normalized = String(seed || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fallback = generateProvisioningSeed();
  const source = normalized || fallback;
  const suffix = source.slice(0, 20).padEnd(20, fallback[0]);
  return `PAIR-${suffix.slice(0, 5)}-${suffix.slice(5, 10)}-${suffix.slice(10, 15)}-${suffix.slice(15, 20)}`;
}

function generateDeviceSecret(seed) {
  const normalized = String(seed || '').trim().toUpperCase();
  return crypto.createHash('sha256').update(`device-secret:${normalized}`).digest('hex').toUpperCase();
}

function normalizeSecret(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export async function createPreRegisteredDevice(req, res, next) {
  try {
    const deviceId = String(req.body?.deviceId || '').trim().toUpperCase();
    const displayName = String(req.body?.displayName || '').trim();
    const existingPairingKey = String(req.body?.pairingKey || '').trim().toUpperCase();
    const existingDeviceSecret = normalizeSecret(req.body?.deviceSecret);
    const provisioningSeed = String(req.body?.provisioningSeed || '').trim().toUpperCase() || null;
    const seed = provisioningSeed || generateProvisioningSeed();
    const derivedPairingKey = formatPairingKey(seed);
    const pairingKey = existingPairingKey || derivedPairingKey;
    const deviceSecret = existingDeviceSecret || generateDeviceSecret(seed);

    if (provisioningSeed && existingPairingKey && existingPairingKey !== derivedPairingKey) {
      return res.status(400).json({
        success: false,
        message: 'pairingKey does not match the provided provisioningSeed.',
      });
    }

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const existing = await PreRegisteredDevice.findOne({ deviceId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Device already registered.' });
    }

    const device = await PreRegisteredDevice.create({
      deviceId,
      pairingKey,
      deviceSecret,
      displayName: displayName || deviceId,
      isActive: true,
    });

    return res.json({
      success: true,
      device: {
        id: String(device._id),
        deviceId: device.deviceId,
        pairingKey: device.pairingKey,
        deviceToken: pairingKey,
        // Backward-compatible alias for legacy clients.
        deviceSecret,
        pairingKey,
        deviceSecretHex: deviceSecret,
        displayName: device.displayName,
        isActive: device.isActive,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listPreRegisteredDevices(req, res, next) {
  try {
    const devices = await PreRegisteredDevice.aggregate([
      {
        $lookup: {
          from: 'userdevices', // MongoDB collection name for UserDevice
          localField: 'deviceId',
          foreignField: 'deviceId',
          as: 'pairingInfo'
        }
      },
      {
        $unwind: {
          path: '$pairingInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users', // MongoDB collection name for User
          localField: 'pairingInfo.userId',
          foreignField: '_id',
          as: 'owner'
        }
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          deviceSecret: 0,
          'owner.passwordHash': 0,
          'owner.passwordChangedAt': 0,
          'owner.failedLoginCount': 0,
          'owner.lockUntil': 0,
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Format the response to be cleaner for the frontend
    const formatted = devices.map(d => ({
      ...d,
      isLinked: Boolean(d.pairingInfo && d.pairingInfo.isActive),
      lastSeenAt: d.pairingInfo?.lastSeenAt || null,
      linkedUser: d.owner && d.pairingInfo?.isActive ? {
        fullName: d.owner.fullName,
        email: d.owner.email,
        id: String(d.owner._id)
      } : null,
      // Clean up the raw join objects for a cleaner API response
      pairingInfo: undefined,
      owner: undefined
    }));

    return res.json({ success: true, devices: formatted });
  } catch (error) {
    return next(error);
  }
}

export async function batchDeletePreRegisteredDevices(req, res, next) {
  try {
    const { deviceIds } = req.body;

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of deviceIds is required.' });
    }

    const result = await PreRegisteredDevice.deleteMany({
      deviceId: { $in: deviceIds.map(id => String(id || '').trim().toUpperCase()) }
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} devices.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return next(error);
  }
}

export async function deletePreRegisteredDevice(req, res, next) {
  try {
    const deviceId = String(req.params?.deviceId || '').trim().toUpperCase();

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const result = await PreRegisteredDevice.findOneAndDelete({ deviceId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    return res.json({ success: true, message: 'Device deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

export async function togglePreRegisteredDeviceStatus(req, res, next) {
  try {
    const deviceId = String(req.params?.deviceId || '').trim().toUpperCase();

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const device = await PreRegisteredDevice.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    device.isActive = !device.isActive;
    await device.save();

    return res.json({
      success: true,
      device: {
        deviceId: device.deviceId,
        displayName: device.displayName,
        isActive: device.isActive,
      },
    });
  } catch (error) {
    return next(error);
  }
}
