import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login, homeForRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login({ email, password });
      const from = location.state?.from;
      navigate(from || homeForRole(), { replace: true });
      return res;
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title"><i className="fa-solid fa-user" /> Sign In</h1>
          <p className="auth-subtitle">Secure access for Admin, User, and Viewer roles.</p>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}
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
  );
}
