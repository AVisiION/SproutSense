/**
 * AdminPanelPage.jsx
 * Private admin dashboard. Accessible only after admin login.
 * Shows: system overview, device controls, sensor config, raw data, logout.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { configAPI, sensorAPI } from '../../utils/api';
import './Admin.css';

const SECTIONS = [
  { id: 'overview',  label: '📊 Overview'  },
  { id: 'devices',   label: '🔌 Devices'   },
  { id: 'config',    label: '⚙️  Config'    },
  { id: 'data',      label: '🗄️  Raw Data'  },
  { id: 'logs',      label: '📋 Logs'      },
];

export default function AdminPanelPage() {
  const { adminLogout } = useAdminAuth();
  const navigate        = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [systemInfo, setSystemInfo]       = useState(null);
  const [sensorData, setSensorData]       = useState(null);
  const [configData, setConfigData]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLog, setActionLog]         = useState([]);

  const log = (msg) => setActionLog(prev => [
    { time: new Date().toLocaleTimeString(), msg },
    ...prev.slice(0, 49),
  ]);

  useEffect(() => {
    (async () => {
      try {
        const [health, latest, cfg] = await Promise.all([
          configAPI.getHealth('ESP32-SENSOR').catch(() => null),
          sensorAPI.getLatest().catch(() => null),
          configAPI.get().catch(() => null),
        ]);
        setSystemInfo(health?.data || health);
        setSensorData(latest?.data || latest);
        setConfigData(cfg?.data || cfg);
        log('Admin panel loaded successfully');
      } catch (err) {
        log(`Load error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-panel-root">

      {/* Sidebar */}
      <aside className="admin-panel-sidebar">
        <div className="admin-panel-brand">
          <img src="/assets/icon.svg" alt="" className="admin-panel-logo" />
          <div>
            <div className="admin-panel-brand-title">SproutSense</div>
            <div className="admin-panel-brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-panel-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`admin-nav-btn${activeSection === s.id ? ' active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-panel-main">

        {/* Header */}
        <header className="admin-panel-header">
          <h2 className="admin-panel-heading">
            {SECTIONS.find(s => s.id === activeSection)?.label}
          </h2>
          <span className="admin-panel-badge">🔒 Authenticated</span>
        </header>

        {loading ? (
          <div className="admin-loading">Loading system data…</div>
        ) : (
          <div className="admin-content">

            {/* ── Overview ── */}
            {activeSection === 'overview' && (
              <div className="admin-grid">
                <AdminCard title="Backend" value={systemInfo?.backend || 'Unknown'} icon="🖥️" />
                <AdminCard title="Database" value={systemInfo?.database || 'Unknown'} icon="🗄️" />
                <AdminCard title="Soil Moisture" value={sensorData?.soilMoisture != null ? `${sensorData.soilMoisture}%` : 'N/A'} icon="💧" />
                <AdminCard title="Temperature" value={sensorData?.temperature != null ? `${sensorData.temperature} °C` : 'N/A'} icon="🌡️" />
                <AdminCard title="Humidity" value={sensorData?.humidity != null ? `${sensorData.humidity}%` : 'N/A'} icon="🌫️" />
                <AdminCard title="pH Level" value={sensorData?.pH ?? sensorData?.ph ?? 'N/A'} icon="🧪" />
              </div>
            )}

            {/* ── Devices ── */}
            {activeSection === 'devices' && (
              <div className="admin-section-body">
                <h3 className="admin-section-sub">Connected Devices</h3>
                <AdminInfoRow label="ESP32 Sensor" value={systemInfo?.esp32 || 'Unknown'} />
                <AdminInfoRow label="ESP32-CAM" value={systemInfo?.esp32Cam || 'Unknown'} />
                <AdminInfoRow label="WebSocket" value={systemInfo?.websocket || 'Unknown'} />
                <AdminInfoRow label="API Version" value={systemInfo?.version || '1.0'} />
              </div>
            )}

            {/* ── Config ── */}
            {activeSection === 'config' && (
              <div className="admin-section-body">
                <h3 className="admin-section-sub">Active Configuration</h3>
                {configData
                  ? Object.entries(configData).map(([k, v]) => (
                    <AdminInfoRow key={k} label={k} value={String(v)} />
                  ))
                  : <p className="admin-empty">No config data available.</p>
                }
              </div>
            )}

            {/* ── Raw Data ── */}
            {activeSection === 'data' && (
              <div className="admin-section-body">
                <h3 className="admin-section-sub">Latest Sensor Payload</h3>
                <pre className="admin-pre">
                  {sensorData ? JSON.stringify(sensorData, null, 2) : 'No data'}
                </pre>
              </div>
            )}

            {/* ── Logs ── */}
            {activeSection === 'logs' && (
              <div className="admin-section-body">
                <h3 className="admin-section-sub">Session Action Log</h3>
                {actionLog.length === 0
                  ? <p className="admin-empty">No actions logged yet.</p>
                  : actionLog.map((entry, i) => (
                    <div key={i} className="admin-log-row">
                      <span className="admin-log-time">{entry.time}</span>
                      <span className="admin-log-msg">{entry.msg}</span>
                    </div>
                  ))
                }
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

function AdminCard({ title, value, icon }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-icon">{icon}</span>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{title}</div>
    </div>
  );
}

function AdminInfoRow({ label, value }) {
  return (
    <div className="admin-info-row">
      <span className="admin-info-label">{label}</span>
      <span className="admin-info-value">{value}</span>
    </div>
  );
}
