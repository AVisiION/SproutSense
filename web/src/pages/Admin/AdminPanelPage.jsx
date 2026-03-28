/**
 * AdminPanelPage.jsx
 * Professional glass-morphism admin dashboard.
 * Sections: Overview, Devices, Config, Raw Data, Logs
 * Features: Font Awesome icons, animated cards, live log feed, interactive controls
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { configAPI, sensorAPI, wateringAPI } from '../../utils/api';
import './Admin.css';

const SECTIONS = [
  { id: 'overview', label: 'Overview',  icon: 'fa-chart-line' },
  { id: 'devices',  label: 'Devices',   icon: 'fa-microchip' },
  { id: 'config',   label: 'Config',    icon: 'fa-sliders' },
  { id: 'data',     label: 'Raw Data',  icon: 'fa-database' },
  { id: 'logs',     label: 'Logs',      icon: 'fa-terminal' },
];

const LOG_TYPES = { info: 'info', success: 'success', warning: 'warning', error: 'error' };

export default function AdminPanelPage() {
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const logEndRef = useRef(null);

  const [activeSection, setActiveSection]   = useState('overview');
  const [systemInfo,    setSystemInfo]       = useState(null);
  const [sensorData,    setSensorData]       = useState(null);
  const [configData,    setConfigData]       = useState(null);
  const [waterStatus,   setWaterStatus]      = useState(null);
  const [loading,       setLoading]          = useState(true);
  const [refreshing,    setRefreshing]       = useState(false);
  const [actionLog,     setActionLog]        = useState([]);
  const [uptime,        setUptime]           = useState(0);
  const [sidebarOpen,   setSidebarOpen]      = useState(true);

  const log = useCallback((msg, type = LOG_TYPES.info) => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      date: new Date().toLocaleDateString('en-IN'),
      msg,
      type,
    };
    setActionLog(prev => [entry, ...prev].slice(0, 100));
  }, []);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [health, latest, cfg, water] = await Promise.all([
        configAPI.getHealth().catch(() => null),
        sensorAPI.getLatest().catch(() => null),
        configAPI.get().catch(() => null),
        wateringAPI.getStatus().catch(() => null),
      ]);
      setSystemInfo(health?.data || health);
      setSensorData(latest?.data || latest);
      setConfigData(cfg?.data || cfg);
      setWaterStatus(water?.data || water);
      log('System data refreshed successfully', LOG_TYPES.success);
    } catch (err) {
      log(`Fetch error: ${err.message}`, LOG_TYPES.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [log]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  useEffect(() => {
    const interval = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actionLog]);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleLogout = () => {
    log('Admin session terminated', LOG_TYPES.warning);
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const handleWaterStart = async () => {
    try {
      log('Sending water START command...', LOG_TYPES.info);
      await wateringAPI.start();
      log('Watering started successfully', LOG_TYPES.success);
      fetchAllData(true);
    } catch (err) {
      log(`Water start failed: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleWaterStop = async () => {
    try {
      log('Sending water STOP command...', LOG_TYPES.info);
      await wateringAPI.stop();
      log('Watering stopped successfully', LOG_TYPES.success);
      fetchAllData(true);
    } catch (err) {
      log(`Water stop failed: ${err.message}`, LOG_TYPES.error);
    }
  };

  const clearLogs = () => {
    setActionLog([]);
    log('Log history cleared', LOG_TYPES.warning);
  };

  const exportLogs = () => {
    const text = actionLog.map(e => `[${e.date} ${e.time}] [${e.type.toUpperCase()}] ${e.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sproutsense-logs-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    log('Logs exported to file', LOG_TYPES.success);
  };

  return (
    <div className={`adm-root${sidebarOpen ? '' : ' adm-root--collapsed'}`}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <img src="/assets/icon.svg" alt="" className="adm-brand-logo" />
          <div className="adm-brand-text">
            <span className="adm-brand-name">SproutSense</span>
            <span className="adm-brand-role">Admin Panel</span>
          </div>
        </div>

        <div className="adm-sidebar-divider" />

        <nav className="adm-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`adm-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <i className={`fa-solid ${s.icon} adm-nav-icon`} />
              <span className="adm-nav-label">{s.label}</span>
              {activeSection === s.id && <span className="adm-nav-pill" />}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-session-info">
            <i className="fa-solid fa-clock" />
            <span>Session: {formatUptime(uptime)}</span>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="adm-main">

        {/* Header */}
        <header className="adm-header">
          <div className="adm-header-left">
            <button className="adm-toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
              <i className="fa-solid fa-bars" />
            </button>
            <div>
              <h1 className="adm-header-title">
                <i className={`fa-solid ${SECTIONS.find(s => s.id === activeSection)?.icon}`} />
                &ensp;{SECTIONS.find(s => s.id === activeSection)?.label}
              </h1>
              <p className="adm-header-sub">SproutSense Control Panel</p>
            </div>
          </div>
          <div className="adm-header-right">
            <span className="adm-badge adm-badge--green">
              <i className="fa-solid fa-shield-halved" /> Authenticated
            </span>
            <button
              className={`adm-refresh-btn${refreshing ? ' spinning' : ''}`}
              onClick={() => fetchAllData(true)}
              title="Refresh all data"
            >
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="adm-content">
          {loading ? (
            <div className="adm-loading">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <span>Loading system data&hellip;</span>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ────────────────────────────────── */}
              {activeSection === 'overview' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-chart-line" /> System Overview</h2>
                    <span className="adm-section-badge">Live</span>
                  </div>

                  <div className="adm-cards-grid">
                    <StatCard icon="fa-server"       color="blue"   label="Backend"      value={systemInfo?.backend   || 'Online'} />
                    <StatCard icon="fa-database"     color="green"  label="Database"     value={systemInfo?.database  || 'Connected'} />
                    <StatCard icon="fa-temperature-half" color="orange" label="Temperature" value={sensorData?.temperature != null ? `${sensorData.temperature} °C` : 'N/A'} />
                    <StatCard icon="fa-droplet"      color="cyan"   label="Humidity"     value={sensorData?.humidity != null ? `${sensorData.humidity}%` : 'N/A'} />
                    <StatCard icon="fa-seedling"     color="lime"   label="Soil Moisture" value={sensorData?.soilMoisture != null ? `${sensorData.soilMoisture}%` : 'N/A'} />
                    <StatCard icon="fa-flask"        color="purple" label="pH Level"      value={sensorData?.pH ?? sensorData?.ph ?? 'N/A'} />
                    <StatCard icon="fa-sun"          color="yellow" label="Light Level"   value={sensorData?.lightLevel != null ? `${sensorData.lightLevel} lux` : 'N/A'} />
                    <StatCard icon="fa-tachometer-alt" color="red" label="API Version"   value={systemInfo?.version || '1.0.0'} />
                  </div>

                  <div className="adm-water-controls">
                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-faucet-drip" /> Irrigation Control</h3>
                      <p className="adm-water-status">
                        Status:&nbsp;
                        <span className={`adm-badge ${waterStatus?.isWatering ? 'adm-badge--blue' : 'adm-badge--gray'}`}>
                          {waterStatus?.isWatering ? 'Active' : 'Idle'}
                        </span>
                      </p>
                      <div className="adm-btn-row">
                        <button className="adm-action-btn adm-action-btn--start" onClick={handleWaterStart}>
                          <i className="fa-solid fa-play" /> Start Watering
                        </button>
                        <button className="adm-action-btn adm-action-btn--stop" onClick={handleWaterStop}>
                          <i className="fa-solid fa-stop" /> Stop Watering
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DEVICES ─────────────────────────────────── */}
              {activeSection === 'devices' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-microchip" /> Connected Devices</h2>
                  </div>
                  <div className="adm-device-grid">
                    <DeviceCard
                      name="ESP32-SENSOR"
                      icon="fa-wifi"
                      status={systemInfo?.esp32 || 'Unknown'}
                      detail="Environmental monitoring node"
                      color="green"
                    />
                    <DeviceCard
                      name="ESP32-CAM"
                      icon="fa-camera"
                      status={systemInfo?.esp32Cam || 'Unknown'}
                      detail="AI disease detection camera"
                      color="blue"
                    />
                    <DeviceCard
                      name="WebSocket"
                      icon="fa-bolt"
                      status={systemInfo?.websocket || 'Unknown'}
                      detail="Real-time data stream"
                      color="yellow"
                    />
                    <DeviceCard
                      name="Backend API"
                      icon="fa-server"
                      status={systemInfo?.backend || 'Online'}
                      detail="Node.js Express server"
                      color="purple"
                    />
                  </div>
                </div>
              )}

              {/* ── CONFIG ──────────────────────────────────── */}
              {activeSection === 'config' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-sliders" /> Active Configuration</h2>
                  </div>
                  <div className="adm-glass-box">
                    {configData
                      ? Object.entries(configData).map(([k, v]) => (
                        <div className="adm-config-row" key={k}>
                          <span className="adm-config-key">
                            <i className="fa-solid fa-code" />&ensp;{k}
                          </span>
                          <span className="adm-config-val">{String(v)}</span>
                        </div>
                      ))
                      : <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No config data available.</p>
                    }
                  </div>
                </div>
              )}

              {/* ── RAW DATA ────────────────────────────────── */}
              {activeSection === 'data' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-database" /> Latest Sensor Payload</h2>
                    <button className="adm-icon-btn" onClick={() => fetchAllData(true)} title="Refresh">
                      <i className="fa-solid fa-rotate" />
                    </button>
                  </div>
                  <div className="adm-glass-box">
                    <pre className="adm-pre">
                      {sensorData ? JSON.stringify(sensorData, null, 2) : 'No data available.'}
                    </pre>
                  </div>
                  <div className="adm-glass-box" style={{marginTop:'1rem'}}>
                    <h3 style={{marginBottom:'0.75rem'}}><i className="fa-solid fa-droplet" /> Water Status Payload</h3>
                    <pre className="adm-pre">
                      {waterStatus ? JSON.stringify(waterStatus, null, 2) : 'No data available.'}
                    </pre>
                  </div>
                </div>
              )}

              {/* ── LOGS ────────────────────────────────────── */}
              {activeSection === 'logs' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-terminal" /> Session Action Log</h2>
                    <div className="adm-btn-row">
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={exportLogs} title="Export logs">
                        <i className="fa-solid fa-file-arrow-down" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--red" onClick={clearLogs} title="Clear logs">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className="adm-log-stats">
                    <LogBadge type="success" count={actionLog.filter(l => l.type === 'success').length} label="Success" />
                    <LogBadge type="info"    count={actionLog.filter(l => l.type === 'info').length}    label="Info" />
                    <LogBadge type="warning" count={actionLog.filter(l => l.type === 'warning').length} label="Warning" />
                    <LogBadge type="error"   count={actionLog.filter(l => l.type === 'error').length}   label="Error" />
                  </div>

                  <div className="adm-log-terminal">
                    {actionLog.length === 0 ? (
                      <div className="adm-empty">
                        <i className="fa-solid fa-circle-check" /> No actions logged yet.
                      </div>
                    ) : (
                      actionLog.map(entry => (
                        <div key={entry.id} className={`adm-log-row adm-log-row--${entry.type}`}>
                          <span className="adm-log-time">[{entry.time}]</span>
                          <span className={`adm-log-type adm-log-type--${entry.type}`}>
                            [{entry.type.toUpperCase()}]
                          </span>
                          <span className="adm-log-msg">{entry.msg}</span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <div className={`adm-stat-card adm-stat-card--${color}`}>
      <div className="adm-stat-icon-wrap">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="adm-stat-body">
        <div className="adm-stat-value">{value}</div>
        <div className="adm-stat-label">{label}</div>
      </div>
    </div>
  );
}

function DeviceCard({ name, icon, status, detail, color }) {
  const isOnline = status?.toLowerCase().includes('online') ||
                   status?.toLowerCase().includes('connected') ||
                   status?.toLowerCase().includes('active');
  return (
    <div className={`adm-device-card adm-device-card--${color}`}>
      <div className="adm-device-icon">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="adm-device-info">
        <div className="adm-device-name">{name}</div>
        <div className="adm-device-detail">{detail}</div>
        <div className="adm-device-status">
          <span className={`adm-status-dot ${isOnline ? 'adm-status-dot--green' : 'adm-status-dot--red'}`} />
          {status}
        </div>
      </div>
    </div>
  );
}

function LogBadge({ type, count, label }) {
  return (
    <div className={`adm-log-badge adm-log-badge--${type}`}>
      <span className="adm-log-badge-count">{count}</span>
      <span className="adm-log-badge-label">{label}</span>
    </div>
  );
}
