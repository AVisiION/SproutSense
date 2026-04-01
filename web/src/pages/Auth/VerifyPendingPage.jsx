import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';

export default function VerifyPendingPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title"><i className="fa-solid fa-envelope" /> Verification Required</h1>
          <p className="auth-subtitle">Your account is pending verification.</p>
        </div>
        <div className="auth-body">
          <div className="auth-info">Please verify your email address to activate full access.</div>
          <div className="auth-footer">
            <Link className="auth-link" to="/verify-email">Verify now</Link>
            <Link className="auth-link" to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
