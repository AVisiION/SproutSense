import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassIcon } from '../bits/GlassIcon';
import './styles/Sidebar.css';

// Converts a status string to a human-readable label
function statusLabel(status) {
  switch (status) {
    case 'online': return 'Online';
    case 'offline': return 'Offline';
    default: return 'Checking';
  }
}

export function Sidebar({
  sidebarCategories,
  systemStatus,
  alerts,
  closeSidebar,
  isSidebarCollapsed // Make sure to pass this prop if you want to hide things conditionally in JSX
}) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">

      {/* ── Brand logo (Hides when collapsed via CSS) ── */}
      <div className="sidebar-brand">
        <img src="/assets/icon.svg" className="sidebar-brand-icon" alt="" />
        <span className="sidebar-brand-text">SproutSense</span>
      </div>

      {/* ── Nav links grouped by category ── */}
      <nav className="sidebar-nav">
        {sidebarCategories.map((category) => (
          <div key={category.label} className="sidebar-category">
            <span className="sidebar-cat-label">{category.label}</span>

            {category.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                title={item.label}
                onClick={closeSidebar}
              >
                {/* Icon with optional badge / status dot */}
                <span className="sidebar-icon-wrap">
                  <GlassIcon name={item.icon} className="sidebar-icon" />

                  {/* Alert count badge */}
                  {item.path === '/alerts' && alerts.length > 0 && (
                    <span className="sidebar-badge">{alerts.length}</span>
                  )}
                </span>

                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
