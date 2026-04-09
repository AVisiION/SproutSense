import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../utils/api';
import { ACCOUNT_STATUS, homeForRole, PERMISSION, ROLE } from '../auth/permissions';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'ss_access_token';
const REFRESH_TOKEN_KEY = 'ss_refresh_token';
const IMPERSONATION_STATE_KEY = 'ss_impersonation_state';
const ADMIN_ACCESS_TOKEN_BACKUP_KEY = 'ss_admin_access_token_backup';
const ADMIN_REFRESH_TOKEN_BACKUP_KEY = 'ss_admin_refresh_token_backup';

function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function clearImpersonationStorage() {
  localStorage.removeItem(IMPERSONATION_STATE_KEY);
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_BACKUP_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_BACKUP_KEY);
}

function readImpersonationState() {
  try {
    const raw = localStorage.getItem(IMPERSONATION_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonationState, setImpersonationState] = useState(() => (
    typeof window === 'undefined' ? null : readImpersonationState()
  ));

  // Parse preview user if present
  let previewRole = null;
  let previewUserNameFromUrl = null;
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('previewUser')) {
      const raw = searchParams.get('previewUser') || '';
      const previewParams = new URLSearchParams(raw);
      if (raw.includes('role=')) {
        previewRole = previewParams.get('role');
        previewUserNameFromUrl = previewParams.get('name');
      } else {
        previewRole = searchParams.get('role');
        previewUserNameFromUrl = searchParams.get('name');
      }
    }
  }

  const hydrate = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!accessToken && !refreshToken) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const meRes = await authAPI.me();
      setUser(meRes.user);
      setPermissions(meRes.permissions || []);
    } catch {
      if (!refreshToken) {
        clearTokens();
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const refreshRes = await authAPI.refresh({ refreshToken });
        setTokens(refreshRes.accessToken, refreshRes.refreshToken);
        setUser(refreshRes.user);
        setPermissions(refreshRes.permissions || []);
      } catch {
        clearTokens();
        setUser(null);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    if (res.accessToken && res.refreshToken) {
      clearImpersonationStorage();
      setImpersonationState(null);
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      setPermissions(res.permissions || []);
    }
    return res;
  }, []);

  const register = useCallback(async (payload) => authAPI.register(payload), []);
  const verifyEmail = useCallback(async (token) => authAPI.verifyEmail({ token }), []);
  const resendVerification = useCallback(async (email) => authAPI.resendVerification({ email }), []);
  const forgotPassword = useCallback(async (email) => authAPI.forgotPassword({ email }), []);
  const resetPassword = useCallback(async (payload) => authAPI.resetPassword(payload), []);
  const checkPasswordStrength = useCallback(async (payload) => authAPI.passwordStrength(payload), []);
  const updateProfile = useCallback(async (payload) => {
    const res = await authAPI.updateProfile(payload);
    if (res?.user) {
      setUser(res.user);
    }
    if (Array.isArray(res?.permissions)) {
      setPermissions(res.permissions);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await authAPI.logout({ refreshToken });
      }
    } catch {
      // best-effort logout
    } finally {
      clearImpersonationStorage();
      clearTokens();
      setUser(null);
      setPermissions([]);
      setImpersonationState(null);
    }
  }, []);

  const startImpersonation = useCallback(async ({ userId }) => {
    const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!currentAccessToken) {
      throw new Error('Admin session token missing. Please login again.');
    }

    const res = await authAPI.impersonate({ userId });

    localStorage.setItem(ADMIN_ACCESS_TOKEN_BACKUP_KEY, currentAccessToken);
    if (currentRefreshToken) {
      localStorage.setItem(ADMIN_REFRESH_TOKEN_BACKUP_KEY, currentRefreshToken);
    } else {
      localStorage.removeItem(ADMIN_REFRESH_TOKEN_BACKUP_KEY);
    }

    setTokens(res.accessToken, res.refreshToken);

    const nextImpersonationState = {
      ...(res.impersonation || {}),
      targetUserId: res.impersonation?.targetUserId || userId,
      targetName: res.impersonation?.targetName || res.user?.fullName || 'User',
    };

    localStorage.setItem(IMPERSONATION_STATE_KEY, JSON.stringify(nextImpersonationState));
    setImpersonationState(nextImpersonationState);
    setUser(res.user);
    setPermissions(res.permissions || []);

    return res;
  }, []);

  const exitImpersonation = useCallback(async () => {
    const adminAccessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_BACKUP_KEY);
    const adminRefreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_BACKUP_KEY);

    if (!adminAccessToken) {
      throw new Error('Original admin session was not found. Please login again.');
    }

    setTokens(adminAccessToken, adminRefreshToken || '');
    if (!adminRefreshToken) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    clearImpersonationStorage();
    setImpersonationState(null);

    const meRes = await authAPI.me();
    setUser(meRes.user);
    setPermissions(meRes.permissions || []);

    return meRes;
  }, []);

  const hasPermission = useCallback((permission) => {
    if (impersonationState?.targetUserId) {
      return permissions.includes(permission);
    }

    if (previewRole === ROLE.ADMIN) {
      return true;
    }

    if (previewRole === ROLE.VIEWER) {
      const viewerPerms = [
        PERMISSION.DASHBOARD_READ,
        PERMISSION.SENSORS_READ,
        PERMISSION.WATERING_READ,
        PERMISSION.ANALYTICS_READ,
        PERMISSION.AI_INSIGHTS_READ,
        PERMISSION.AI_DISEASE_READ,
        PERMISSION.CONFIG_READ,
        PERMISSION.PROFILE_READ,
      ];
      return viewerPerms.includes(permission);
    }

    if (previewRole === ROLE.USER) {
      const userPerms = [
        PERMISSION.DASHBOARD_READ,
        PERMISSION.SENSORS_READ,
        PERMISSION.SENSORS_CONTROL,
        PERMISSION.WATERING_READ,
        PERMISSION.WATERING_START,
        PERMISSION.WATERING_STOP,
        PERMISSION.ANALYTICS_READ,
        PERMISSION.AI_CHAT,
        PERMISSION.AI_INSIGHTS_READ,
        PERMISSION.AI_DISEASE_READ,
        PERMISSION.CONFIG_READ,
        PERMISSION.PROFILE_READ,
        PERMISSION.PROFILE_UPDATE,
      ];
      return userPerms.includes(permission);
    }
    return permissions.includes(permission);
  }, [permissions, previewRole, impersonationState]);

  const isAuthenticated = Boolean(user);
  const accountStatus = user?.accountStatus || null;
  const isImpersonating = Boolean(impersonationState?.targetUserId);
  const role = isImpersonating ? (user?.role || null) : (previewRole || user?.role || null);
  const previewUserName = isImpersonating
    ? impersonationState?.targetName || user?.fullName || null
    : previewUserNameFromUrl;

  const value = useMemo(
    () => ({
      loading,
      user,
      role,
      previewUserName,
      isPreviewMode: Boolean(previewRole) || isImpersonating,
      isImpersonating,
      impersonationState,
      permissions,
      accountStatus,
      isAuthenticated,
      login,
      logout,
      startImpersonation,
      exitImpersonation,
      register,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      checkPasswordStrength,
      updateProfile,
      hasPermission,
      homeForRole: () => homeForRole(role),
      isActive: accountStatus === ACCOUNT_STATUS.ACTIVE,
    }),
    [loading, user, role, previewUserName, previewRole, isImpersonating, impersonationState, permissions, accountStatus, isAuthenticated, login, logout, startImpersonation, exitImpersonation, register, verifyEmail, resendVerification, forgotPassword, resetPassword, checkPasswordStrength, updateProfile, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
