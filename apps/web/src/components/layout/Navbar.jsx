import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Navbar.css';

export function Navbar({
  currentPage,
  isMobile,
  isSidebarCollapsed,
  toggleSidebar,
  theme,
  toggleTheme,
  alertCount,
  isConnected,
  auth,
  isPublicView = false,
}) {
  const isDark = theme === 'dark';
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef(null);

  const initials = useMemo(() => {
    const text = auth?.user?.fullName || 'Account';
    return text
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join('');
  }, [auth?.user?.fullName]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!accountWrapRef.current) return;
      if (!accountWrapRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="top-navbar" role="banner">
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!isSidebarCollapsed}
        >
          {isMobile && !isSidebarCollapsed ? '✕' : '☰'}
        </button>

        {isSidebarCollapsed && !isMobile && (
          <Link to="/home" className="navbar-brand" aria-label="SproutSense home">
            <img src="/assets/icon.svg" className="navbar-brand-icon" alt="" />
            <span className="navbar-brand-text">SproutSense</span>
          </Link>
        )}

        <h1 className="navbar-title">{currentPage}</h1>
      </div>

      <div className="navbar-right">
        {!isPublicView && (
          <>
            <div
              className={`navbar-connection ${isConnected ? 'connected' : 'disconnected'}`}
              role="status"
              aria-live="polite"
            >
              <GlassIcon
                name={isConnected ? 'wifi' : 'wifi-off'}
                className="connection-icon"
              />
              <span className="connection-text">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            <Link
              to="/alerts"
              className="navbar-alert-btn"
              aria-label={`${alertCount} active alerts`}
            >
              <GlassIcon name="bell" className="glass-icon" />
              {alertCount > 0 && (
                <span className="navbar-alert-badge">{alertCount}</span>
              )}
            </Link>
          </>
        )}

        <div className="navbar-account-wrap" ref={accountWrapRef}>
          <button
            type="button"
            className="navbar-account-btn"
            onClick={() => setAccountOpen((prev) => !prev)}
            aria-label="Open account menu"
          >
            {auth?.isAuthenticated ? (
              <div className="navbar-account-button-content">
                <span className="navbar-account-avatar">{initials || 'U'}</span>
                <div className="navbar-account-info">
                  <span className="navbar-welcome">{getWelcomeMessage()}</span>
                  <span className="navbar-username">{auth.user?.fullName || 'User'}</span>
                </div>
                {auth.role === 'admin' && (
                  <span className="navbar-admin-badge" title="Administrator">
                    <i className="fa-solid fa-crown" />
                  </span>
                )}
              </div>
            ) : (
              <>
                <i className="fa-solid fa-user" />
                <span>Account</span>
              </>
            )}
          </button>

          {accountOpen && (
            <div className="navbar-account-panel">
              {!auth?.isAuthenticated ? (
                <div className="navbar-account-auth-actions">
                  <Link to="/login" className="navbar-account-link navbar-account-link--primary" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-right-to-bracket" /> Login
                  </Link>
                  <Link to="/register" className="navbar-account-link navbar-account-link--secondary" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-user-plus" /> Register
                  </Link>
                </div>
              ) : (
                <>
                  <div className="navbar-account-meta">
                    <strong>{auth.user?.fullName}</strong>
                    <span>{auth.user?.email}</span>
                  </div>
                  {auth.role === 'viewer' ? (
                    <>
                      <Link to="/viewer/dashboard" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-gauge-high" /> Viewer Dashboard
                      </Link>
                      <Link to="/viewer/analytics" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-chart-line" /> Read-only Analytics
                      </Link>
                      <Link to="/viewer/reports" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-file-lines" /> Read-only Reports
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/home" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-gauge-high" /> Dashboard
                      </Link>
                      <Link to="/analytics" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-chart-line" /> Analytics
                      </Link>
                      {auth.role === 'user' && (
                        <Link to="/controls" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                          <i className="fa-solid fa-sliders" /> Product Controls
                        </Link>
                      )}
                    </>
                  )}
                  {auth.role === 'admin' && (
                    <>
                      <Link to="/admin/panel" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-user-shield" /> Admin Panel
                      </Link>
                      <Link to="/admin/panel" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-users-gear" /> User Management
                      </Link>
                      <Link to="/settings" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                        <i className="fa-solid fa-screwdriver-wrench" /> System Configuration
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    className="navbar-account-link navbar-account-logout"
                    onClick={async () => {
                      setAccountOpen(false);
                      await auth.logout();
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket" /> Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <label className="sprout-toggle" aria-label="Toggle Dark Mode">
          <input
            type="checkbox"
            id="theme-switch"
            className="sprout-toggle-checkbox"
            checked={isDark}
            onChange={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          />

          <div className="sprout-toggle-track">
            <svg className="toggle-icon sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>

            <svg className="toggle-icon moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>

            <div className="sprout-toggle-thumb" />
          </div>
        </label>
      </div>
    </header>
  );
}

export default Navbar;
