import { ACCOUNT_STATUS, ROLE_KEYS } from '../config/rbac.js';
import bcrypt from 'bcryptjs';
import config from '../config/config.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { validatePasswordPolicy } from '../Services/passwordPolicyService.js';

function safeUser(user, roleById) {
  const role = roleById.get(String(user.roleId));
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    preferredPlant: user.preferredPlant || 'tomato',
    sensorDataVisible: user.sensorDataVisible !== false,
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

export async function createUser(req, res, next) {
  try {
    const {
      fullName,
      email,
      password,
      roleKey = ROLE_KEYS.USER,
      accountStatus = ACCOUNT_STATUS.ACTIVE,
      emailVerified = true,
      sensorDataVisible = true,
    } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email, and password are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const normalizedRoleKey = String(roleKey).toLowerCase();
    const role = await Role.findOne({ key: normalizedRoleKey });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    if (!Object.values(ACCOUNT_STATUS).includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid accountStatus value.' });
    }

    const policy = validatePasswordPolicy({
      password,
      fullName,
      email: normalizedEmail,
      isPrivileged: normalizedRoleKey === ROLE_KEYS.ADMIN,
    });
    if (!policy.ok) {
      return res.status(400).json({ success: false, message: policy.message, strength: policy.strength });
    }

    const passwordHash = await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);
    const verified = Boolean(emailVerified);
    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: role._id,
      accountStatus,
      emailVerified: verified,
      emailVerifiedAt: verified ? new Date() : null,
      sensorDataVisible: sensorDataVisible !== false,
    });

    const roleById = new Map([[String(role._id), role]]);
    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: safeUser(user, roleById),
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

export async function updateUserSensorVisibility(req, res, next) {
  try {
    const { userId } = req.params;
    const { sensorDataVisible } = req.body || {};

    if (typeof sensorDataVisible !== 'boolean') {
      return res.status(400).json({ success: false, message: 'sensorDataVisible must be a boolean.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.sensorDataVisible = sensorDataVisible;
    await user.save();

    return res.json({
      success: true,
      message: `Sensor data ${sensorDataVisible ? 'enabled' : 'hidden'} for user.`,
      sensorDataVisible,
    });
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

export async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (String(req.auth?.userId || '') === String(userId)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account from this panel.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.deleteOne({ _id: user._id });

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}
