import UserDevice from '../models/UserDevice.js';

export default function requireLinkedDevice() {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const linkedCount = await UserDevice.countDocuments({ userId, isActive: true });
      if (linkedCount < 1) {
        return res.status(403).json({
          success: false,
          message: 'Link a device from Settings before accessing Intelligence Hub.',
          code: 'DEVICE_REQUIRED',
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}