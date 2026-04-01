import { userHasPermissions } from '../Services/rbacService.js';

export default function requirePermissions(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const ok = await userHasPermissions(user, requiredPermissions);
      if (!ok) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.',
          requiredPermissions,
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
