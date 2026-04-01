import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Navbar.css';

function roleBadgeClass(role) {
  if (role === 'admin') return 'role-admin';
  if (role === 'user') return 'role-user';
  return 'role-viewer';
}

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
}) {
  const isDark = theme === 'dark';
  const [accountOpen, setAccountOpen] = useState(false);

  const initials = useMemo(() => {
    const text = auth?.user?.fullName || 'Account';
    return text
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join('');
  }, [auth?.user?.fullName]);

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

        <div className="navbar-account-wrap">
          <button
            type="button"
            className="navbar-account-btn"
            onClick={() => setAccountOpen((prev) => !prev)}
            aria-label="Open account menu"
          >
            {auth?.isAuthenticated ? (
              <>
                <span className="navbar-account-avatar">{initials || 'U'}</span>
                <span className={`navbar-role-pill ${roleBadgeClass(auth.role)}`}>{auth.role || 'user'}</span>
              </>
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
                <>
                  <Link to="/" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-house" /> Home
                  </Link>
                  <Link to="/about" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-circle-info" /> About
                  </Link>
                  <Link to="/features" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-seedling" /> Features
                  </Link>
                  <Link to="/plant-library" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-leaf" /> Plant Library
                  </Link>
                  <Link to="/demo" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-play" /> Demo
                  </Link>
                  <Link to="/contact" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-envelope" /> Contact
                  </Link>
                  <Link to="/login" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-right-to-bracket" /> Login
                  </Link>
                  <Link to="/register" className="navbar-account-link" onClick={() => setAccountOpen(false)}>
                    <i className="fa-solid fa-user-plus" /> Register
                  </Link>
                </>
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

        <button
          className="navbar-theme-toggle navbar-theme-toggle--desktop"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-icon">
            {isDark ? '☀️' : '🌙'}
          </span>
        </button>

        <button
          className="navbar-theme-toggle navbar-theme-toggle--mobile"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          )}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
