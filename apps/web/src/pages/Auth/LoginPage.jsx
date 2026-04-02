import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login, homeForRole, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    setPendingVerification(false);

    try {
      const res = await login({ email, password });
      const from = location.state?.from;
      navigate(from || homeForRole(), { replace: true });
      return res;
    } catch (err) {
      const responseData = err?.response?.data || {};
      const message = responseData?.message || 'Login failed.';
      setError(message);
      if (responseData?.code === 'pending_verification') {
        setPendingVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const onResendVerification = async () => {
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) {
      setError('Enter your email, then tap resend verification.');
      return;
    }

    setResending(true);
    setInfo('');
    try {
      const res = await resendVerification(normalizedEmail);
      setInfo(res?.message || 'Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--login">
      <div className="auth-layout auth-layout--login">
        <aside className="auth-hero-panel">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <div className="auth-brand auth-brand--hero">
              <img src="/assets/icon.svg" alt="SproutSense logo" className="auth-brand-icon" />
              <span className="auth-brand-text">SproutSense</span>
            </div>
            <h2 className="auth-hero-title">Grow Smarter With Live Plant Intelligence</h2>
            <p className="auth-hero-subtitle">
              Monitor moisture, temperature, and disease risk in one place with real-time insights from your ESP32 network.
            </p>
            <div className="auth-hero-points">
              <p><i className="fa-solid fa-wifi" /> Dual-device monitoring: ESP32 Sensor + ESP32-CAM</p>
              <p><i className="fa-solid fa-chart-line" /> Analytics-ready dashboards for trends and alerts</p>
              <p><i className="fa-solid fa-robot" /> AI assistant for actionable plant-care guidance</p>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--login">
          <div className="auth-header">
            <h1 className="auth-title"><i className="fa-solid fa-user" /> Sign In</h1>
            <p className="auth-subtitle">Welcome back. Step into your live plant command center in seconds.</p>
          </div>

          <div className="auth-body">
            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}
            {pendingVerification && (
              <div className="auth-inline-actions">
                <button type="button" className="auth-link auth-link-button" onClick={onResendVerification} disabled={resending}>
                  {resending ? 'Sending verification...' : 'Resend verification email'}
                </button>
              </div>
            )}
            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
              <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
            </form>
            <div className="auth-footer">
              <Link className="auth-link" to="/register">Create account</Link>
              <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
