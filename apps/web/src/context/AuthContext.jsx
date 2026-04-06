import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../utils/api';
import { ACCOUNT_STATUS, homeForRole, PERMISSION, ROLE } from '../auth/permissions';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'ss_access_token';
const REFRESH_TOKEN_KEY = 'ss_refresh_token';

function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse preview user if present
  let previewRole = null;
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('previewUser')) {
      const raw = searchParams.get('previewUser') || '';
      if (raw.includes('role=')) {
        previewRole = new URLSearchParams(raw).get('role');
      } else {
        previewRole = searchParams.get('role');
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
      clearTokens();
      setUser(null);
      setPermissions([]);
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    if (previewRole === ROLE.VIEWER) {
      const viewerPerms = [PERMISSION.DASHBOARD_READ, PERMISSION.SENSORS_READ, PERMISSION.ANALYTICS_READ, PERMISSION.AI_DISEASE_READ, PERMISSION.PROFILE_READ];
      return viewerPerms.includes(permission);
    }
    if (previewRole === ROLE.USER) {
      const userPerms = [PERMISSION.DASHBOARD_READ, PERMISSION.SENSORS_READ, PERMISSION.SENSORS_CONTROL, PERMISSION.WATERING_START, PERMISSION.WATERING_STOP, PERMISSION.WATERING_READ, PERMISSION.ANALYTICS_READ, PERMISSION.AI_CHAT, PERMISSION.AI_INSIGHTS_READ, PERMISSION.AI_DISEASE_READ, PERMISSION.PROFILE_READ, PERMISSION.PROFILE_UPDATE];
      return userPerms.includes(permission);
    }
    return permissions.includes(permission);
  }, [permissions, previewRole]);

  const isAuthenticated = Boolean(user);
  const accountStatus = user?.accountStatus || null;
  const role = previewRole || user?.role || null;

  const value = useMemo(
    () => ({
      loading,
      user,
      role,
      permissions,
      accountStatus,
      isAuthenticated,
      login,
      logout,
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
    [loading, user, role, permissions, accountStatus, isAuthenticated, login, logout, register, verifyEmail, resendVerification, forgotPassword, resetPassword, checkPasswordStrength, updateProfile, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
