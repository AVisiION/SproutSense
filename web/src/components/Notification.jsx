import React, { useEffect } from 'react';
import '../styles/notification.css';

export function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  // Simple icon for error/info/success
  const icons = {
    error: (
      <span className="notification-icon" aria-label="Error" title="Error">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#ef4444"/><path d="M10 5v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="#fff"/></svg>
      </span>
    ),
    success: (
      <span className="notification-icon" aria-label="Success" title="Success">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#22c55e"/><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    ),
    info: (
      <span className="notification-icon" aria-label="Info" title="Info">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#3b82f6"/><rect x="9" y="7" width="2" height="6" rx="1" fill="#fff"/><rect x="9" y="5" width="2" height="2" rx="1" fill="#fff"/></svg>
      </span>
    ),
    warning: (
      <span className="notification-icon" aria-label="Warning" title="Warning">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#f59e42"/><path d="M10 6v5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="#fff"/></svg>
      </span>
    ),
  };

  return (
    <div className={`notifications-container`}>
      <div className={`notification ${type}`} role="alert">
        {icons[type] || null}
        <div className="notification-content">{message}</div>
        <button className="notification-close" aria-label="Close notification" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 5l8 8M13 5l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}
