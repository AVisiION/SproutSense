import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await forgotPassword(email);
      setMessage(res?.message || 'If that account exists, a reset email has been sent.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--login">
      <div className="auth-layout auth-layout--login">
        <aside className="auth-hero-panel">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <Link className="auth-brand auth-brand--hero" to="/">
              <img src="/assets/icon.png" alt="SproutSense logo" className="auth-brand-icon" />
              <span className="auth-brand-text">SproutSense</span>
            </Link>
            <h2 className="auth-hero-title">Recover Your Access</h2>
            <p className="auth-hero-subtitle">
              We'll send you a secure link to reset your password. Your plants are waiting!
            </p>
            <div className="auth-hero-points">
              <p><i className="fa-solid fa-shield" /> Cold, secure password reset process</p>
              <p><i className="fa-solid fa-lock" /> No personal data shared externally</p>
              <p><i className="fa-solid fa-clock" /> Instant recovery link delivery</p>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--login">
          <div className="auth-header">
            <h1 className="auth-title"><i className="fa-solid fa-key" /> Forgot Password</h1>
            <p className="auth-subtitle">No worries. We will get you back to your dashboard securely.</p>
          </div>
          <div className="auth-body">
            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-info">{message}</div>}
            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
            <div className="auth-footer">
              <Link className="auth-link" to="/login">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
