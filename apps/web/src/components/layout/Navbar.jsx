// apps/web/src/components/layout/Navbar.jsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
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
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const accountBtnRef = useRef(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const barsRef = useRef([]);

  // Close panel on outside click
  useEffect(() => {
    if (!accountPanelOpen) return;
    function handleClick(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        accountBtnRef.current && !accountBtnRef.current.contains(e.target)
      ) {
        setAccountPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [accountPanelOpen]);

  const initials = useMemo(() => {
    const text = auth?.previewUserName || auth?.user?.fullName || 'Account';
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

  const displayUserName = auth?.previewUserName || auth?.user?.fullName || 'User';
  const viewingAsText = auth?.isImpersonating
    ? `Viewing as ${auth?.impersonationState?.targetName || displayUserName}`
    : (auth?.previewUserName ? `Viewing as ${auth.previewUserName}` : null);

  const handleExitImpersonation = async () => {
    if (!auth?.exitImpersonation) return;
    try {
      await auth.exitImpersonation();
      window.location.assign('/admin/users');
    } catch (error) {
      if (auth?.logout) auth.logout();
      window.location.assign('/login');
    }
  };

  const isMenuOpen = !isSidebarCollapsed && isMobile;

  // GSAP Animation for Toggle (Morphing for Mobile, Rotation for Desktop)
  useEffect(() => {
    if (isMobile) {
      const bars = barsRef.current;
      if (!bars.length) return;
      if (isMenuOpen) {
        gsap.to(bars[0], { y: 7, rotate: 45, scaleX: 1.1, duration: 0.5, ease: 'back.out(2)' });
        gsap.to(bars[1], { opacity: 0, scale: 0.2, x: 20, duration: 0.4, ease: 'power2.in' });
        gsap.to(bars[2], { y: -7, rotate: -45, scaleX: 1.1, duration: 0.5, ease: 'back.out(2)' });
      } else {
        gsap.to(bars[0], { y: 0, rotate: 0, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
        gsap.to(bars[1], { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
        gsap.to(bars[2], { y: 0, rotate: 0, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
      }
    } else if (toggleRef.current) {
      const chevron = toggleRef.current.querySelector('.spatial-chevron');
      if (chevron) {
        gsap.to(chevron, {
          rotate: isSidebarCollapsed ? 180 : 0,
          duration: 0.5,
          ease: 'power3.out'
        });
      }
    }
  }, [isMenuOpen, isSidebarCollapsed, isMobile]);

  return (
    <header className={`top-navbar ${isPublicView ? 'public-navbar' : ''} ${isMenuOpen ? 'mobile-menu-open' : ''}`} role="banner">
      <div className="navbar-left">
        <button
          ref={toggleRef}
          className={`navbar-toggle-spatial ${isMobile ? 'mode-mobile' : 'mode-desktop'} ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={isMenuOpen}
        >
          {isMobile ? (
            <div className="spatial-inner">
              <span ref={el => barsRef.current[0] = el} className="bar top" />
              <span ref={el => barsRef.current[1] = el} className="bar mid" />
              <span ref={el => barsRef.current[2] = el} className="bar bot" />
            </div>
          ) : (
            <div className="spatial-chevron">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          )}
          <div className="spatial-glow" />
        </button>

        {((isSidebarCollapsed && !isMobile) || isPublicView) && (
          <Link to="/" className="navbar-brand" aria-label="SproutSense home" onClick={() => { if(isMenuOpen) toggleSidebar(); }}>
            <img src="/assets/icon.png" className="navbar-brand-icon" alt="" />
            <span className="navbar-brand-text">SproutSense</span>
          </Link>
        )}

        <h1 className="navbar-title">{currentPage}</h1>
        {isPublicView && (
          <nav className={`public-nav-links ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/about" className={`public-nav-link ${currentPage === 'About' ? 'active' : ''}`} onClick={() => { if(isMenuOpen) toggleSidebar(); }}>About</Link>
            <Link to="/features" className={`public-nav-link ${currentPage === 'Features' ? 'active' : ''}`} onClick={() => { if(isMenuOpen) toggleSidebar(); }}>Features</Link>
            <Link to="/plant-library" className={`public-nav-link ${currentPage === 'Plant Library' ? 'active' : ''}`} onClick={() => { if(isMenuOpen) toggleSidebar(); }}>Plant Library</Link>
            <Link to="/demo" className={`public-nav-link ${currentPage === 'Demo' ? 'active' : ''}`} onClick={() => { if(isMenuOpen) toggleSidebar(); }}>Demo</Link>
            <Link to="/contact" className={`public-nav-link ${currentPage === 'Contact' ? 'active' : ''}`} onClick={() => { if(isMenuOpen) toggleSidebar(); }}>Contact</Link>
          </nav>
        )}
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

        <div className="navbar-account-wrap">
          {auth?.isAuthenticated && !isPublicView ? (
            <button
              className="navbar-account-btn"
              ref={accountBtnRef}
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={accountPanelOpen}
              onClick={() => setAccountPanelOpen((v) => !v)}
              type="button"
            >
              <div className="navbar-account-button-content">
                <span className="navbar-account-avatar">{initials || 'U'}</span>
                <div className="navbar-account-info">
                  <span className="navbar-welcome">{getWelcomeMessage()}</span>
                  <span className="navbar-username">{displayUserName}</span>
                  {viewingAsText && <span className="navbar-preview-user">{viewingAsText}</span>}
                </div>
                {auth.role === 'admin' && (
                  <span className="navbar-admin-badge" title="Administrator">
                    <i className="fa-solid fa-crown" />
                  </span>
                )}
              </div>
            </button>
          ) : (
            <Link
              to="/login"
              className="navbar-account-btn"
              aria-label="Go to login"
            >
              <i className="fa-solid fa-user" />
              <span>Account</span>
            </Link>
          )}

          {auth?.isAuthenticated && accountPanelOpen && !isPublicView && (
            <div className="navbar-account-panel" ref={panelRef} tabIndex={-1}>
              <div className="navbar-account-meta">
                <strong>{displayUserName}</strong>
                <span>{auth.user?.email || ''}</span>
                {viewingAsText && <span>{viewingAsText}</span>}
                {auth.role === 'admin' && <span style={{color:'var(--admin-badge)',fontWeight:600}}>Admin</span>}
              </div>
              {auth?.isImpersonating && (
                <button className="navbar-account-link navbar-account-logout" onClick={handleExitImpersonation}>
                  <i className="fa-solid fa-user-shield" />
                  Exit impersonation
                </button>
              )}
              <Link to="/settings" className="navbar-account-link" onClick={() => setAccountPanelOpen(false)}>
                <i className="fa-solid fa-user-gear" />
                Settings
              </Link>
              <Link to="/sensors" className="navbar-account-link" onClick={() => setAccountPanelOpen(false)}>
                <i className="fa-solid fa-gauge" />
                Dashboard
              </Link>
              {(auth.role === 'admin' || auth.role === 'viewer') && (
                <>
                  <Link to="/admin" className="navbar-account-link" onClick={() => setAccountPanelOpen(false)}>
                    <i className="fa-solid fa-crown" />
                    Admin Panel
                  </Link>
                  <Link to="/admin/users" className="navbar-account-link" onClick={() => setAccountPanelOpen(false)}>
                    <i className="fa-solid fa-users" />
                    User Management
                  </Link>
                </>
              )}
              <div className="navbar-account-auth-actions">
                <button className="navbar-account-link logout-link" onClick={() => { if (auth.logout) auth.logout(); setAccountPanelOpen(false); }}>
                  <div className="logout-icon-wrap">
                    <i className="fa-solid fa-power-off" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
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
