import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login, homeForRole, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const transitionClass = location.state?.authTransition === 'to-login'
    ? 'auth-shell--transition-to-login'
    : location.state?.authTransition === 'to-register'
      ? 'auth-shell--transition-to-register'
      : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const filledLoginFields = useMemo(() => {
    let filled = 0;
    if (String(email).trim()) filled += 1;
    if (String(password).trim()) filled += 1;
    return filled;
  }, [email, password]);

  const loginFillProgress = `${Math.round((filledLoginFields / 2) * 100)}%`;
  const isLoginComplete = filledLoginFields === 2;

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
    <div className={`auth-shell auth-shell--login ${transitionClass}`.trim()}>
      <div className="auth-layout auth-layout--login">
        <aside className="auth-hero-panel">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <Link className="auth-brand auth-brand--hero" to="/">
              <img src="/assets/icon.png" alt="SproutSense logo" className="auth-brand-icon" />
              <span className="auth-brand-text">SproutSense</span>
            </Link>
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
            <div className="auth-switch" role="tablist" aria-label="Authentication mode">
              <Link className="auth-switch__item auth-switch__item--active" to="/login" aria-current="page">Login</Link>
              <Link className="auth-switch__item" to="/register" state={{ authTransition: 'to-register' }}>Register</Link>
            </div>
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
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
              <button
                className={`auth-button ${isLoginComplete ? 'auth-button--ready' : ''}`}
                type="submit"
                disabled={loading || !isLoginComplete}
                style={{ '--auth-fill-progress': loginFillProgress }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
            <div className="auth-footer">
              <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
