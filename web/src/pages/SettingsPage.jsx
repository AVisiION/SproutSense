import React, { useState, useEffect } from 'react';
import { GlassIcon } from '../components/GlassIcon';
import { configAPI } from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage({ theme, toggleTheme, onNotification }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [esp32IP, setEsp32IP] = useState('192.168.1.100');
  const [deviceId, setDeviceId] = useState('ESP32-001');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [retentionDays, setRetentionDays] = useState(30);
  const [notifications, setNotifications] = useState({
    lowMoisture: true,
    highTemp: true,
    phAlert: true,
    systemAlerts: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved keys from localStorage (never send to server unless needed)
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setEsp32IP(localStorage.getItem('esp32_ip') || '192.168.1.100');
    setDeviceId(localStorage.getItem('device_id') || 'ESP32-001');
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('esp32_ip', esp32IP);
    localStorage.setItem('device_id', deviceId);
    onNotification?.('API keys saved locally', 'success');
  };

  const handleSaveDeviceConfig = async () => {
    setSaving(true);
    try {
      await configAPI.update(deviceId, {
        soilMoistureThreshold: undefined,
        espIp: esp32IP,
      });
      onNotification?.('Device config updated', 'success');
    } catch {
      onNotification?.('Failed to update device config', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <GlassIcon name="settings" />
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your SproutSense configuration</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="sun" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Theme</span>
                <span className="settings-row-desc">Switch between dark and light mode</span>
              </div>
              <button
                className={`theme-pill ${theme === 'dark' ? 'dark' : 'light'}`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <span className="theme-pill-icon">
                  <GlassIcon name={theme === 'dark' ? 'moon' : 'sun'} />
                </span>
                <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="bell" />
            <h2>Notifications</h2>
          </div>
          <div className="settings-card-body">
            {[
              { key: 'lowMoisture', label: 'Low Soil Moisture Alert', desc: 'Alert when moisture drops below threshold' },
              { key: 'highTemp', label: 'High Temperature Alert', desc: 'Alert when temperature exceeds 38°C' },
              { key: 'phAlert', label: 'pH Out of Range', desc: 'Alert when pH is outside 5.5–7.5' },
              { key: 'systemAlerts', label: 'System Alerts', desc: 'ESP32 connection status changes' },
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

        {/* API Keys */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="bot" />
            <h2>AI API Keys</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-note">
              Keys are stored locally in your browser and sent only to the backend when using AI features.
            </p>
            <div className="settings-field">
              <label className="settings-label">Google Gemini API Key</label>
              <input
                type="password"
                className="settings-input"
                placeholder="AIza..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">OpenAI API Key</label>
              <input
                type="password"
                className="settings-input"
                placeholder="sk-..."
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button className="settings-btn-primary" onClick={handleSaveKeys}>
              <GlassIcon name="check" />
              Save API Keys
            </button>
          </div>
        </div>

        {/* Device Configuration */}
        <div className="settings-card">
          <div className="settings-card-header">
            <GlassIcon name="esp32" />
            <h2>Device Configuration</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-field">
              <label className="settings-label">ESP32 IP Address</label>
              <input
                type="text"
                className="settings-input"
                placeholder="192.168.1.100"
                value={esp32IP}
                onChange={e => setEsp32IP(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Device ID</label>
              <input
                type="text"
                className="settings-input"
                placeholder="ESP32-001"
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Sensor Refresh Interval (seconds)</label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="60"
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Data Retention (days)</label>
              <input
                type="number"
                className="settings-input"
                min="1"
                max="365"
                value={retentionDays}
                onChange={e => setRetentionDays(Number(e.target.value))}
              />
            </div>
            <button className="settings-btn-primary" onClick={handleSaveDeviceConfig} disabled={saving}>
              <GlassIcon name={saving ? 'refresh' : 'check'} animated={saving} />
              {saving ? 'Saving...' : 'Save Device Config'}
            </button>
          </div>
        </div>

        {/* About */}
        <div className="settings-card settings-card-wide">
          <div className="settings-card-header">
            <GlassIcon name="info" />
            <h2>About SproutSense</h2>
          </div>
          <div className="settings-card-body settings-about">
            <div className="settings-about-logo">
              <GlassIcon name="sprout" animated />
              <span>SproutSense</span>
            </div>
            <div className="settings-about-grid">
              <div className="settings-about-item">
                <span className="settings-about-label">Version</span>
                <span className="settings-about-value">2.0.0 IoT Edition</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">Stack</span>
                <span className="settings-about-value">React + Node.js + MongoDB + ESP32</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">Sensors</span>
                <span className="settings-about-value">DHT22, Capacitive Moisture, BH1750, pH Probe</span>
              </div>
              <div className="settings-about-item">
                <span className="settings-about-label">AI</span>
                <span className="settings-about-value">Google Gemini + rule-based analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
