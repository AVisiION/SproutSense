/**
 * Navbar.jsx — components/layout/
 * Top navigation bar.
 *
 * Theme toggle strategy:
 *  - Desktop (>768 px): full rounded-square button (.navbar-theme-toggle)
 *  - Mobile  (≤768 px): compact circular pill (.navbar-theme-toggle-mobile)
 *    Both call the same toggleTheme handler — only one is visible at a time via CSS.
 */
import React from 'react';
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
}) {
  const isDark = theme === 'dark';

  return (
    <header className="top-navbar" role="banner">

      {/* ── Left: hamburger + brand + page title ── */}
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!isSidebarCollapsed}
        >
          {isMobile && !isSidebarCollapsed ? '✕' : '☰'}
        </button>

        {/* Brand — only when sidebar is collapsed on desktop */}
        {isSidebarCollapsed && !isMobile && (
          <Link to="/home" className="navbar-brand" aria-label="SproutSense home">
            <img src="/assets/icon.svg" className="navbar-brand-icon" alt="" />
            <span className="navbar-brand-text">SproutSense</span>
          </Link>
        )}

        <h1 className="navbar-title">{currentPage}</h1>
      </div>

      {/* ── Right: connection status, alerts, theme toggle(s) ── */}
      <div className="navbar-right">

        {/* Live connection status */}
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

        {/* Alert bell */}
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

        {/* ── DESKTOP theme toggle (hidden on mobile via CSS) ── */}
        <button
          className="navbar-theme-toggle navbar-theme-toggle--desktop"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
        </button>

        {/* ── MOBILE theme toggle (hidden on desktop via CSS) ── */}
        <button
          className="navbar-theme-toggle navbar-theme-toggle--mobile"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {/* SVG sun/moon inline — no dependency */}
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1"  x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22"  x2="5.64"  y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1"  y1="12" x2="3"  y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
              <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

      </div>
    </header>
  );
}

export default Navbar;
