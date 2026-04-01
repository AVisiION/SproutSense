import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const { resetPassword, checkPasswordStrength } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState({ level: 'Weak', hints: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const mismatch = useMemo(() => confirmPassword && password !== confirmPassword, [confirmPassword, password]);

  const onPasswordChange = async (value) => {
    setPassword(value);
    try {
      const res = await checkPasswordStrength({ password: value });
      setStrength(res.strength || { level: 'Weak', hints: [] });
    } catch {
      // ignore transient errors
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('Reset token is missing from URL.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await resetPassword({ token, password, confirmPassword });
      setMessage(res.message || 'Password updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title"><i className="fa-solid fa-lock" /> Reset Password</h1>
          <p className="auth-subtitle">Set a new strong passphrase for your account.</p>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-info">{message}</div>}
          <form onSubmit={onSubmit}>
            <div className="auth-field">
              <label className="auth-label">New password</label>
              <input className="auth-input" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <input className="auth-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <small>Strength: {strength.level || 'Weak'}</small>
              {mismatch && <div className="auth-error">Passwords do not match.</div>}
            </div>
            <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Reset Password'}</button>
          </form>
          <div className="auth-footer">
            <Link className="auth-link" to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
