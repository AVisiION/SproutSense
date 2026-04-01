export const ROLE = {
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

export const PERMISSION = {
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
  AI_DISEASE_READ: 'ai.disease.read',
  CONFIG_READ: 'config.read',
  CONFIG_UPDATE: 'config.update',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DISABLE: 'users.disable',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',
  PROFILE_READ: 'profile.read',
  PROFILE_UPDATE: 'profile.update',
};

export function homeForRole(role) {
  if (role === ROLE.ADMIN) return '/home';
  if (role === ROLE.USER) return '/home';
  return '/home';
}
