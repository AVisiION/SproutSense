import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AuthPages.css';

export default function AccessDeniedPage() {
  const location = useLocation();
  const reason = location.state?.reason;

  let message = 'You do not have permission to access this area.';
  if (reason === 'suspended') message = 'Your account is suspended. Contact an administrator.';
  if (reason === 'disabled') message = 'Your account is disabled.';

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <img src="/assets/icon.svg" alt="SproutSense logo" className="auth-brand-icon" />
            <span className="auth-brand-text">SproutSense</span>
          </div>
          <h1 className="auth-title"><i className="fa-solid fa-user-shield" /> Access Denied</h1>
          <p className="auth-subtitle">This area is restricted. Switch account or return to a permitted page.</p>
        </div>
        <div className="auth-body">
          <div className="auth-error">{message}</div>
          <div className="auth-footer">
            <Link className="auth-link" to="/home">Return to home</Link>
            <Link className="auth-link" to="/login">Sign in as different user</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
