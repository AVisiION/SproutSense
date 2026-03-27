/**
 * AdminLoginPage.jsx
 * Secure admin login with Font Awesome icons.
 * Redirects to /admin/panel on success.
 */
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './Admin.css';

export default function AdminLoginPage() {
  const { isAdminAuthenticated, adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (isAdminAuthenticated) return <Navigate to="/admin/panel" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 650));
    const ok = adminLogin(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/admin/panel', { replace: true });
    } else {
      setError('Invalid credentials. Access denied.');
      setPassword('');
    }
  };

  return (
    <div className="admin-login-root">

      {/* Decorative background blobs */}
      <div className="adm-bg-blob adm-bg-blob--1" aria-hidden="true" />
      <div className="adm-bg-blob adm-bg-blob--2" aria-hidden="true" />

      <div className="admin-login-card">

        {/* ── Brand ─────────────────────────────────────────── */}
        <div className="admin-login-brand">
          <div className="adm-logo-ring" aria-hidden="true">
            <img src="/assets/icon.svg" alt="SproutSense" className="admin-login-logo" />
          </div>
          <h1 className="admin-login-title">Admin Access</h1>
          <p className="admin-login-sub">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            &ensp;SproutSense Control Panel
          </p>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="adm-divider">
          <span className="adm-divider-line" />
          <span className="adm-divider-label">
            <i className="fa-solid fa-lock" aria-hidden="true" />
            &ensp;Secure Login
          </span>
          <span className="adm-divider-line" />
        </div>

        {/* ── Form ──────────────────────────────────────────── */}
        <form className="admin-login-form" onSubmit={handleSubmit} autoComplete="off">

          {/* Username field */}
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-user">
              <i className="fa-solid fa-user-shield" aria-hidden="true" />
              &ensp;Username
            </label>
            <div className="admin-input-wrap">
              <i className="fa-solid fa-user admin-input-icon" aria-hidden="true" />
              <input
                id="admin-user"
                className="admin-input"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
              {username.length > 0 && (
                <i className="fa-solid fa-circle-check admin-input-check" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Password field */}
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-pass">
              <i className="fa-solid fa-key" aria-hidden="true" />
              &ensp;Password
            </label>
            <div className="admin-input-wrap">
              <i className="fa-solid fa-lock admin-input-icon" aria-hidden="true" />
              <input
                id="admin-pass"
                className="admin-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="admin-pass-toggle"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <i
                  className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="admin-error" role="alert">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              &ensp;{error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={`admin-submit-btn${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                &ensp;Verifying&hellip;
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
                &ensp;Enter Admin Panel
              </>
            )}
          </button>

        </form>

        {/* ── Footer ────────────────────────────────────────── */}
        <p className="admin-login-footer">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          &ensp;Restricted access &mdash; authorised personnel only
        </p>
      </div>
    </div>
  );
}
