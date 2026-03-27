/**
 * AdminLoginPage.jsx
 * Secure admin login. Redirects to /admin/panel on success.
 * Redirects to /home if already authenticated.
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
    // Simulate brief async check
    await new Promise(r => setTimeout(r, 600));
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
      <div className="admin-login-card">

        {/* Brand */}
        <div className="admin-login-brand">
          <img src="/assets/icon.svg" alt="SproutSense" className="admin-login-logo" />
          <h1 className="admin-login-title">Admin Access</h1>
          <p className="admin-login-sub">SproutSense Control Panel</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit} autoComplete="off">

          {/* Username */}
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-user">Username</label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon">&#9881;</span>
              <input
                id="admin-user"
                className="admin-input"
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-pass">Password</label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon">&#128274;</span>
              <input
                id="admin-pass"
                className="admin-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Admin password"
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
                {showPass ? '\u{1F648}' : '\u{1F441}'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="admin-error" role="alert">
              &#9888; {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`admin-submit-btn${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Enter Admin Panel'}
          </button>

        </form>

        <p className="admin-login-footer">
          Restricted access &mdash; authorised personnel only
        </p>
      </div>
    </div>
  );
}
