/**
 * AdminSidebarSection.jsx
 * Left sidebar navigation component
 * Includes: brand, profile, navigation menu, footer info, logout
 */
import React from 'react';
import './AdminSidebarSection.css';

const AdminSidebarSection = ({
  sidebarOpen,
  activeSection,
  SECTIONS,
  adminUser,
  systemInfo,
  uptime,
  formatUptime,
  setActiveSection,
  setSidebarOpen,
  handleLogout,
}) => {
  const platformStatus = [
    { key: 'api', label: 'API', ok: Boolean(systemInfo?.backend) },
    { key: 'db', label: 'MongoDB', ok: Boolean(systemInfo?.database || systemInfo?.mongodb) },
    { key: 'ws', label: 'WebSocket', ok: Boolean(systemInfo?.websocket) },
  ];

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          SIDEBAR
          ══════════════════════════════════════════════════════ */}
      <aside className="adm-sidebar">
        {/* Brand */}
        <div className="adm-sidebar-brand">
          <div className="adm-brand-logo-shell">
            <img src="/assets/icon.png" alt="" className="adm-brand-logo" />
          </div>
          <div className="adm-brand-text">
            <span className="adm-brand-name">SproutSense</span>
            <span className="adm-brand-role">Control Panel</span>
          </div>
          <span className="adm-brand-badge">Live</span>
        </div>

        {/* Admin Profile Mini */}
        <div className="adm-sidebar-profile">
          <div className="adm-profile-avatar">
            {(adminUser?.charAt(0) || 'A').toUpperCase()}
          </div>
          <div className="adm-profile-info">
            <span className="adm-profile-name">{adminUser}</span>
            <span className="adm-profile-role">
              <i className="fa-solid fa-shield-halved" /> Administrator
            </span>
            <span className="adm-profile-access">Full Access</span>
          </div>
        </div>

        <div className="adm-sidebar-divider" />

        {/* Navigation */}
        <div className="adm-nav-group-label-row">
          <div className="adm-nav-group-label">Navigation</div>
          <span className="adm-nav-group-count">{SECTIONS.length} modules</span>
        </div>
        <nav className="adm-nav">
          {SECTIONS.map((s, index) => (
            <button
              key={s.id}
              className={`adm-nav-item${activeSection === s.id ? ' active' : ''}`}
              title={s.label}
              aria-label={s.label}
              onClick={() => {
                setActiveSection(s.id);
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <i className={`fa-solid ${s.icon} adm-nav-icon`} />
              <span className="adm-nav-label">{s.label}</span>
              <span className="adm-nav-kbd">{String(index + 1).padStart(2, '0')}</span>
              {activeSection === s.id && <span className="adm-nav-pill" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="adm-sidebar-footer">
          <div className="adm-platform-health">
            {platformStatus.map((service) => (
              <div key={service.key} className={`adm-health-chip${service.ok ? ' is-ok' : ''}`}>
                <span className="adm-health-dot" />
                <span>{service.label}</span>
              </div>
            ))}
          </div>
          <div className="adm-session-info">
            <i className="fa-solid fa-signal" />
            <span>Uptime: {formatUptime(uptime)}</span>
          </div>
          <div className="adm-sidebar-version">
            <i className="fa-solid fa-code-branch" />
            <span>v{systemInfo?.version || '3.1.0'}</span>
          </div>
          <button 
            className="adm-sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <i className="fa-solid fa-xmark" />
            <span>Close</span>
          </button>
          <button className="adm-logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <i className="fa-solid fa-right-from-bracket" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div 
        className="adm-sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
        aria-label="Close sidebar"
        style={{ display: sidebarOpen ? 'block' : 'none' }}
      />
    </>
  );
};

export default AdminSidebarSection;
