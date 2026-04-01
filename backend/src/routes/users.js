import express from 'express';
import { listUsers, updateUserAccountStatus, updateUserRole } from '../controllers/userAdminController.js';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';

const router = express.Router();

router.use(authenticate, requireAccountState());

router.get('/', requirePermissions([PERMISSIONS.USERS_READ]), listUsers);
router.patch('/:userId/role', requirePermissions([PERMISSIONS.USERS_UPDATE]), updateUserRole);
router.patch('/:userId/account-status', requirePermissions([PERMISSIONS.USERS_DISABLE]), updateUserAccountStatus);

export default router;
