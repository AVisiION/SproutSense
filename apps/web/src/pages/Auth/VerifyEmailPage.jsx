import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!token) {
        if (!mounted) return;
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }
      try {
        const res = await verifyEmail(token);
        if (!mounted) return;
        setStatus('ok');
        setMessage(res.message || 'Email verified successfully.');
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed.');
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [token, verifyEmail]);

  const onResend = async () => {
    if (!email) {
      setMessage('Add email query parameter to resend verification.');
      return;
    }
    const res = await resendVerification(email);
    setMessage(res.message || 'Verification email sent.');
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
            <h2 className="auth-hero-title">Welcome to SproutSense</h2>
            <p className="auth-hero-subtitle">
              Verify your email to unlock real-time monitoring, AI insights, and full control of your plant care system.
            </p>
            <div className="auth-hero-points">
              <p><i className="fa-solid fa-envelope-open" /> Link sent to your inbox</p>
              <p><i className="fa-solid fa-check" /> Instant activation upon verification</p>
              <p><i className="fa-solid fa-zap" /> Start monitoring plants within seconds</p>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--login">
          <div className="auth-header">
            <h1 className="auth-title"><i className="fa-solid fa-envelope-circle-check" /> Email Verification</h1>
            <p className="auth-subtitle">One quick confirmation unlocks your full SproutSense experience.</p>
          </div>
          <div className="auth-body">
            {status === 'error' ? <div className="auth-error">{message}</div> : <div className="auth-info">{message}</div>}
            <div className="auth-footer">
              <Link className="auth-link" to="/login">Go to login</Link>
              {status === 'error' && <button type="button" className="auth-link auth-link-button" onClick={onResend}>Resend verification</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
