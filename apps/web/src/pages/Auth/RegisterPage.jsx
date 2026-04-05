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

const PLANT_OPTIONS = [
  { key: 'tomato', label: 'Tomato', available: true },
  { key: 'potato', label: 'Potato', available: false },
  { key: 'pepper_bell', label: 'Pepper (Bell)', available: false },
  { key: 'maize', label: 'Maize (Corn)', available: false },
  { key: 'grape', label: 'Grape', available: false },
  { key: 'apple', label: 'Apple', available: false },
  { key: 'peach', label: 'Peach', available: false },
  { key: 'strawberry', label: 'Strawberry', available: false },
];

export default function RegisterPage() {
  const { register, checkPasswordStrength } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredPlant, setPreferredPlant] = useState('tomato');
  const [strength, setStrength] = useState({ level: 'Weak', hints: ['Use at least 8 characters.'] });
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

  const filledRegisterFields = useMemo(() => {
    let filled = 0;
    if (String(fullName).trim()) filled += 1;
    if (String(email).trim()) filled += 1;
    if (String(password).trim()) filled += 1;
    if (String(confirmPassword).trim() && !confirmMismatch) filled += 1;
    return filled;
  }, [fullName, email, password, confirmPassword, confirmMismatch]);

  const registerFillProgress = `${Math.round((filledRegisterFields / 4) * 100)}%`;
  const isRegisterComplete = filledRegisterFields === 4 && Boolean(preferredPlant);

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
      await register({ fullName, email, password, confirmPassword, preferredPlant });
      setInfo('Registration successful. Check your email for verification link.');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
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
              <img src="/assets/icon.svg" alt="SproutSense logo" className="auth-brand-icon" />
              <span className="auth-brand-text">SproutSense</span>
            </Link>
            <h2 className="auth-hero-title">Begin Your Smart Garden Journey</h2>
            <p className="auth-hero-subtitle">
              Join thousands of plant enthusiasts using real-time sensors and AI insights to grow healthier plants.
            </p>
            <div className="auth-hero-points">
              <p><i className="fa-solid fa-leaf" /> Real-time sensor monitoring & alerts</p>
              <p><i className="fa-solid fa-brain" /> AI-driven plant care recommendations</p>
              <p><i className="fa-solid fa-rocket" /> Start with just two devices, grow from there</p>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--login">
          <div className="auth-header">
            <div className="auth-switch" role="tablist" aria-label="Authentication mode">
              <Link className="auth-switch__item" to="/login">Login</Link>
              <Link className="auth-switch__item auth-switch__item--active" to="/register" aria-current="page">Register</Link>
            </div>
            <p className="auth-subtitle">Create your account and start smart, sensor-driven plant care today.</p>
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
              <div className="auth-field">
                <label className="auth-label">Plant Type</label>
                <select className="auth-input" value={preferredPlant} onChange={(e) => setPreferredPlant(e.target.value)}>
                  {PLANT_OPTIONS.map((plant) => (
                    <option key={plant.key} value={plant.key} disabled={!plant.available}>
                      {plant.label}{plant.available ? '' : ' (Coming Soon)'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={`auth-button ${isRegisterComplete ? 'auth-button--ready' : ''}`}
                type="submit"
                disabled={loading || !isRegisterComplete}
                style={{ '--auth-fill-progress': registerFillProgress }}
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
