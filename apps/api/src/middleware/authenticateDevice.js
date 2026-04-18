import crypto from 'crypto';
import UserDevice from '../models/UserDevice.js';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';

function hashToken(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export default async function authenticateDevice(req, res, next) {
  try {
    const headerDeviceId = String(req.headers['x-device-id'] || '').trim();
    const bodyDeviceId = String(req.body?.deviceId || '').trim();
    const rawDeviceId = headerDeviceId || bodyDeviceId;
    const deviceId = rawDeviceId.toUpperCase();

    const headerSecret = String(req.headers['x-device-secret'] || req.headers['x-device-token'] || '').trim();
    const bodySecret = String(req.body?.deviceSecret || req.body?.deviceToken || '').trim();
    const deviceSecret = headerSecret || bodySecret;

    if (!deviceId) {
      return res.status(401).json({
        success: false,
        message: 'Device authentication required (x-device-id).',
      });
    }

    if (!deviceSecret) {
      return res.status(401).json({
        success: false,
        message: 'Device authentication required (x-device-secret).',
      });
    }

    let isUserDevice = false;
    let expectedTokenHash = null;
    let userId = null;
    let userDeviceId = null;

    const device = await UserDevice.findOne({ deviceId, isActive: true }).select('+tokenHash').lean();

    if (device) {
      isUserDevice = true;
      expectedTokenHash = device.tokenHash;
      userId = String(device.userId);
      userDeviceId = String(device._id);
    } else {
      const preDevice = await PreRegisteredDevice.findOne({ deviceId, isActive: true }).select('+deviceSecret').lean();
      
      if (!preDevice) {
        return res.status(401).json({ success: false, message: 'Unknown or inactive device.' });
      }
      if (!preDevice.deviceSecret) {
        return res.status(401).json({ success: false, message: 'Device token is not configured.' });
      }
      
      expectedTokenHash = hashToken(preDevice.deviceSecret);
    }

    if (!expectedTokenHash) {
      return res.status(401).json({ success: false, message: 'Device token is not configured.' });
    }

    const providedTokenHash = hashToken(deviceSecret);
    if (providedTokenHash !== expectedTokenHash) {
      return res.status(401).json({ success: false, message: 'Invalid device authentication value.' });
    }

    req.deviceAuth = {
      userId: userId,
      deviceId,
      userDeviceId: userDeviceId,
      isPreRegisteredOnly: !isUserDevice
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
