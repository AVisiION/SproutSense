import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import config from '../config/config.js';
import { sanitizePreferredPlant } from '../config/plants.js';
import { ACCOUNT_STATUS, ROLE_KEYS, PERMISSIONS } from '../config/rbac.js';
import AdminLog from '../models/AdminLog.js';
import AuthToken from '../models/AuthToken.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { sendResetPasswordEmail, sendVerificationEmail } from '../Services/emailService.js';
import { evaluatePasswordStrength, validatePasswordPolicy } from '../Services/passwordPolicyService.js';
import { getPermissionKeysForRoleId } from '../Services/rbacService.js';
import { createAccessToken, generateOpaqueToken, hashOpaqueToken } from '../Services/tokenService.js';

const REFRESH_TOKEN_TTL_DAYS = 30;
const VERIFY_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_MINUTES = 30;

function tokenExpiryDate(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function toSafeUser(user, role) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    preferredPlant: user.preferredPlant,
    sensorDataVisible: user.sensorDataVisible !== false,
    role: role?.key,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    uiPreferences: user.uiPreferences || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

async function issueSessionForUser(user, req) {
  const role = await Role.findById(user.roleId).lean();
  const permissionKeys = await getPermissionKeysForRoleId(user.roleId);
  const effectivePermissions = user.sensorDataVisible === false
    ? permissionKeys.filter((perm) => perm !== PERMISSIONS.SENSORS_READ)
    : permissionKeys;
  const accessToken = createAccessToken({
    sub: String(user._id),
    role: role.key,
    status: user.accountStatus,
  });

  const refreshTokenRaw = generateOpaqueToken();
  const refreshTokenHash = hashOpaqueToken(refreshTokenRaw);

  await AuthToken.create({
    userId: user._id,
    type: 'refresh',
    tokenHash: refreshTokenHash,
    expiresAt: tokenExpiryDate(REFRESH_TOKEN_TTL_DAYS * 24 * 60),
    ip: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
  });

  return {
    accessToken,
    refreshToken: refreshTokenRaw,
    user: toSafeUser(user, role),
    permissions: effectivePermissions,
  };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, confirmPassword, preferredPlant } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'fullName, email, password, and confirmPassword are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm password do not match.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const defaultRole = await Role.findOne({ key: ROLE_KEYS.USER });
    if (!defaultRole) {
      return res.status(500).json({ success: false, message: 'Default user role not configured.' });
    }

    const policy = validatePasswordPolicy({ password, fullName, email: normalizedEmail, isPrivileged: false });
    if (!policy.ok) {
      return res.status(400).json({ success: false, message: policy.message, strength: policy.strength });
    }

    const passwordHash = await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: defaultRole._id,
      preferredPlant: sanitizePreferredPlant(preferredPlant),
      accountStatus: ACCOUNT_STATUS.PENDING_VERIFICATION,
      emailVerified: false,
    });

    const verifyTokenRaw = generateOpaqueToken();
    await AuthToken.create({
      userId: user._id,
      type: 'email_verify',
      tokenHash: hashOpaqueToken(verifyTokenRaw),
      expiresAt: tokenExpiryDate(VERIFY_TOKEN_TTL_HOURS * 60),
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await sendVerificationEmail({ email: user.email, token: verifyTokenRaw });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Verify your email to activate your account.',
      user: toSafeUser(user, defaultRole),
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if request comes from admin IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';
    const isAdminIp = config.ADMIN_IPS.includes(clientIp);

    if (user.isLocked && !isAdminIp) {
      return res.status(423).json({ success: false, message: 'Account is temporarily locked due to failed login attempts.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      // Only track failed attempts for non-admin IPs
      if (!isAdminIp) {
        const failedCount = (user.failedLoginCount || 0) + 1;
        const updates = { failedLoginCount: failedCount };
        if (failedCount >= 5) {
          updates.lockUntil = tokenExpiryDate(15);
        }
        await User.updateOne({ _id: user._id }, { $set: updates });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.', code: ACCOUNT_STATUS.PENDING_VERIFICATION });
    }

    if ([ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.DISABLED].includes(user.accountStatus)) {
      return res.status(403).json({ success: false, message: `Account is ${user.accountStatus}.`, code: user.accountStatus });
    }

    user.failedLoginCount = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const session = await issueSessionForUser(user, req);
    return res.json({ success: true, message: 'Login successful.', ...session });
  } catch (error) {
    return next(error);
  }
}

export async function refreshSession(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const tokenHash = hashOpaqueToken(refreshToken);
    const stored = await AuthToken.findOne({ tokenHash, type: 'refresh', usedAt: null });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session user.' });
    }

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(403).json({ success: false, message: 'Account is not active.', code: user.accountStatus });
    }

    stored.usedAt = new Date();
    await stored.save();

    const session = await issueSessionForUser(user, req);
    return res.json({ success: true, ...session });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthToken.updateOne(
        { tokenHash: hashOpaqueToken(refreshToken), type: 'refresh' },
        { $set: { usedAt: new Date() } }
      );
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const tokenHash = hashOpaqueToken(token);
    const stored = await AuthToken.findOne({ tokenHash, type: 'email_verify', usedAt: null });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token is invalid or expired.' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for verification.' });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    stored.usedAt = new Date();
    await stored.save();

    return res.json({ success: true, message: 'Email verified successfully. Your account is now active.' });
  } catch (error) {
    return next(error);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If the account exists, a verification email has been sent.' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email is already verified.' });
    }

    const verifyTokenRaw = generateOpaqueToken();
    await AuthToken.create({
      userId: user._id,
      type: 'email_verify',
      tokenHash: hashOpaqueToken(verifyTokenRaw),
      expiresAt: tokenExpiryDate(VERIFY_TOKEN_TTL_HOURS * 60),
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await sendVerificationEmail({ email: user.email, token: verifyTokenRaw });
    return res.json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (user) {
      const resetTokenRaw = generateOpaqueToken();
      await AuthToken.create({
        userId: user._id,
        type: 'reset_password',
        tokenHash: hashOpaqueToken(resetTokenRaw),
        expiresAt: tokenExpiryDate(RESET_TOKEN_TTL_MINUTES),
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });

      await sendResetPasswordEmail({ email: user.email, token: resetTokenRaw });
    }

    return res.json({ success: true, message: 'If that account exists, a reset link has been sent.' });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'token, password, and confirmPassword are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm password do not match.' });
    }

    const tokenHash = hashOpaqueToken(token);
    const stored = await AuthToken.findOne({ tokenHash, type: 'reset_password', usedAt: null });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired.' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const role = await Role.findById(user.roleId).lean();
    const policy = validatePasswordPolicy({
      password,
      fullName: user.fullName,
      email: user.email,
      isPrivileged: role?.key === ROLE_KEYS.ADMIN,
    });

    if (!policy.ok) {
      return res.status(400).json({ success: false, message: policy.message, strength: policy.strength });
    }

    user.passwordHash = await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    user.failedLoginCount = 0;
    user.lockUntil = null;
    await user.save();

    stored.usedAt = new Date();
    await stored.save();

    await AuthToken.updateMany({ userId: user._id, type: 'refresh', usedAt: null }, { $set: { usedAt: new Date() } });

    return res.json({ success: true, message: 'Password reset successful. Please log in again.' });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const role = await Role.findById(user.roleId).lean();
    const permissions = await getPermissionKeysForRoleId(user.roleId);
    const effectivePermissions = user.sensorDataVisible === false
      ? permissions.filter((perm) => perm !== PERMISSIONS.SENSORS_READ)
      : permissions;

    return res.json({
      success: true,
      user: toSafeUser(user, role),
      permissions: effectivePermissions,
    });
  } catch (error) {
    return next(error);
  }
}

export async function impersonateUser(req, res, next) {
  try {
    const actorId = req.auth?.userId;
    const { userId } = req.body || {};

    if (!actorId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ success: false, message: 'Valid target userId is required.' });
    }

    const actor = await User.findById(actorId).lean();
    if (!actor) {
      return res.status(401).json({ success: false, message: 'Authenticated admin not found.' });
    }

    if (String(actor._id) === String(userId)) {
      return res.status(400).json({ success: false, message: 'Cannot impersonate your own account.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    if (targetUser.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: `Cannot impersonate a ${targetUser.accountStatus} account.`,
      });
    }

    const session = await issueSessionForUser(targetUser, req);

    await AdminLog.create({
      actor: actor.email || actor.fullName || 'admin',
      action: 'Impersonation started',
      level: 'warning',
      section: 'auth',
      details: {
        actorUserId: String(actor._id),
        targetUserId: String(targetUser._id),
        targetEmail: targetUser.email,
        targetRoleId: String(targetUser.roleId),
      },
    });

    return res.json({
      success: true,
      message: `Now impersonating ${targetUser.fullName || targetUser.email}`,
      impersonation: {
        actorUserId: String(actor._id),
        actorName: actor.fullName || actor.email || 'Admin',
        targetUserId: String(targetUser._id),
        targetName: targetUser.fullName || targetUser.email || 'User',
        startedAt: new Date().toISOString(),
      },
      ...session,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { preferredPlant } = req.body || {};
    user.preferredPlant = sanitizePreferredPlant(preferredPlant);
    await user.save();

    const role = await Role.findById(user.roleId).lean();
    const permissions = await getPermissionKeysForRoleId(user.roleId);
    const effectivePermissions = user.sensorDataVisible === false
      ? permissions.filter((perm) => perm !== PERMISSIONS.SENSORS_READ)
      : permissions;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: toSafeUser(user, role),
      permissions: effectivePermissions,
    });
  } catch (error) {
    return next(error);
  }
}

export async function passwordStrength(req, res, next) {
  try {
    const { password = '', fullName = '', email = '' } = req.body || {};
    const strength = evaluatePasswordStrength(password, { fullName, email });
    return res.json({ success: true, strength });
  } catch (error) {
    return next(error);
  }
}
