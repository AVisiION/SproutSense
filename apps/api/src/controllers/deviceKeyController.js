import crypto from 'crypto';
import PreRegisteredDevice from '../models/PreRegisteredDevice.js';

function generateDeviceSecret() {
  return crypto.randomBytes(24).toString('hex');
}

export async function createPreRegisteredDevice(req, res, next) {
  try {
    const deviceId = String(req.body?.deviceId || '').trim().toUpperCase();
    const displayName = String(req.body?.displayName || '').trim();

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required.' });
    }

    const existing = await PreRegisteredDevice.findOne({ deviceId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Device already registered.' });
    }

    const deviceSecret = generateDeviceSecret();
    const device = await PreRegisteredDevice.create({
      deviceId,
      deviceSecret,
      displayName: displayName || deviceId,
      isActive: true,
    });

    return res.json({
      success: true,
      device: {
        id: String(device._id),
        deviceId: device.deviceId,
        deviceSecret,
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
    const devices = await PreRegisteredDevice.find().select('-deviceSecret').lean();
    return res.json({ success: true, devices });
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
