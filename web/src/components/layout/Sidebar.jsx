/**
 * Sidebar.jsx — Redesigned v3
 * Cyan × Green palette, per-section accent colors, inline SVG brand logo.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Sidebar.css';

// Per-route accent color — matches the icon color shown on the active link
const ROUTE_COLOR = {
  '/home'      : { color: '#22d3ee', glow: 'rgba(34,211,238,0.22)'  },  // cyan
  '/analytics' : { color: '#4ade80', glow: 'rgba(74,222,128,0.20)'  },  // green
  '/insights'  : { color: '#a78bfa', glow: 'rgba(167,139,250,0.20)' },  // violet
  '/alerts'    : { color: '#fb923c', glow: 'rgba(251,146,60,0.22)'  },  // orange
  '/records'   : { color: '#2dd4bf', glow: 'rgba(45,212,191,0.20)'  },  // teal
  '/ai-chat'   : { color: '#60a5fa', glow: 'rgba(96,165,250,0.20)'  },  // blue
  '/admin'     : { color: '#f472b6', glow: 'rgba(244,114,182,0.20)' },  // pink
  '/settings'  : { color: '#94a3b8', glow: 'rgba(148,163,184,0.18)' },  // slate
};

function statusLabel(status) {
  switch (status) {
    case 'online':  return 'Online';
    case 'offline': return 'Offline';
    default:        return 'Checking';
  }
}

export function Sidebar({
  sidebarCategories,
  systemStatus,
  alerts,
  closeSidebar,
  isSidebarCollapsed,
}) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">

      {/* ── BRAND ── */}
      <div className="sidebar-brand">
        {/* Inline SVG leaf-sprout logo — matches /assets/icon.svg theme */}
        <div className="sidebar-logo-wrap" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="sidebar-logo-svg">
            {/* Outer glow circle */}
            <circle cx="18" cy="18" r="17" fill="url(#sb-brand-bg)" opacity="0.18" />
            {/* Leaf shape */}
            <path
              d="M18 28 C18 28 8 22 8 14 C8 9.58 12.48 6 18 6 C23.52 6 28 9.58 28 14 C28 22 18 28 18 28Z"
              fill="url(#sb-leaf-fill)" opacity="0.92"
            />
            {/* Center vein */}
            <line x1="18" y1="27" x2="18" y2="13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2"
              strokeLinecap="round" />
            {/* Left vein */}
            <line x1="18" y1="19" x2="12" y2="15" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9"
              strokeLinecap="round" />
            {/* Right vein */}
            <line x1="18" y1="19" x2="24" y2="15" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9"
              strokeLinecap="round" />
            {/* Stem */}
            <path d="M18 28 C16 29.5 14 30.5 13 32" stroke="url(#sb-stem)" strokeWidth="1.6"
              strokeLinecap="round" fill="none" />
            <defs>
              <radialGradient id="sb-brand-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </radialGradient>
              <linearGradient id="sb-leaf-fill" x1="8" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#22d3ee" />
                <stop offset="55%"  stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="sb-stem" x1="13" y1="32" x2="18" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#22c55e" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="sidebar-brand-text-wrap">
          <span className="sidebar-brand-name">SproutSense</span>
          <span className="sidebar-brand-tagline">Smart Plant Monitor</span>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="sidebar-nav">
        {sidebarCategories.map((category) => (
          <div key={category.label} className="sidebar-category">
            <span className="sidebar-cat-label">{category.label}</span>

            {category.items.map((item) => {
              const accent = ROUTE_COLOR[item.path] || { color: '#22d3ee', glow: 'rgba(34,211,238,0.18)' };
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                  style={{ '--sb-accent': accent.color, '--sb-glow': accent.glow }}
                  title={item.label}
                  onClick={closeSidebar}
                >
                  <span className="sidebar-icon-wrap">
                    <GlassIcon name={item.icon} className="sidebar-icon" />
                    {item.path === '/alerts' && alerts.length > 0 && (
                      <span className="sidebar-badge">{alerts.length}</span>
                    )}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                  {/* Active indicator bar */}
                  <span className="sidebar-active-bar" aria-hidden="true" />
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── SYSTEM STATUS FOOTER ── */}
      {systemStatus && (
        <div className="sidebar-system-status">
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">ESP32</span>
            <span className={`sidebar-system-pill ${systemStatus.esp32 || 'checking'}`}>
              {statusLabel(systemStatus.esp32)}
            </span>
          </div>
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">Backend</span>
            <span className={`sidebar-system-pill ${systemStatus.backend || 'checking'}`}>
              {statusLabel(systemStatus.backend)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
