export const ROLE_KEYS = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
};

export const ACCOUNT_STATUS = {
  PENDING_VERIFICATION: 'pending_verification',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
};

export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',
  SENSORS_READ: 'sensors.read',
  SENSORS_CONTROL: 'sensors.control',
  WATERING_START: 'watering.start',
  WATERING_STOP: 'watering.stop',
  WATERING_READ: 'watering.read',
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_CONFIGURE: 'analytics.configure',
  AI_CHAT: 'ai.chat',
  AI_INSIGHTS_READ: 'ai.insights.read',
  AI_DISEASE_SUBMIT: 'ai.disease.submit',
  AI_DISEASE_READ: 'ai.disease.read',
  CONFIG_READ: 'config.read',
  CONFIG_UPDATE: 'config.update',
  PROFILE_READ: 'profile.read',
  PROFILE_UPDATE: 'profile.update',
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DISABLE: 'users.disable',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',
};

export const ROLE_PRIORITY = {
  [ROLE_KEYS.VIEWER]: 10,
  [ROLE_KEYS.USER]: 20,
  [ROLE_KEYS.ADMIN]: 30,
};

export const ROLE_PERMISSION_MAP = {
  [ROLE_KEYS.VIEWER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.WATERING_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.AI_INSIGHTS_READ,
    PERMISSIONS.AI_DISEASE_READ,
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.PROFILE_READ,
  ],
  [ROLE_KEYS.USER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.SENSORS_CONTROL,
    PERMISSIONS.WATERING_READ,
    PERMISSIONS.WATERING_START,
    PERMISSIONS.WATERING_STOP,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.AI_CHAT,
    PERMISSIONS.AI_INSIGHTS_READ,
    PERMISSIONS.AI_DISEASE_READ,
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_UPDATE,
  ],
  [ROLE_KEYS.ADMIN]: Object.values(PERMISSIONS),
};

export const ACCOUNT_STATUS_BLOCKED = [
  ACCOUNT_STATUS.SUSPENDED,
  ACCOUNT_STATUS.DISABLED,
];

export const AUTH_ROUTE_ALLOWLIST_FOR_PENDING = [
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/logout',
  '/api/auth/me',
];
