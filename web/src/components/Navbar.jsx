import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from './GlassIcon';

export function Navbar({ 
  currentPage, 
  isConnected, 
  isMobile, 
  isSidebarCollapsed, 
  toggleSidebar, 
  theme, 
  toggleTheme,
  alertCount = 0,
}) {
  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <GlassIcon name={isSidebarCollapsed ? 'menu' : 'close'} className="theme-icon navbar-icon" />
        </button>

        {/* SproutSense brand logo — shown when sidebar is collapsed or on mobile */}
        {(isSidebarCollapsed || isMobile) && (
          <NavLink to="/home" className="navbar-brand" aria-label="SproutSense Home">
            <GlassIcon name="sprout" className="navbar-brand-icon" />
            <span className="navbar-brand-text">SproutSense</span>
          </NavLink>
        )}

        <h3 className="navbar-page-title">{currentPage}</h3>
      </div>

      <div className="navbar-right">
        {/* ESP32 connection status */}
        <span className={`navbar-connection ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot"></span>
          <span className="connection-text">
            {isConnected ? 'ESP32 Online' : 'ESP32 Offline'}
          </span>
        </span>

        {/* Alert Bell */}
        <NavLink to="/alerts" className="navbar-alert-btn" aria-label={`${alertCount} alerts`} title="View Alerts">
          <GlassIcon name="bell" className="navbar-icon" />
          {alertCount > 0 && (
            <span className="navbar-alert-badge">{alertCount}</span>
          )}
        </NavLink>

        {/* Theme Toggle */}
        <button 
          className="navbar-theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <GlassIcon name={theme === 'dark' ? 'sun' : 'moon'} className="theme-icon navbar-icon" />
        </button>
      </div>
    </nav>
  );
}

