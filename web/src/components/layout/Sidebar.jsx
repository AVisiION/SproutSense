/**
 * Sidebar.jsx — Glass redesign v5
 * • Uses /assets/icon.svg for the uncollapsed brand logo
 * • Rich glass card with layered blur, glow edge, animated brand section
 * • Per-route accent colours on active links
 * • System status footer with live pills
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Sidebar.css';

const ROUTE_COLOR = {
  '/home'      : { color: '#22d3ee', glow: 'rgba(34,211,238,0.22)'  },
  '/analytics' : { color: '#4ade80', glow: 'rgba(74,222,128,0.20)'  },
  '/insights'  : { color: '#a78bfa', glow: 'rgba(167,139,250,0.20)' },
  '/alerts'    : { color: '#fb923c', glow: 'rgba(251,146,60,0.22)'  },
  '/records'   : { color: '#2dd4bf', glow: 'rgba(45,212,191,0.20)'  },
  '/ai-chat'   : { color: '#60a5fa', glow: 'rgba(96,165,250,0.20)'  },
  '/admin'     : { color: '#f472b6', glow: 'rgba(244,114,182,0.20)' },
  '/settings'  : { color: '#94a3b8', glow: 'rgba(148,163,184,0.18)' },
};

function statusLabel(s) {
  return s === 'online' ? 'Online' : s === 'offline' ? 'Offline' : 'Checking';
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

      {/* ────────────────── BRAND ────────────────── */}
      <div className="sidebar-brand">
        {/* Glow halo behind the logo */}
        <div className="sidebar-brand-halo" aria-hidden="true" />

        {/* Logo card */}
        <div className="sidebar-logo-card">
          <img
            src="/assets/icon.svg"
            alt="SproutSense logo"
            className="sidebar-logo-img"
            draggable="false"
          />
        </div>

        {/* Text block */}
        <div className="sidebar-brand-text-wrap">
          <span className="sidebar-brand-name">SproutSense</span>
          <span className="sidebar-brand-sub">
            <span className="sidebar-brand-dot" />
            Smart Plant Monitor
          </span>
        </div>
      </div>

      {/* ────────────────── NAV ────────────────── */}
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
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  style={{ '--sb-accent': accent.color, '--sb-glow': accent.glow }}
                  title={item.label}
                  onClick={closeSidebar}
                >
                  {/* Glass icon box */}
                  <span className="sidebar-icon-wrap">
                    <GlassIcon name={item.icon} className="sidebar-icon" />
                    {item.path === '/alerts' && alerts.length > 0 && (
                      <span className="sidebar-badge">{alerts.length}</span>
                    )}
                  </span>

                  <span className="sidebar-label">{item.label}</span>

                  {/* Right-edge glow bar on active */}
                  <span className="sidebar-active-bar" aria-hidden="true" />
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ────────────────── STATUS FOOTER ────────────────── */}
      {systemStatus && (
        <div className="sidebar-system-status">
          <p className="sidebar-system-title">System Status</p>
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">
              <span className={`sidebar-status-dot ${systemStatus.esp32 || 'checking'}`} />
              ESP32
            </span>
            <span className={`sidebar-system-pill ${systemStatus.esp32 || 'checking'}`}>
              {statusLabel(systemStatus.esp32)}
            </span>
          </div>
          <div className="sidebar-system-row">
            <span className="sidebar-system-label">
              <span className={`sidebar-status-dot ${systemStatus.backend || 'checking'}`} />
              Backend
            </span>
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
