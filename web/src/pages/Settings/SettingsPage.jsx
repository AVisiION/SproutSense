import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { configAPI } from '../../utils/api';

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
    setEsp32IP(localStorage.getItem('esp32_ip')         || '192.168.1.100');
    setDeviceId(localStorage.getItem('device_id')       || 'ESP32-SENSOR');
  }, []);

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

  const handleToggleFrontendDemo = () => {
    const next = !forceTestMode;
    localStorage.setItem('sprout_testmode', String(next));
    onForceTestModeChange?.(next);
    onNotification?.(
      next
        ? 'Frontend Demo ON — Analytics & Alerts show simulated data'
        : 'Frontend Demo OFF — Pages show real data',
      next ? 'success' : 'info'
    );
  };

  return (
    <div className="settings-page">

      {/* ══ HEADER ══ */}
      <div className="settings-header">
        <div className="settings-header-icon" aria-hidden="true">
          <i className="fa-solid fa-gear" />
        </div>
        <div className="settings-header-text">
          <h1 className="settings-title">System Settings</h1>
          <p className="settings-subtitle">
            Manage device connections, preferences, and API integrations.
          </p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ══ APPEARANCE ══ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <i className="fa-solid fa-palette sp-card-icon" aria-hidden="true" />
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
                <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} aria-hidden="true" />
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ SIMULATION MODE ══ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <i className="fa-solid fa-flask-vial sp-card-icon" aria-hidden="true" />
            <h2>Simulation Mode</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">
                  Frontend Demo Mode
                  <span className="sp-badge sp-badge--blue">Analytics &amp; Alerts</span>
                </span>
                <span className="settings-row-desc">
                  Forces Analytics &amp; Alerts pages to display simulated charts
                  and mock alerts — no ESP32 or database required
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

            {forceTestMode && (
              <div className="sp-sim-banner">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <div>
                  <strong>Frontend Demo active</strong><br />
                  <span>
                    Navigate to{' '}
                    <a href="/analytics">Analytics</a>
                    {' '}or{' '}
                    <a href="/alerts">Alerts</a>
                    {' '}to see mock data.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ HARDWARE CONFIGURATION ══ */}
        <div className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <i className="fa-solid fa-microchip sp-card-icon" aria-hidden="true" />
            <h2>Hardware Configuration</h2>
          </div>
          <div className="settings-card-body split-body">
            <div className="settings-input-group">
              <div className="settings-field">
                <label className="settings-label">ESP32 IPv4 Address</label>
                <div className="sp-input-wrap">
                  <i className="fa-solid fa-network-wired sp-input-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="settings-input sp-input-padded"
                    placeholder="e.g. 192.168.1.100"
                    value={esp32IP}
                    onChange={e => setEsp32IP(e.target.value)}
                  />
                </div>
              </div>
              <div className="settings-field">
                <label className="settings-label">Hardware Device ID</label>
                <div className="sp-input-wrap">
                  <i className="fa-solid fa-id-badge sp-input-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="settings-input sp-input-padded"
                    placeholder="ESP32-SENSOR"
                    value={deviceId}
                    onChange={e => setDeviceId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-input-group">
              <div className="settings-field">
                <label className="settings-label">Polling Interval (Seconds)</label>
                <div className="sp-input-wrap">
                  <i className="fa-solid fa-stopwatch sp-input-icon" aria-hidden="true" />
                  <input
                    type="number"
                    className="settings-input sp-input-padded"
                    min="1" max="60"
                    value={refreshInterval}
                    onChange={e => setRefreshInterval(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="settings-field">
                <label className="settings-label">Data Retention (Days)</label>
                <div className="sp-input-wrap">
                  <i className="fa-solid fa-calendar-days sp-input-icon" aria-hidden="true" />
                  <input
                    type="number"
                    className="settings-input sp-input-padded"
                    min="1" max="365"
                    value={retentionDays}
                    onChange={e => setRetentionDays(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="settings-action-row">
              <button
                className="settings-btn-primary"
                onClick={handleSaveDeviceConfig}
                disabled={saving}
              >
                <i className={`fa-solid ${saving ? 'fa-rotate fa-spin' : 'fa-check'}`} aria-hidden="true" />
                {saving ? 'Syncing to Device...' : 'Apply Hardware Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ══ AI INTEGRATIONS ══ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <i className="fa-solid fa-robot sp-card-icon" aria-hidden="true" />
            <h2>AI Integrations</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-hint">
              <i className="fa-solid fa-lock" aria-hidden="true" style={{marginRight:5,color:'var(--plant-teal)'}} />
              Keys are stored in local storage and used only during AI disease diagnosis.
            </p>
            <div className="settings-field">
              <label className="settings-label">Google Gemini API Key</label>
              <div className="sp-input-wrap">
                <i className="fa-solid fa-key sp-input-icon" aria-hidden="true" />
                <input
                  type="password"
                  className="settings-input sp-input-padded"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">OpenAI API Key (Optional)</label>
              <div className="sp-input-wrap">
                <i className="fa-solid fa-key sp-input-icon" aria-hidden="true" />
                <input
                  type="password"
                  className="settings-input sp-input-padded"
                  placeholder="sk-proj..."
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">OpenWeather API Key</label>
              <div className="sp-input-wrap">
                <i className="fa-solid fa-cloud-sun sp-input-icon" aria-hidden="true" />
                <input
                  type="password"
                  className="settings-input sp-input-padded"
                  placeholder="Paste your VITE_OPENWEATHER_API_KEY value"
                  defaultValue={import.meta.env.VITE_OPENWEATHER_API_KEY || ''}
                  readOnly
                  title="Set this in your .env file as VITE_OPENWEATHER_API_KEY"
                />
              </div>
              <span className="settings-row-desc" style={{ marginTop: '0.35rem', display: 'block' }}>
                Set in <code>.env</code> as <code>VITE_OPENWEATHER_API_KEY=your_key</code>
              </span>
            </div>
            <button className="settings-btn-secondary" onClick={handleSaveKeys}>
              <i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Credentials
            </button>
          </div>
        </div>

        {/* ══ ALERT PREFERENCES ══ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <i className="fa-solid fa-bell sp-card-icon" aria-hidden="true" />
            <h2>Alert Preferences</h2>
          </div>
          <div className="settings-card-body">
            {[
              { key: 'lowMoisture',  fa: 'fa-droplet',              label: 'Critical Moisture Drop', desc: 'Triggers when soil needs immediate watering'     },
              { key: 'highTemp',     fa: 'fa-temperature-high',     label: 'Thermal Stress Warning',  desc: 'Triggers above 38°C ambient temperature'        },
              { key: 'phAlert',      fa: 'fa-flask',                label: 'pH Imbalance',            desc: 'Triggers when pH escapes the 5.5–7.5 safe zone' },
              { key: 'systemAlerts', fa: 'fa-tower-broadcast',      label: 'Hardware Disconnects',    desc: 'ESP32 WebSocket drops and reconnections'         },
            ].map(({ key, fa, label, desc }) => (
              <div className="settings-row" key={key}>
                <div className="settings-row-info">
                  <span className="settings-row-label">
                    <i className={`fa-solid ${fa}`} aria-hidden="true"
                      style={{ marginRight: 7, color: 'var(--plant-teal)', fontSize: 13 }} />
                    {label}
                  </span>
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

        {/* ══ ABOUT ══ */}
        <div className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <i className="fa-solid fa-circle-info sp-card-icon" aria-hidden="true" />
            <h2>About SproutSense</h2>
          </div>
          <div className="settings-card-body settings-about">
            <div className="settings-about-brand">
              <i className="fa-solid fa-seedling" aria-hidden="true"
                style={{ fontSize: 24, color: 'var(--plant-teal)' }} />
              <span>SproutSense OS</span>
            </div>
            <div className="settings-about-grid">
              {[
                { fa: 'fa-microchip',        label: 'Firmware Ver',  value: '2.0.4 (ESP32-WROOM)'        },
                { fa: 'fa-code-branch',      label: 'App Release',   value: 'v1.1.0-beta'                },
                { fa: 'fa-wave-square',      label: 'Telemetry',     value: 'DHT22, Soil Cap, BH1750'    },
                { fa: 'fa-layer-group',      label: 'Core Logic',    value: 'React, Node, MongoDB'       },
              ].map(({ fa, label, value }) => (
                <div className="settings-about-item" key={label}>
                  <span className="settings-about-label">
                    <i className={`fa-solid ${fa}`} aria-hidden="true"
                      style={{ marginRight: 6, color: 'var(--plant-teal)', fontSize: 11 }} />
                    {label}
                  </span>
                  <span className="settings-about-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
