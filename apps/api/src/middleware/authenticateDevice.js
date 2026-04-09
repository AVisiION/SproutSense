import crypto from 'crypto';
import UserDevice from '../models/UserDevice.js';

function hashToken(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export default async function authenticateDevice(req, res, next) {
  try {
    const headerDeviceId = String(req.headers['x-device-id'] || '').trim();
    const bodyDeviceId = String(req.body?.deviceId || '').trim();
    const rawDeviceId = headerDeviceId || bodyDeviceId;
    const deviceId = rawDeviceId.toUpperCase();

    const headerToken = String(req.headers['x-device-token'] || '').trim();
    const bodyToken = String(req.body?.deviceToken || '').trim();
    const deviceToken = headerToken || bodyToken || deviceId;

    if (!deviceId) {
      return res.status(401).json({
        success: false,
        message: 'Device authentication required (x-device-id).',
      });
    }

    const device = await UserDevice.findOne({ deviceId, isActive: true }).select('+tokenHash').lean();
    if (!device?.tokenHash) {
      return res.status(401).json({ success: false, message: 'Unknown or inactive device.' });
    }

    const tokenHash = hashToken(deviceToken);
    if (tokenHash !== device.tokenHash) {
      return res.status(401).json({ success: false, message: 'Invalid device authentication value.' });
    }

    req.deviceAuth = {
      userId: String(device.userId),
      deviceId,
      userDeviceId: String(device._id),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
