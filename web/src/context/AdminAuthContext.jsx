/**
 * AdminAuthContext.jsx
 * Provides admin authentication state across the app.
 * Session is stored in sessionStorage — clears automatically on tab/browser close.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem('ss_admin_auth') === 'true'
  );
  const [adminUser, setAdminUser] = useState(
    () => sessionStorage.getItem('ss_admin_user') || 'admin'
  );

  const adminLogin = useCallback((username, password) => {
    const validUser = import.meta.env.VITE_ADMIN_USER || 'admin';
    const validPass = import.meta.env.VITE_ADMIN_PASS || 'sproutsense2025';

    if (username === validUser && password === validPass) {
      sessionStorage.setItem('ss_admin_auth', 'true');
      sessionStorage.setItem('ss_admin_user', username);
      setIsAdminAuthenticated(true);
      setAdminUser(username);
      return true;
    }
    return false;
  }, []);

  const adminLogout = useCallback(() => {
    sessionStorage.removeItem('ss_admin_auth');
    sessionStorage.removeItem('ss_admin_user');
    setIsAdminAuthenticated(false);
    setAdminUser('admin');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, adminUser, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
