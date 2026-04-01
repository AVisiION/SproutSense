import User from '../models/User.js';
import Role from '../models/Role.js';
import { verifyAccessToken } from '../Services/tokenService.js';

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+passwordHash').lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authentication session.' });
    }

    const role = await Role.findById(user.roleId).lean();
    if (!role) {
      return res.status(401).json({ success: false, message: 'Role not found for authenticated user.' });
    }

    req.auth = {
      userId: String(user._id),
      roleId: String(role._id),
      roleKey: role.key,
    };
    req.user = { ...user, role };

    return next();
  } catch (error) {
    return next(error);
  }
}
