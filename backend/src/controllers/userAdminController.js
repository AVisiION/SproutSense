import { ACCOUNT_STATUS, ROLE_KEYS } from '../config/rbac.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

function safeUser(user, roleById) {
  const role = roleById.get(String(user.roleId));
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: role?.key || null,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(req, res, next) {
  try {
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const users = await User.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    const roles = await Role.find({}).lean();
    const roleById = new Map(roles.map((r) => [String(r._id), r]));

    return res.json({
      success: true,
      users: users.map((user) => safeUser(user, roleById)),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { roleKey } = req.body;

    if (!roleKey) {
      return res.status(400).json({ success: false, message: 'roleKey is required.' });
    }

    const role = await Role.findOne({ key: String(roleKey).toLowerCase() });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.roleId = role._id;
    await user.save();

    return res.json({ success: true, message: 'User role updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserAccountStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { accountStatus } = req.body;

    if (!Object.values(ACCOUNT_STATUS).includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid accountStatus value.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const adminRole = await Role.findOne({ key: ROLE_KEYS.ADMIN }).lean();
    if (adminRole && String(user.roleId) === String(adminRole._id) && accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: 'Cannot suspend/disable the default admin role user via this endpoint.' });
    }

    user.accountStatus = accountStatus;
    if (accountStatus === ACCOUNT_STATUS.ACTIVE && user.emailVerified) {
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    }
    await user.save();

    return res.json({ success: true, message: 'Account status updated successfully.' });
  } catch (error) {
    return next(error);
  }
}
