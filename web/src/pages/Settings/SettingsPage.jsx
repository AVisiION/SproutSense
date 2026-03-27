/**
 * SettingsPage.jsx — Full Redesign v4
 *
 * • Inline SVG icons (zero CDN dependency — matches ConfigCard pattern)
 * • Password show/hide toggle on all key fields
 * • Two-column auto-fit grid with wide cards spanning full width
 * • Sections: Appearance, Simulation, Hardware, AI Keys, Alert Prefs, About
 */
import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { configAPI } from '../../utils/api';

/* ──── Inline SVG library ───────────────────────────────────────────── */
const SVG = {
  gear: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
  palette: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>),
  moon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>),
  sun: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  flask: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v8l-4.5 9A1 1 0 005.4 21h13.2a1 1 0 00.9-1.5L15 11V3"/></svg>),
  warning: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  chip: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="6" height="6"/><path d="M15 2v3M9 2v3M15 19v3M9 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>),
  wifi: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"/></svg>),
  hash: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>),
  timer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6M12 2v3"/></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  spinner: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'sp-spin 0.8s linear infinite',display:'block'}}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.2"/><path d="M21 12a9 9 0 00-9-9"/></svg>),
  robot: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a3 3 0 00-3 3v6h6V5a3 3 0 00-3-3z"/><line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3"/><line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3"/><line x1="12" y1="11" x2="12" y2="11" strokeWidth="3"/></svg>),
  lock: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>),
  key: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>),
  cloud: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>),
  eye: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  eyeOff: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>),
  save: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>),
  bell: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>),
  droplet: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>),
  thermometer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>),
  beaker: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v8l-4.5 9A1 1 0 005.4 21h13.2a1 1 0 00.9-1.5L15 11V3"/><path d="M8 16.5h8"/></svg>),
  broadcast: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 010 10.72M5.64 6.64a9 9 0 000 10.72"/><path d="M15.54 9.46a5 5 0 010 5.08M8.46 9.46a5 5 0 000 5.08"/><line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="3"/></svg>),
  info: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>),
  seedling: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 6 6 3 3 3c0 3 1 9 9 9M12 12c0-6 6-9 9-9 0 3-1 9-9 9"/></svg>),
  cpu: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>),
  branch: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>),
  activity: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  layers: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
};

function Icon({ name, size = 16, className = '' }) {
  return (
    <span
      className={`sp-icon ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    >
      {SVG[name]}
    </span>
  );
}

/* ──── Password field with show/hide ────────────────────────────────── */
function KeyField({ label, icon, value, onChange, placeholder, readOnly = false, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="sp-field">
      <label className="sp-label">{label}</label>
      <div className="sp-input-wrap">
        <Icon name={icon} size={13} className="sp-input-icon" />
        <input
          type={show ? 'text' : 'password'}
          className="sp-input sp-input--padded sp-input--pr"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          autoComplete="off"
        />
        <button
          type="button"
          className="sp-eye-btn"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Hide key' : 'Show key'}
          tabIndex={-1}
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={13} />
        </button>
      </div>
      {hint && <p className="sp-field-hint">{hint}</p>}
    </div>
  );
}

/* ──── Main component ────────────────────────────────────────────────── */
export default function SettingsPage({
  theme,
  toggleTheme,
  onNotification,
  forceTestMode = false,
  onForceTestModeChange,
}) {
  const [geminiKey,       setGeminiKey]       = useState('');
  const [openaiKey,       setOpenaiKey]       = useState('');
  const [esp32IP,         setEsp32IP]         = useState('192.168.1.100');
  const [deviceId,        setDeviceId]        = useState('ESP32-SENSOR');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [retentionDays,   setRetentionDays]   = useState(30);
  const [notifications,   setNotifications]   = useState({
    lowMoisture  : true,
    highTemp     : true,
    phAlert      : true,
    systemAlerts : true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setEsp32IP  (localStorage.getItem('esp32_ip')       || '192.168.1.100');
    setDeviceId (localStorage.getItem('device_id')      || 'ESP32-SENSOR');
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('esp32_ip',       esp32IP);
    localStorage.setItem('device_id',      deviceId);
    onNotification?.('Credentials saved to local storage', 'success');
  };

  const handleSaveHardware = async () => {
    setSaving(true);
    try {
      await configAPI.update(deviceId, { espIp: esp32IP });
      onNotification?.('Hardware configuration synced successfully', 'success');
    } catch {
      onNotification?.('Failed to reach ESP32 device', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = key =>
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleToggleDemo = () => {
    const next = !forceTestMode;
    localStorage.setItem('sprout_testmode', String(next));
    onForceTestModeChange?.(next);
    onNotification?.(
      next ? 'Demo ON — Analytics & Alerts show simulated data'
           : 'Demo OFF — Pages show real data',
      next ? 'success' : 'info',
    );
  };

  const ALERT_ROWS = [
    { key: 'lowMoisture',  icon: 'droplet',     label: 'Critical Moisture Drop', desc: 'Triggers when soil needs immediate watering'      },
    { key: 'highTemp',     icon: 'thermometer', label: 'Thermal Stress Warning',  desc: 'Triggers above 38°C ambient temperature'         },
    { key: 'phAlert',      icon: 'beaker',      label: 'pH Imbalance',            desc: 'Triggers when pH exits the 5.5–7.5 safe range'   },
    { key: 'systemAlerts', icon: 'broadcast',   label: 'Hardware Disconnects',    desc: 'ESP32 WebSocket drops and reconnection events'    },
  ];

  const ABOUT_ROWS = [
    { icon: 'cpu',      label: 'Firmware',  value: '2.0.4 (ESP32-WROOM)'     },
    { icon: 'branch',   label: 'Release',   value: 'v1.1.0-beta'              },
    { icon: 'activity', label: 'Sensors',   value: 'DHT22 · Soil Cap · BH1750' },
    { icon: 'layers',   label: 'Stack',     value: 'React · Node · MongoDB'   },
  ];

  return (
    <div className="sp-page">

      {/* ══ PAGE HEADER ══ */}
      <header className="sp-page-header">
        <div className="sp-page-header-icon">
          <Icon name="gear" size={22} />
        </div>
        <div>
          <h1 className="sp-page-title">System Settings</h1>
          <p className="sp-page-subtitle">Manage device connections, preferences, and API integrations</p>
        </div>
      </header>

      <div className="sp-grid">

        {/* ══ APPEARANCE ══ */}
        <div className="sp-card">
          <div className="sp-card-head">
            <Icon name="palette" size={15} />
            <h2>Appearance</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">Interface Theme</span>
                <span className="sp-row-desc">Toggle between light and dark UI</span>
              </div>
              <button
                className={`sp-theme-pill ${theme === 'dark' ? 'dark' : 'light'}`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={13} />
                <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ SIMULATION MODE ══ */}
        <div className="sp-card">
          <div className="sp-card-head">
            <Icon name="flask" size={15} />
            <h2>Simulation Mode</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-row">
              <div className="sp-row-info">
                <span className="sp-row-label">
                  Frontend Demo
                  <span className="sp-pill sp-pill--blue">Analytics &amp; Alerts</span>
                </span>
                <span className="sp-row-desc">
                  Displays simulated charts and mock alerts — no ESP32 or database required
                </span>
              </div>
              <button
                className={`sp-toggle ${forceTestMode ? 'on' : 'off'}`}
                onClick={handleToggleDemo}
                aria-label="Toggle frontend demo"
              >
                <span className="sp-toggle-knob" />
              </button>
            </div>

            {forceTestMode && (
              <div className="sp-banner sp-banner--amber">
                <Icon name="warning" size={14} className="sp-banner-icon" />
                <div>
                  <strong>Demo mode active</strong>
                  <p>
                    Visit <a href="/analytics">Analytics</a> or <a href="/alerts">Alerts</a> to see simulated data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ HARDWARE CONFIGURATION ══ */}
        <div className="sp-card sp-card--wide">
          <div className="sp-card-head">
            <Icon name="chip" size={15} />
            <h2>Hardware Configuration</h2>
            <span className="sp-card-badge">ESP32-WROOM</span>
          </div>
          <div className="sp-card-body">
            <div className="sp-field-grid">

              <div className="sp-field">
                <label className="sp-label">ESP32 IPv4 Address</label>
                <div className="sp-input-wrap">
                  <Icon name="wifi" size={13} className="sp-input-icon" />
                  <input
                    type="text"
                    className="sp-input sp-input--padded"
                    placeholder="e.g. 192.168.1.100"
                    value={esp32IP}
                    onChange={e => setEsp32IP(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-field">
                <label className="sp-label">Device ID</label>
                <div className="sp-input-wrap">
                  <Icon name="hash" size={13} className="sp-input-icon" />
                  <input
                    type="text"
                    className="sp-input sp-input--padded"
                    placeholder="ESP32-SENSOR"
                    value={deviceId}
                    onChange={e => setDeviceId(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-field">
                <label className="sp-label">Polling Interval (s)</label>
                <div className="sp-input-wrap">
                  <Icon name="timer" size={13} className="sp-input-icon" />
                  <input
                    type="number" min="1" max="60"
                    className="sp-input sp-input--padded"
                    value={refreshInterval}
                    onChange={e => setRefreshInterval(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="sp-field">
                <label className="sp-label">Data Retention (days)</label>
                <div className="sp-input-wrap">
                  <Icon name="calendar" size={13} className="sp-input-icon" />
                  <input
                    type="number" min="1" max="365"
                    className="sp-input sp-input--padded"
                    value={retentionDays}
                    onChange={e => setRetentionDays(Number(e.target.value))}
                  />
                </div>
              </div>

            </div>

            <div className="sp-action-row">
              <button className="sp-btn sp-btn--primary" onClick={handleSaveHardware} disabled={saving}>
                <Icon name={saving ? 'spinner' : 'check'} size={14} />
                {saving ? 'Syncing…' : 'Apply Hardware Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ AI INTEGRATIONS ══ */}
        <div className="sp-card">
          <div className="sp-card-head">
            <Icon name="robot" size={15} />
            <h2>AI Integrations</h2>
          </div>
          <div className="sp-card-body">

            <div className="sp-hint-row">
              <Icon name="lock" size={12} className="sp-hint-icon" />
              <span>Keys stored in local storage — used only for AI disease diagnosis</span>
            </div>

            <KeyField
              label="Google Gemini API Key"
              icon="key"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIzaSy…"
            />
            <KeyField
              label="OpenAI API Key"
              icon="key"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-proj…"
            />
            <KeyField
              label="OpenWeather API Key"
              icon="cloud"
              value={import.meta.env.VITE_OPENWEATHER_API_KEY || ''}
              onChange={() => {}}
              placeholder="Set VITE_OPENWEATHER_API_KEY in .env"
              readOnly
              hint='Set in .env as VITE_OPENWEATHER_API_KEY=your_key — used in Analytics weather card'
            />

            <button className="sp-btn sp-btn--secondary" onClick={handleSaveKeys}>
              <Icon name="save" size={14} /> Save Credentials
            </button>
          </div>
        </div>

        {/* ══ ALERT PREFERENCES ══ */}
        <div className="sp-card">
          <div className="sp-card-head">
            <Icon name="bell" size={15} />
            <h2>Alert Preferences</h2>
          </div>
          <div className="sp-card-body">
            {ALERT_ROWS.map(({ key, icon, label, desc }) => (
              <div className="sp-row" key={key}>
                <div className="sp-row-left">
                  <span className="sp-alert-icon-wrap">
                    <Icon name={icon} size={13} />
                  </span>
                  <div className="sp-row-info">
                    <span className="sp-row-label">{label}</span>
                    <span className="sp-row-desc">{desc}</span>
                  </div>
                </div>
                <button
                  className={`sp-toggle ${notifications[key] ? 'on' : 'off'}`}
                  onClick={() => toggleNotif(key)}
                  aria-label={`Toggle ${label}`}
                >
                  <span className="sp-toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ABOUT ══ */}
        <div className="sp-card sp-card--wide">
          <div className="sp-card-head">
            <Icon name="info" size={15} />
            <h2>About SproutSense</h2>
          </div>
          <div className="sp-card-body">
            <div className="sp-about-brand">
              <div className="sp-about-logo">
                <Icon name="seedling" size={22} />
              </div>
              <div>
                <p className="sp-about-name">SproutSense OS</p>
                <p className="sp-about-tagline">Smart IoT Plant Care · Edge AI · Real-time Telemetry</p>
              </div>
            </div>
            <div className="sp-about-grid">
              {ABOUT_ROWS.map(({ icon, label, value }) => (
                <div className="sp-about-tile" key={label}>
                  <span className="sp-about-tile-icon"><Icon name={icon} size={14} /></span>
                  <span className="sp-about-tile-label">{label}</span>
                  <span className="sp-about-tile-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
