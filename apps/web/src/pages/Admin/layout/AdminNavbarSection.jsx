/**
 * AdminNavbarSection.jsx
 * Top navigation bar / header component
 * Includes: sidebar toggle, breadcrumb, environment status, refresh button
 */
import React from 'react';
import './AdminNavbarSection.css';

const AdminNavbarSection = ({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  SECTIONS,
  mockEnabled,
  refreshing,
  fetchAllData,
  handleLogout,
}) => {
  const activeSectionMeta = SECTIONS.find((s) => s.id === activeSection);

  return (
    <header className="adm-header">
      <span className="adm-header-glow adm-header-glow--a" aria-hidden="true" />
      <span className="adm-header-glow adm-header-glow--b" aria-hidden="true" />

      <div className="adm-header-left adm-header-panel">
        <button
          className="adm-toggle-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          type="button"
        >
          <i className={`fa-solid ${sidebarOpen ? 'fa-indent' : 'fa-bars'}`} />
        </button>

        <div className="adm-header-breadcrumb-wrap">
          <div className="adm-header-breadcrumb">
            <span className="adm-breadcrumb-root">SproutSense Admin</span>
            <i className="fa-solid fa-chevron-right adm-breadcrumb-sep" />
            <span className="adm-breadcrumb-current">
              <i className={`fa-solid ${activeSectionMeta?.icon}`} />
              {activeSectionMeta?.label}
            </span>
          </div>
          <div className="adm-header-subline">Operational Console</div>
        </div>
      </div>

      <div className="adm-header-right adm-header-panel">
        <div className="adm-header-env">
          <span className="adm-env-dot" />
          <span>{mockEnabled ? 'Mock Environment' : 'Production Environment'}</span>
        </div>
        <span className="adm-badge adm-badge--green">
          <i className="fa-solid fa-shield-halved" /> Secure
        </span>
        <div className="adm-header-actions">
          <button
            className={`adm-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={() => fetchAllData(true)}
            title="Refresh all data"
            disabled={refreshing}
            type="button"
          >
            <i className="fa-solid fa-rotate" />
          </button>
          <button
            className="adm-navbar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            type="button"
          >
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbarSection;
