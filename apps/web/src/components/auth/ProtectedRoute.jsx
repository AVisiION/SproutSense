import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ACCOUNT_STATUS } from '../../auth/permissions';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, requiredPermissions = [] }) {
  const location = useLocation();
  const { loading, isAuthenticated, accountStatus, hasPermission } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-color)' }}>Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  if (accountStatus === ACCOUNT_STATUS.SUSPENDED || accountStatus === ACCOUNT_STATUS.DISABLED) {
    return <Navigate to="/access-denied" replace state={{ reason: accountStatus }} />;
  }

  if (requiredPermissions.length > 0) {
    const allowed = requiredPermissions.every((permission) => hasPermission(permission));
    if (!allowed) {
      return <Navigate to="/access-denied" replace state={{ reason: 'permission_denied' }} />;
    }
  }

  return children;
}

export default ProtectedRoute;
