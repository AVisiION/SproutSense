import express from 'express';
import {
	createUser,
	deleteUser,
	listUsers,
	updateUserAccountStatus,
	updateUserRole,
	updateUserSensorVisibility,
} from '../controllers/userAdminController.js';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';

const router = express.Router();

router.use(authenticate, requireAccountState());

router.get('/', requirePermissions([PERMISSIONS.USERS_READ]), listUsers);
router.post('/', requirePermissions([PERMISSIONS.USERS_CREATE]), createUser);
router.patch('/:userId/role', requirePermissions([PERMISSIONS.USERS_UPDATE]), updateUserRole);
router.patch('/:userId/sensor-visibility', requirePermissions([PERMISSIONS.USERS_UPDATE]), updateUserSensorVisibility);
router.patch('/:userId/account-status', requirePermissions([PERMISSIONS.USERS_DISABLE]), updateUserAccountStatus);
router.delete('/:userId', requirePermissions([PERMISSIONS.USERS_DISABLE]), deleteUser);

export default router;
