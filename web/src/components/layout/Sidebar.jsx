/**
 * Sidebar.jsx — Professional Glass v6 (error-free)
 * • Root element uses BOTH "sidebar" (for Layout.css grid/position rules)
 *   AND "sb" (for v6 glass styles) so no layout breakage.
 * • Mobile overlay class kept as "sidebar-overlay" to match Layout.jsx.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Sidebar.css';

const ROUTE_ACCENT = {
  '/home'     : { color:'#22d3ee', rgb:'34,211,238'  },
  '/analytics': { color:'#4ade80', rgb:'74,222,128'  },
  '/insights' : { color:'#a78bfa', rgb:'167,139,250' },
  '/alerts'   : { color:'#fb923c', rgb:'251,146,60'  },
  '/records'  : { color:'#2dd4bf', rgb:'45,212,191'  },
  '/ai-chat'  : { color:'#60a5fa', rgb:'96,165,250'  },
  '/admin'    : { color:'#f472b6', rgb:'244,114,182' },
  '/settings' : { color:'#94a3b8', rgb:'148,163,184' },
};

function statusLabel(s) {
  return s === 'online' ? 'Online' : s === 'offline' ? 'Offline' : 'Connecting';
}

export function Sidebar({ sidebarCategories, systemStatus, alerts, closeSidebar }) {
  const isOnline =
    systemStatus?.esp32 === 'online' && systemStatus?.backend === 'online';

  return (
    <aside
      className="sidebar sb"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Aurora ambient orbs */}
      <div className="sb-orb sb-orb--cyan"  aria-hidden="true" />
      <div className="sb-orb sb-orb--green" aria-hidden="true" />

      {/* Noise texture overlay */}
      <div className="sb-noise" aria-hidden="true" />

      {/* ────────── BRAND ────────── */}
      <div className="sb-brand">
        <div className="sb-logo-badge">
          <div className="sb-logo-ring sb-logo-ring--outer" />
          <div className="sb-logo-ring sb-logo-ring--inner" />
          <div className="sb-logo-core">
            <img
              src="/assets/icon.svg"
              alt="SproutSense"
              className="sb-logo-img"
              draggable="false"
            />
          </div>
        </div>

        <div className="sb-brand-copy">
          <span className="sb-brand-name">SproutSense</span>
          <span className="sb-brand-meta">
            <span className="sb-live-dot" />
            Smart Plant Monitor
          </span>
        </div>
      </div>

      {/* ────────── NAV ────────── */}
      <nav className="sb-nav">
        {(sidebarCategories || []).map((cat) => (
          <section key={cat.label} className="sb-section">
            <p className="sb-section-label">{cat.label}</p>

            {(cat.items || []).map((item) => {
              const ac = ROUTE_ACCENT[item.path] ?? ROUTE_ACCENT['/home'];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  title={item.label}
                  className={({ isActive }) =>
                    `sb-link${isActive ? ' sb-link--active' : ''}`
                  }
                  style={{ '--ac': ac.color, '--ac-r': ac.rgb }}
                >
                  <span className="sb-link-shimmer" aria-hidden="true" />

                  <span className="sb-icon-pill">
                    <GlassIcon name={item.icon} className="sb-icon" />
                    {item.path === '/alerts' && alerts?.length > 0 && (
                      <span className="sb-badge">
                        {alerts.length > 9 ? '9+' : alerts.length}
                      </span>
                    )}
                  </span>

                  <span className="sb-link-body">
                    <span className="sb-link-label">{item.label}</span>
                  </span>

                  <span className="sb-edge-bar" aria-hidden="true" />
                </NavLink>
              );
            })}
          </section>
        ))}
      </nav>

      {/* ────────── STATUS FOOTER ────────── */}
      {systemStatus && (
        <footer className="sb-footer">
          <div className="sb-footer-divider" />
          <div className="sb-health">
            <div className="sb-health-icon">
              <span
                className={`sb-health-pulse ${isOnline ? 'online' : 'offline'}`}
              />
            </div>
            <div className="sb-health-text">
              <span className="sb-health-title">System Health</span>
              <span className="sb-health-sub">
                ESP32 · {statusLabel(systemStatus.esp32)}
                &nbsp;&nbsp;| &nbsp;
                API · {statusLabel(systemStatus.backend)}
              </span>
            </div>
            <span className={`sb-health-badge ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Live' : 'Down'}
            </span>
          </div>
        </footer>
      )}
    </aside>
  );
}

export default Sidebar;
