import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
	getMyDevices,
	pairDevice,
	rotateDeviceToken,
	unpairDevice,
} from '../controllers/deviceController.js';
import {
	createPreRegisteredDevice,
	listPreRegisteredDevices,
	deletePreRegisteredDevice,
	batchDeletePreRegisteredDevices,
	togglePreRegisteredDeviceStatus,
} from '../controllers/deviceKeyController.js';

const router = express.Router();

// Pair device with pre-shared secret (requires authentication)
router.post('/pair', authenticate, requireAccountState(), pairDevice);

router.use(authenticate, requireAccountState());

router.get('/mine', requirePermissions([PERMISSIONS.PROFILE_READ]), getMyDevices);
router.post('/:deviceId/rotate-token', requirePermissions([PERMISSIONS.PROFILE_UPDATE]), rotateDeviceToken);
router.delete('/:deviceId', requirePermissions([PERMISSIONS.PROFILE_UPDATE]), unpairDevice);

// Device key management (admin only - requires CONFIG_UPDATE permission)
router.post('/keys/create', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), createPreRegisteredDevice);
router.get('/keys/list', requirePermissions([PERMISSIONS.CONFIG_READ]), listPreRegisteredDevices);
router.delete('/keys/batch', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), batchDeletePreRegisteredDevices);
router.delete('/keys/:deviceId', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), deletePreRegisteredDevice);
router.patch('/keys/:deviceId/toggle', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), togglePreRegisteredDeviceStatus);

export default router;
