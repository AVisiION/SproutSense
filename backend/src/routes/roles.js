import express from 'express';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import RolePermission from '../models/RolePermission.js';

const router = express.Router();

router.use(authenticate, requireAccountState());

router.get('/', requirePermissions([PERMISSIONS.ROLES_READ]), async (req, res, next) => {
  try {
    const roles = await Role.find({}).sort({ priority: -1 }).lean();
    const permissions = await Permission.find({}).lean();
    const mappings = await RolePermission.find({}).lean();

    const permissionById = new Map(permissions.map((permission) => [String(permission._id), permission]));
    const rolePermissions = new Map();

    for (const mapping of mappings) {
      const key = String(mapping.roleId);
      const current = rolePermissions.get(key) || [];
      const permission = permissionById.get(String(mapping.permissionId));
      if (permission) current.push(permission.key);
      rolePermissions.set(key, current);
    }

    return res.json({
      success: true,
      roles: roles.map((role) => ({
        ...role,
        permissions: rolePermissions.get(String(role._id)) || [],
      })),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
