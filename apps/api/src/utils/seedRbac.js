import bcrypt from 'bcryptjs';
import { ACCOUNT_STATUS, PERMISSIONS, ROLE_KEYS, ROLE_PERMISSION_MAP, ROLE_PRIORITY } from '../config/rbac.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

function splitPermissionKey(key) {
  const [resource, action] = key.split('.');
  return { resource, action };
}

async function seedEnvAdminUser(roleIdByKey) {
  const adminEmailRaw = process.env.ADMIN_EMAIL || '';
  const adminPasswordRaw = process.env.ADMIN_PASSWORD || '';

  if (!adminEmailRaw || !adminPasswordRaw) {
    return;
  }

  const adminRoleId = roleIdByKey.get(ROLE_KEYS.ADMIN);
  if (!adminRoleId) {
    console.warn('[RBAC] ADMIN role not found while seeding env admin user.');
    return;
  }

  const adminEmail = String(adminEmailRaw).trim().toLowerCase();
  const adminFullName = String(process.env.ADMIN_FULL_NAME || 'System Administrator').trim();
  const forcePasswordUpdate = String(process.env.ADMIN_FORCE_PASSWORD_UPDATE || 'false').toLowerCase() === 'true';

  const existing = await User.findOne({ email: adminEmail }).select('+passwordHash');

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPasswordRaw, 10);
    await User.create({
      fullName: adminFullName,
      email: adminEmail,
      passwordHash,
      roleId: adminRoleId,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    console.log(`[RBAC] Seeded bootstrap admin user: ${adminEmail}`);
    return;
  }

  const updates = {
    fullName: adminFullName,
    roleId: adminRoleId,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    emailVerified: true,
    emailVerifiedAt: existing.emailVerifiedAt || new Date(),
    failedLoginCount: 0,
    lockUntil: null,
  };

  if (forcePasswordUpdate) {
    updates.passwordHash = await bcrypt.hash(adminPasswordRaw, 10);
    updates.passwordChangedAt = new Date();
  }

  await User.updateOne({ _id: existing._id }, { $set: updates });
  console.log(`[RBAC] Synced bootstrap admin user from env: ${adminEmail}`);
}

export async function seedRbac() {
  const roleDocs = [
    { key: ROLE_KEYS.ADMIN, name: 'Administrator', description: 'Full management access', priority: ROLE_PRIORITY[ROLE_KEYS.ADMIN], isSystem: true },
    { key: ROLE_KEYS.USER, name: 'User', description: 'Standard authenticated access', priority: ROLE_PRIORITY[ROLE_KEYS.USER], isSystem: true },
    { key: ROLE_KEYS.VIEWER, name: 'Viewer', description: 'Read-only access', priority: ROLE_PRIORITY[ROLE_KEYS.VIEWER], isSystem: true },
  ];

  for (const role of roleDocs) {
    await Role.updateOne({ key: role.key }, { $set: role }, { upsert: true });
  }

  const allPermissionKeys = Object.values(PERMISSIONS);
  for (const key of allPermissionKeys) {
    const { resource, action } = splitPermissionKey(key);
    await Permission.updateOne(
      { key },
      { $set: { key, resource, action, description: `${resource} ${action}` } },
      { upsert: true }
    );
  }

  const roles = await Role.find({ key: { $in: Object.values(ROLE_KEYS) } }).lean();
  const permissions = await Permission.find({ key: { $in: allPermissionKeys } }).lean();

  const roleIdByKey = new Map(roles.map((r) => [r.key, r._id]));
  const permissionIdByKey = new Map(permissions.map((p) => [p.key, p._id]));

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleIdByKey.get(roleKey);
    if (!roleId) continue;

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionIdByKey.get(permissionKey);
      if (!permissionId) continue;
      await RolePermission.updateOne(
        { roleId, permissionId },
        { $setOnInsert: { roleId, permissionId } },
        { upsert: true }
      );
    }
  }

  await seedEnvAdminUser(roleIdByKey);
}
