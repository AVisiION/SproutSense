import { ACCOUNT_STATUS, AUTH_ROUTE_ALLOWLIST_FOR_PENDING } from '../config/rbac.js';

export default function requireAccountState() {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (user.accountStatus === ACCOUNT_STATUS.ACTIVE) {
      return next();
    }

    if (user.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
      const isAllowed = AUTH_ROUTE_ALLOWLIST_FOR_PENDING.some((path) => req.path.startsWith(path.replace('/api', '')));
      if (isAllowed) return next();
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource.',
        code: ACCOUNT_STATUS.PENDING_VERIFICATION,
      });
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code: ACCOUNT_STATUS.SUSPENDED,
      });
    }

    if (user.accountStatus === ACCOUNT_STATUS.DISABLED) {
      return res.status(403).json({
        success: false,
        message: 'Your account is disabled.',
        code: ACCOUNT_STATUS.DISABLED,
      });
    }

    return res.status(403).json({ success: false, message: 'Account is not active.' });
  };
}
