import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { configAPI } from '../../utils/api';
import { GlassIcon } from '../../components/bits/GlassIcon';

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
  const [saving,          setSaving]          = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(false);
  const [testModeAllowed, setTestModeAllowed] = useState(true);
  const [environment,     setEnvironment]     = useState('development');

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setEsp32IP(localStorage.getItem('esp32_ip')         || '192.168.1.100');
    setDeviceId(localStorage.getItem('device_id')       || 'ESP32-SENSOR');
    loadTestModeStatus();
  }, []);

  const loadTestModeStatus = async () => {
    try {
      const response = await fetch('/api/config/testmode');
      if (response.ok) {
        const data = await response.json();
        setTestModeEnabled(data.data?.enabled              || false);
        setTestModeAllowed(data.data?.allowedInEnvironment !== false);
        setEnvironment(data.data?.environment              || 'development');
      }
    } catch {
      console.error('Failed to load test mode status');
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('esp32_ip',       esp32IP);
    localStorage.setItem('device_id',      deviceId);
    onNotification?.('API keys saved securely to local storage', 'success');
  };

  const handleSaveDeviceConfig = async () => {
    setSaving(true);
    try {
      await configAPI.update(deviceId, { espIp: esp32IP });
      onNotification?.('Device configuration synced successfully', 'success');
    } catch {
      onNotification?.('Failed to reach ESP32 device', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key) =>
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  // Backend simulation toggle (writes mock data to DB)
  const handleToggleTestMode = async () => {
    setTestModeLoading(true);
    try {
      const response = await fetch('/api/config/testmode', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ enabled: !testModeEnabled }),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.data?.error === 'PRODUCTION_MODE') {
          onNotification?.('Simulation blocked in production environment', 'warning');
        } else {
          const newState = data.data?.enabled || false;
          setTestModeEnabled(newState);

          // Also sync frontend demo mode to match
          localStorage.setItem('sprout_testmode', String(newState));
          onForceTestModeChange?.(newState);

          onNotification?.(
            newState
              ? '✅ Simulation ON — Backend + Analytics/Alerts showing mock data'
              : '🔴 Simulation OFF — All pages showing real data only',
            'success'
          );
        }
      } else {
        onNotification?.(data.message || 'Failed to sync simulation state', 'error');
      }
    } catch {
      onNotification?.('Network error toggling simulation', 'error');
    } finally {
      setTestModeLoading(false);
    }
  };

  // Frontend-only demo toggle (no DB writes, instant)
  const handleToggleFrontendDemo = () => {
    const next = !forceTestMode;
    localStorage.setItem('sprout_testmode', String(next));
    onForceTestModeChange?.(next);
    onNotification?.(
      next
        ? '✅ Frontend Demo ON — Analytics & Alerts show simulated data'
        : '🔴 Frontend Demo OFF — Pages show real data',
      next ? 'success' : 'info'
    );
  };

  const anySimActive = testModeEnabled || forceTestMode;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="settings-page">

      {/* ── HEADER ── */}
      <div className="settings-header">
        <div className="settings-header-icon">
          <GlassIcon name="settings" />
        </div>
        <div className="settings-header-text">
          <h1 className="settings-title">System Settings</h1>
          <p className="settings-subtitle">
            Manage device connections, preferences, and API integrations.
          </p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ── APPEARANCE ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="sun" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Interface Theme</span>
                <span className="settings-row-desc">Switch between light and dark environments</span>
              </div>
              <button
                className={`theme-pill ${theme === 'dark' ? 'dark' : 'light'}`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <span className="theme-pill-icon">
                  <GlassIcon name={theme === 'dark' ? 'moon' : 'sun'} />
                </span>
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── SIMULATION MODE ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="demo" />
            <h2>Simulation Mode</h2>
          </div>
          <div className="settings-card-body">

            {/* Production warning */}
            {!testModeAllowed && (
              <div className="settings-alert warning">
                Simulation is disabled in the <strong>{environment}</strong> environment.
              </div>
            )}

            {/* Row 1 — Backend simulation (writes to DB) */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">
                  Backend Mock Data
                  <span style={{
                    marginLeft   : '0.5rem',
                    fontSize     : '0.68rem',
                    background   : 'rgba(168,85,247,0.15)',
                    color        : '#c084fc',
                    border       : '1px solid rgba(168,85,247,0.3)',
                    borderRadius : '999px',
                    padding      : '0.1rem 0.5rem',
                    fontWeight   : 700,
                  }}>
                    writes to DB
                  </span>
                </span>
                <span className="settings-row-desc">
                  {testModeAllowed
                    ? 'Generates real sensor payloads into MongoDB without ESP32 hardware'
                    : 'Requires local development environment'}
                </span>
              </div>
              <button
                className={`toggle-switch ${testModeEnabled ? 'on' : 'off'}`}
                onClick={handleToggleTestMode}
                disabled={testModeLoading || !testModeAllowed}
                aria-label="Toggle backend test mode"
              >
                <span className="toggle-knob" />
              </button>
            </div>

            {/* Divider */}
            <div style={{
              height     : '1px',
              background : 'rgba(255,255,255,0.06)',
              margin     : '0.85rem 0',
            }} />

            {/* Row 2 — Frontend demo (instant, no DB) */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">
                  Frontend Demo Mode
                  <span style={{
                    marginLeft   : '0.5rem',
                    fontSize     : '0.68rem',
                    background   : 'rgba(59,130,246,0.15)',
                    color        : '#60a5fa',
                    border       : '1px solid rgba(59,130,246,0.3)',
                    borderRadius : '999px',
                    padding      : '0.1rem 0.5rem',
                    fontWeight   : 700,
                  }}>
                    Analytics &amp; Alerts
                  </span>
                </span>
                <span className="settings-row-desc">
                  Forces Analytics &amp; Alerts pages to instantly display simulated charts
                  and mock alerts — no ESP32 or DB required
                </span>
              </div>
              <button
                className={`toggle-switch ${forceTestMode ? 'on' : 'off'}`}
                onClick={handleToggleFrontendDemo}
                aria-label="Toggle frontend demo mode"
              >
                <span className="toggle-knob" />
              </button>
            </div>

            {/* Status banner — only shows when any simulation is active */}
            {anySimActive && (
              <div style={{
                marginTop    : '1rem',
                background   : 'rgba(245,158,11,0.1)',
                border       : '1px solid rgba(245,158,11,0.28)',
                borderRadius : '8px',
                padding      : '0.65rem 0.9rem',
                color        : '#fcd34d',
                fontSize     : '0.82rem',
                lineHeight   : '1.5',
              }}>
                ⚠️&nbsp;
                <strong>
                  {testModeEnabled && forceTestMode
                    ? 'Backend + Frontend simulation both active'
                    : testModeEnabled
                      ? 'Backend simulation active — writing mock data to DB'
                      : 'Frontend Demo active — Analytics & Alerts showing simulated data'}
                </strong>
                <br />
                <span style={{ opacity: 0.8 }}>
                  Navigate to{' '}
                  <a
                    href="/analytics"
                    style={{ color: '#fcd34d', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Analytics
                  </a>
                  {' '}or{' '}
                  <a
                    href="/alerts"
                    style={{ color: '#fcd34d', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Alerts
                  </a>
                  {' '}to see mock data in action.
                </span>
              </div>
            )}

          </div>
        </div>

        {/* ── HARDWARE CONFIGURATION ── */}
        <div className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <GlassIcon name="esp32" />
            <h2>Hardware Configuration</h2>
          </div>
          <div className="settings-card-body split-body">
            <div className="settings-input-group">
              <div className="settings-field">
                <label className="settings-label">ESP32 IPv4 Address</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. 192.168.1.100"
                  value={esp32IP}
                  onChange={e => setEsp32IP(e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Hardware Device ID</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="ESP32-SENSOR"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                />
              </div>
            </div>

            <div className="settings-input-group">
              <div className="settings-field">
                <label className="settings-label">Polling Interval (Seconds)</label>
                <input
                  type="number"
                  className="settings-input"
                  min="1" max="60"
                  value={refreshInterval}
                  onChange={e => setRefreshInterval(Number(e.target.value))}
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Data Retention (Days)</label>
                <input
                  type="number"
                  className="settings-input"
                  min="1" max="365"
                  value={retentionDays}
                  onChange={e => setRetentionDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="settings-action-row">
              <button
                className="settings-btn-primary"
                onClick={handleSaveDeviceConfig}
                disabled={saving}
              >
                <GlassIcon name={saving ? 'refresh' : 'check'} animated={saving} />
                {saving ? 'Syncing to Device...' : 'Apply Hardware Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ── AI INTEGRATIONS ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="bot" />
            <h2>AI Integrations</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-hint">
              Keys are stored in local storage and used only during AI disease diagnosis.
            </p>
            <div className="settings-field">
              <label className="settings-label">Google Gemini API Key</label>
              <input
                type="password"
                className="settings-input"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">OpenAI API Key (Optional)</label>
              <input
                type="password"
                className="settings-input"
                placeholder="sk-proj..."
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">OpenWeather API Key</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Paste your VITE_OPENWEATHER_API_KEY value"
                defaultValue={import.meta.env.VITE_OPENWEATHER_API_KEY || ''}
                readOnly
                title="Set this in your .env file as VITE_OPENWEATHER_API_KEY"
              />
              <span className="settings-row-desc" style={{ marginTop: '0.35rem', display: 'block' }}>
                Set in <code>.env</code> as <code>VITE_OPENWEATHER_API_KEY=your_key</code> — used in Analytics weather card
              </span>
            </div>
            <button className="settings-btn-secondary" onClick={handleSaveKeys}>
              <GlassIcon name="check" />
              Save Credentials
            </button>
          </div>
        </div>

        {/* ── ALERT PREFERENCES ── */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="bell" />
            <h2>Alert Preferences</h2>
          </div>
          <div className="settings-card-body">
            {[
              { key: 'lowMoisture',  label: 'Critical Moisture Drop',  desc: 'Triggers when soil needs immediate watering'          },
              { key: 'highTemp',     label: 'Thermal Stress Warning',   desc: 'Triggers above 38°C ambient temperature'             },
              { key: 'phAlert',      label: 'pH Imbalance',             desc: 'Triggers when pH escapes the 5.5–7.5 safe zone'      },
              { key: 'systemAlerts', label: 'Hardware Disconnects',     desc: 'ESP32 WebSocket drops and reconnections'             },
            ].map(({ key, label, desc }) => (
              <div className="settings-row" key={key}>
                <div className="settings-row-info">
                  <span className="settings-row-label">{label}</span>
                  <span className="settings-row-desc">{desc}</span>
                </div>
                <button
                  className={`toggle-switch ${notifications[key] ? 'on' : 'off'}`}
                  onClick={() => toggleNotif(key)}
                  aria-label={`Toggle ${label}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── ABOUT ── */}
        <div className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <GlassIcon name="info" />
            <h2>About SproutSense</h2>
          </div>
          <div className="settings-card-body settings-about">
            <div className="settings-about-brand">
              <GlassIcon name="sprout" animated />
              <span>SproutSense OS</span>
            </div>
            <div className="settings-about-grid">
              <div className="settings-about-item">
                <span className="settings-about-label">Firmware Ver</span>
                <span className="settings-about-value">2.0.4 (ESP32-WROOM)</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">App Release</span>
                <span className="settings-about-value">v1.1.0-beta</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">Telemetry</span>
                <span className="settings-about-value">DHT22, Soil Cap, BH1750</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">Core Logic</span>
                <span className="settings-about-value">React, Node, MongoDB</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}