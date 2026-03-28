/**
 * AdminLoginPage.jsx
 * Professional glass-morphism admin login.
 * Matches the AdminPanelPage design system — dark glass, FA icons, animations.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './Admin.css';

export default function AdminLoginPage() {
  const { isAdminAuthenticated, adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [mounted,  setMounted]  = useState(false);
  const [shake,    setShake]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (isAdminAuthenticated) return <Navigate to="/admin/panel" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const ok = adminLogin(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/admin/panel', { replace: true });
    } else {
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setError('Invalid credentials. Access denied.');
      setPassword('');
    }
  };

  const isFormValid = username.trim().length > 0 && password.length > 0;

  return (
    <div className={`aln-root${mounted ? ' aln-root--in' : ''}`}>

      {/* Ambient background glows */}
      <div className="aln-glow aln-glow--1" aria-hidden="true" />
      <div className="aln-glow aln-glow--2" aria-hidden="true" />
      <div className="aln-glow aln-glow--3" aria-hidden="true" />

      {/* Floating particles */}
      <div className="aln-particles" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={`aln-particle aln-particle--${i + 1}`} />
        ))}
      </div>

      {/* Card */}
      <div className={`aln-card${shake ? ' aln-card--shake' : ''}`}>

        {/* Top accent bar */}
        <div className="aln-accent-bar" />

        {/* Brand */}
        <div className="aln-brand">
          <div className="aln-logo-ring">
            <img src="/assets/icon.svg" alt="SproutSense" className="aln-logo" />
          </div>
          <div className="aln-brand-text">
            <h1 className="aln-title">Admin Access</h1>
            <p className="aln-subtitle">
              <i className="fa-solid fa-shield-halved" />
              &ensp;SproutSense Control Panel
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="aln-status-row">
          <span className="aln-status-dot" />
          <span className="aln-status-text">Secure connection established</span>
          <span className="aln-status-badge">
            <i className="fa-solid fa-lock" /> SSL
          </span>
        </div>

        {/* Divider */}
        <div className="aln-divider">
          <span className="aln-divider-line" />
          <span className="aln-divider-label">
            <i className="fa-solid fa-fingerprint" />&ensp;Authentication Required
          </span>
          <span className="aln-divider-line" />
        </div>

        {/* Form */}
        <form className="aln-form" onSubmit={handleSubmit} autoComplete="off">

          {/* Username */}
          <div className="aln-field">
            <label className="aln-label" htmlFor="aln-user">
              <i className="fa-solid fa-user-shield" />&ensp;Username
            </label>
            <div className="aln-input-wrap">
              <i className="fa-solid fa-user aln-input-icon" />
              <input
                id="aln-user"
                className="aln-input"
                type="text"
                placeholder="admin username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {username.length > 0 && (
                <i className="fa-solid fa-circle-check aln-input-check" />
              )}
            </div>
          </div>

          {/* Password */}
          <div className="aln-field">
            <label className="aln-label" htmlFor="aln-pass">
              <i className="fa-solid fa-key" />&ensp;Password
            </label>
            <div className="aln-input-wrap">
              <i className="fa-solid fa-lock aln-input-icon" />
              <input
                id="aln-pass"
                className="aln-input"
                type={showPass ? 'text' : 'password'}
                placeholder="admin password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="aln-pass-toggle"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="aln-strength">
                <div className={`aln-strength-bar aln-strength-bar--${password.length < 6 ? 'weak' : password.length < 12 ? 'medium' : 'strong'}`} />
                <span className="aln-strength-label">
                  {password.length < 6 ? 'Weak' : password.length < 12 ? 'Medium' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="aln-error" role="alert">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
              {attempts > 1 && (
                <span className="aln-attempt-count">
                  &nbsp;({attempts} attempts)
                </span>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="aln-submit-btn"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" />
                <span>Verifying&hellip;</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket" />
                <span>Enter Admin Panel</span>
                <i className="fa-solid fa-arrow-right aln-btn-arrow" />
              </>
            )}
          </button>

        </form>

        {/* Info footer */}
        <div className="aln-footer">
          <div className="aln-footer-item">
            <i className="fa-solid fa-circle-info" />
            <span>Restricted access &mdash; authorised personnel only</span>
          </div>
          <div className="aln-footer-item">
            <i className="fa-solid fa-clock" />
            <span>Session expires on tab close</span>
          </div>
        </div>

      </div>
    </div>
  );
}
