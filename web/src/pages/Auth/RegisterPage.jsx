import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const fillClassByLevel = {
  Weak: 'strength-weak',
  Fair: 'strength-fair',
  Good: 'strength-good',
  Strong: 'strength-strong',
};

const widthByLevel = {
  Weak: '25%',
  Fair: '50%',
  Good: '75%',
  Strong: '100%',
};

export default function RegisterPage() {
  const { register, checkPasswordStrength } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState({ level: 'Weak', hints: ['Use at least 12 characters.'] });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const onPasswordChange = async (value) => {
    setPassword(value);
    try {
      const res = await checkPasswordStrength({ password: value, fullName, email });
      setStrength(res.strength || strength);
    } catch {
      // keep local state unchanged on transient errors
    }
  };

  const confirmMismatch = useMemo(
    () => confirmPassword && password !== confirmPassword,
    [confirmPassword, password]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      await register({ fullName, email, password, confirmPassword });
      setInfo('Registration successful. Check your email for verification link.');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title"><i className="fa-solid fa-user-plus" /> Create Account</h1>
          <p className="auth-subtitle">Register with email verification and strong password policy.</p>
        </div>
        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          <form onSubmit={onSubmit}>
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" value={password} onChange={(e) => onPasswordChange(e.target.value)} type="password" required />
              <div className="strength-wrap">
                <div className="strength-meter">
                  <div className={`strength-fill ${fillClassByLevel[strength.level] || 'strength-weak'}`} style={{ width: widthByLevel[strength.level] || '25%' }} />
                </div>
                <div className="strength-meta">
                  <span>Strength: {strength.level || 'Weak'}</span>
                </div>
                {Array.isArray(strength.hints) && strength.hints.length > 0 && (
                  <ul className="strength-hints">
                    {strength.hints.map((hint) => <li key={hint}>{hint}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <input className="auth-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
              {confirmMismatch && <span className="auth-error">Passwords do not match.</span>}
            </div>
            <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
          </form>
          <div className="auth-footer">
            <Link className="auth-link" to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
