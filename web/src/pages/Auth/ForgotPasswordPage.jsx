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
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title"><i className="fa-solid fa-key" /> Forgot Password</h1>
          <p className="auth-subtitle">Request a secure password reset link.</p>
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
  );
}
