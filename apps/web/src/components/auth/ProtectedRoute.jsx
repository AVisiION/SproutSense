import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ACCOUNT_STATUS } from '../../auth/permissions';
import { useAuth } from '../../context/AuthContext';
import { deviceAPI } from '../../utils/api';

export function ProtectedRoute({ children, requiredPermissions = [], requireLinkedDevice = false }) {
  const location = useLocation();
  const { loading, isAuthenticated, accountStatus, hasPermission } = useAuth();
  const [isCheckingDevice, setIsCheckingDevice] = useState(requireLinkedDevice);
  const [hasLinkedDevice, setHasLinkedDevice] = useState(!requireLinkedDevice);

  useEffect(() => {
    let alive = true;

    async function checkLinkedDevice() {
      if (!requireLinkedDevice || !isAuthenticated) {
        if (!alive) return;
        setIsCheckingDevice(false);
        setHasLinkedDevice(true);
        return;
      }

      setIsCheckingDevice(true);
      try {
        const response = await deviceAPI.listMine();
        const devices = Array.isArray(response?.devices) ? response.devices : [];
        if (!alive) return;
        setHasLinkedDevice(devices.length > 0);
      } catch {
        if (!alive) return;
        setHasLinkedDevice(false);
      } finally {
        if (alive) {
          setIsCheckingDevice(false);
        }
      }
    }

    checkLinkedDevice();
    return () => {
      alive = false;
    };
  }, [requireLinkedDevice, isAuthenticated]);

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

  if (requireLinkedDevice) {
    if (isCheckingDevice) {
      return <div style={{ padding: '2rem', color: 'var(--text-color)' }}>Checking linked device...</div>;
    }

    if (!hasLinkedDevice) {
      return <Navigate to="/settings" replace state={{ reason: 'device_required', from: location.pathname }} />;
    }
  }

  return children;
}

export default ProtectedRoute;
