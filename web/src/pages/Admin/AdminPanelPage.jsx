/**
 * AdminPanelPage.jsx
 * Professional glass-morphism admin dashboard.
 * Sections: Overview, Devices, Config, Raw Data, Logs, Mock Data
 * Features: Font Awesome icons, animated cards, live log feed, interactive controls
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiAPI, configAPI, sensorAPI, wateringAPI } from '../../utils/api';
import { getSensorRegistry, upsertSensor, removeSensor } from '../../utils/sensorRegistry';
import './Admin.css';
import { setMockEnabled, isMockEnabled } from '../../services/mockDataService';
import MockDataPanel from './MockDataPanel';
import './MockDataPanel.css';

const SECTIONS = [
  { id: 'overview', label: 'Overview',  icon: 'fa-chart-line' },
  { id: 'devices',  label: 'Devices',   icon: 'fa-microchip' },
  { id: 'sensors',  label: 'Sensors',   icon: 'fa-wave-square' },
  { id: 'limits',   label: 'Limits',    icon: 'fa-gauge-high' },
  { id: 'config',   label: 'Config',    icon: 'fa-sliders' },
  { id: 'data',     label: 'Raw Data',  icon: 'fa-database' },
  { id: 'logs',     label: 'Logs',      icon: 'fa-terminal' },
  { id: 'mock',     label: 'Mock Data', icon: 'fa-vial' }, // New Mock Data tab
];

const LOG_TYPES = { info: 'info', success: 'success', warning: 'warning', error: 'error' };

const DEFAULT_SENSOR_FORM = {
  name: '',
  key: '',
  unit: '',
  dataType: 'number',
  category: 'custom',
  minThreshold: 0,
  maxThreshold: 100,
  warningThreshold: 70,
  criticalThreshold: 85,
  chartType: 'line',
  enabled: true,
  showInDashboard: true,
  showInAnalytics: true,
};

export default function AdminPanelPage() {
  const { logout, user } = useAuth();
  const adminUser = user?.fullName || user?.email || 'admin';
  const navigate = useNavigate();
  const logEndRef = useRef(null);

  const [activeSection, setActiveSection]   = useState('overview');
  const [systemInfo,    setSystemInfo]      = useState(null);
  const [sensorData,    setSensorData]      = useState(null);
  const [configData,    setConfigData]      = useState(null);
  const [waterStatus,   setWaterStatus]      = useState(null);
  const [aiUsageData,   setAIUsageData]     = useState(null);
  const [limitsForm,    setLimitsForm]      = useState({
    moistureThreshold: 30,
    maxWateringCyclesPerDay: 3,
    maxCyclesPerHour: 4,
    maxCyclesPerDay: 6,
    aiDailyAnalysisLimit: 2,
  });
  const [limitErrors,   setLimitErrors]     = useState({});
  const [savingLimits,  setSavingLimits]    = useState(false);
  const [logSearch,     setLogSearch]       = useState('');
  const [logLevel,      setLogLevel]        = useState('all');
  const [loading,       setLoading]          = useState(true);
  const [refreshing,    setRefreshing]       = useState(false);
  const [actionLog,     setActionLog]        = useState([]);
  const [uptime,        setUptime]           = useState(0);
  const [sidebarOpen,   setSidebarOpen]      = useState(true);
  const [sensorRegistry, setSensorRegistry] = useState([]);
  const [sensorForm, setSensorForm] = useState(DEFAULT_SENSOR_FORM);
  const [editingSensorId, setEditingSensorId] = useState(null);
  
  // Mock Data master toggle state
  const [mockEnabled, setMockEnabledState] = useState(isMockEnabled());

  const validateLimits = useCallback((values) => {
    const errors = {};
    const checks = [
      ['moistureThreshold', Number(values.moistureThreshold), 0, 100, 'Must be between 0 and 100'],
      ['maxWateringCyclesPerDay', Number(values.maxWateringCyclesPerDay), 1, 20, 'Must be between 1 and 20'],
      ['maxCyclesPerHour', Number(values.maxCyclesPerHour), 1, 24, 'Must be between 1 and 24'],
      ['maxCyclesPerDay', Number(values.maxCyclesPerDay), 1, 50, 'Must be between 1 and 50'],
      ['aiDailyAnalysisLimit', Number(values.aiDailyAnalysisLimit), 1, 100, 'Must be between 1 and 100'],
    ];

    checks.forEach(([field, numberValue, min, max, message]) => {
      if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
        errors[field] = message;
      }
    });

    return errors;
  }, []);

  const filteredLogs = actionLog.filter((entry) => {
    const levelPass = logLevel === 'all' || entry.type === logLevel;
    const query = logSearch.trim().toLowerCase();
    const queryPass = !query || [entry.msg, entry.actor, entry.section].filter(Boolean).join(' ').toLowerCase().includes(query);
    return levelPass && queryPass;
  });

  const log = useCallback((msg, type = LOG_TYPES.info, details = null) => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      date: new Date().toLocaleDateString('en-IN'),
      createdAt: new Date().toISOString(),
      msg,
      type,
      actor: adminUser || 'admin',
      section: activeSection,
      details,
    };
    setActionLog(prev => [entry, ...prev].slice(0, 100));

    configAPI.createAdminLog({
      actor: adminUser || 'admin',
      action: msg,
      level: type,
      section: activeSection,
      details,
    }).catch(() => null);
  }, [activeSection, adminUser]);

  const hydrateLimitsForm = useCallback((cfgRaw) => {
    const cfg = cfgRaw?.config || cfgRaw || {};
    setLimitsForm({
      moistureThreshold: cfg.moistureThreshold ?? 30,
      maxWateringCyclesPerDay: cfg.maxWateringCyclesPerDay ?? 3,
      maxCyclesPerHour: cfg?.wateringSystem?.maxCyclesPerHour ?? 4,
      maxCyclesPerDay: cfg?.wateringSystem?.maxCyclesPerDay ?? 6,
      aiDailyAnalysisLimit: cfg?.aiConfig?.dailyAnalysisLimit ?? 2,
    });
  }, []);

  const loadAdminLogs = useCallback(async () => {
    try {
      const logsRes = await configAPI.getAdminLogs(100).catch(() => null);
      const logs = logsRes?.logs || logsRes?.data?.logs || [];

      if (!Array.isArray(logs) || logs.length === 0) {
        return;
      }

      const mapped = logs.map((entry) => {
        const createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();
        return {
          id: entry._id || `${createdAt.getTime()}-${Math.random()}`,
          time: createdAt.toLocaleTimeString('en-IN', { hour12: false }),
          date: createdAt.toLocaleDateString('en-IN'),
          createdAt: createdAt.toISOString(),
          msg: entry.action,
          type: entry.level || LOG_TYPES.info,
          actor: entry.actor || 'admin',
          section: entry.section || 'admin-panel',
          details: entry.details || null,
        };
      });

      setActionLog(mapped);
    } catch {
      // no-op
    }
  }, []);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [health, latest, cfg, water, aiUsage] = await Promise.all([
        configAPI.getHealth().catch(() => null),
        sensorAPI.getLatest().catch(() => null),
        configAPI.get().catch(() => null),
        wateringAPI.getStatus().catch(() => null),
        aiAPI.getUsageStats().catch(() => null),
      ]);
      setSystemInfo(health?.data || health);
      setSensorData(latest?.data || latest);
      setConfigData(cfg?.data || cfg);
      setWaterStatus(water?.data || water);
      setAIUsageData(aiUsage?.data || aiUsage);
      hydrateLimitsForm(cfg?.data || cfg);
      log('System data refreshed successfully', LOG_TYPES.success);
    } catch (err) {
      log(`Fetch error: ${err.message}`, LOG_TYPES.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [log]);

  const loadSensors = useCallback(() => {
    setSensorRegistry(getSensorRegistry());
  }, []);

  useEffect(() => {
    fetchAllData();
    loadAdminLogs();
    loadSensors();
  }, [fetchAllData, loadAdminLogs, loadSensors]);

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

  const handleLogout = async () => {
    log('Admin session terminated', LOG_TYPES.warning);
    await logout();
    navigate('/login', { replace: true });
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

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportLogs = () => {
    const text = actionLog.map(e => `[${e.date} ${e.time}] [${e.type.toUpperCase()}] ${e.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `sproutsense-ui-logs-${Date.now()}.txt`);
    log('Logs exported to file', LOG_TYPES.success);
  };

  const exportAuditLogs = async (format) => {
    try {
      const blob = await configAPI.exportAdminLogs({
        format,
        q: logSearch,
        level: logLevel,
        limit: 1000,
      });

      const fileName = `sproutsense-admin-audit-${Date.now()}.${format}`;
      downloadBlob(blob, fileName);
      log(`Admin audit logs exported as ${format.toUpperCase()}`, LOG_TYPES.success, { format, logLevel, logSearch });
    } catch (err) {
      log(`Audit export failed: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleMockToggle = (e) => {
    const val = e.target.checked;
    setMockEnabledState(val);
    setMockEnabled(val);
    log(`Mock Data Mode turned ${val ? 'ON' : 'OFF'}`, val ? LOG_TYPES.warning : LOG_TYPES.info);
  };

  const handleLimitChange = (field, value) => {
    setLimitsForm(prev => {
      const next = {
        ...prev,
        [field]: value
      };
      setLimitErrors(validateLimits(next));
      return next;
    });
  };

  const handleSensorFormChange = (field, value) => {
    setSensorForm(prev => ({ ...prev, [field]: value }));
  };

  const resetSensorForm = () => {
    setSensorForm(DEFAULT_SENSOR_FORM);
    setEditingSensorId(null);
  };

  const handleSensorEdit = (sensor) => {
    setEditingSensorId(sensor.id);
    setSensorForm({ ...sensor });
    setActiveSection('sensors');
  };

  const handleSensorSave = () => {
    if (!sensorForm.name.trim() || !sensorForm.key.trim()) {
      log('Sensor save blocked: name and key are required', LOG_TYPES.warning);
      return;
    }

    const payload = {
      ...sensorForm,
      id: editingSensorId || sensorForm.id || `${sensorForm.key.trim().toLowerCase()}-${Date.now()}`,
      name: sensorForm.name.trim(),
      key: sensorForm.key.trim(),
    };

    const next = upsertSensor(payload);
    setSensorRegistry(next);
    log(`Sensor ${editingSensorId ? 'updated' : 'created'}: ${payload.name}`, LOG_TYPES.success, payload);
    resetSensorForm();
  };

  const handleSensorDelete = (sensorId, sensorName) => {
    if (!window.confirm(`Delete sensor "${sensorName}"?`)) return;
    const next = removeSensor(sensorId);
    setSensorRegistry(next);
    log(`Sensor deleted: ${sensorName}`, LOG_TYPES.warning, { sensorId, sensorName });
    if (editingSensorId === sensorId) resetSensorForm();
  };

  const handleSaveLimits = async () => {
    try {
      const errors = validateLimits(limitsForm);
      setLimitErrors(errors);
      if (Object.keys(errors).length > 0) {
        log('Limit update blocked: validation failed', LOG_TYPES.warning, errors);
        return;
      }

      setSavingLimits(true);

      const payload = {
        moistureThreshold: Number(limitsForm.moistureThreshold),
        maxWateringCyclesPerDay: Number(limitsForm.maxWateringCyclesPerDay),
        wateringSystem: {
          maxCyclesPerHour: Number(limitsForm.maxCyclesPerHour),
          maxCyclesPerDay: Number(limitsForm.maxCyclesPerDay),
        },
        aiConfig: {
          dailyAnalysisLimit: Number(limitsForm.aiDailyAnalysisLimit),
        },
      };

      await configAPI.update('ESP32-SENSOR', payload);
      log('Limits updated from admin panel', LOG_TYPES.success, payload);
      await fetchAllData(true);
    } catch (err) {
      log(`Failed to update limits: ${err.message}`, LOG_TYPES.error);
    } finally {
      setSavingLimits(false);
    }
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
                    <StatCard icon="fa-robot"        color="cyan"   label="AI Analyses"   value={aiUsageData ? `${aiUsageData.usedCount}/${aiUsageData.dailyLimit}` : 'N/A'} />
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

              {/* ── SENSORS ─────────────────────────────────── */}
              {activeSection === 'sensors' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-wave-square" /> Sensor Registry</h2>
                    <span className="adm-section-badge">Config Driven</span>
                  </div>

                  <div className="adm-device-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) 1.4fr' }}>
                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-plus" /> {editingSensorId ? 'Edit Sensor' : 'Add Sensor'}</h3>

                      <div className="adm-config-row">
                        <span className="adm-config-key">Sensor Name</span>
                        <input className="adm-input" value={sensorForm.name} onChange={(e) => handleSensorFormChange('name', e.target.value)} placeholder="Soil Moisture" />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Sensor Key / API Field</span>
                        <input className="adm-input" value={sensorForm.key} onChange={(e) => handleSensorFormChange('key', e.target.value)} placeholder="soilMoisture" />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Unit</span>
                        <input className="adm-input" value={sensorForm.unit} onChange={(e) => handleSensorFormChange('unit', e.target.value)} placeholder="% / C / lux" />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Data Type</span>
                        <select className="adm-input" value={sensorForm.dataType} onChange={(e) => handleSensorFormChange('dataType', e.target.value)}>
                          <option value="number">Number</option>
                          <option value="percent">Percent</option>
                          <option value="state">State</option>
                        </select>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Category</span>
                        <select className="adm-input" value={sensorForm.category} onChange={(e) => handleSensorFormChange('category', e.target.value)}>
                          <option value="soil">Soil</option>
                          <option value="environment">Environment</option>
                          <option value="irrigation">Irrigation</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div className="adm-config-row">
                        <span className="adm-config-key">Min Threshold</span>
                        <input className="adm-input" type="number" value={sensorForm.minThreshold} onChange={(e) => handleSensorFormChange('minThreshold', e.target.value)} />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Max Threshold</span>
                        <input className="adm-input" type="number" value={sensorForm.maxThreshold} onChange={(e) => handleSensorFormChange('maxThreshold', e.target.value)} />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Warning Threshold</span>
                        <input className="adm-input" type="number" value={sensorForm.warningThreshold} onChange={(e) => handleSensorFormChange('warningThreshold', e.target.value)} />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Critical Threshold</span>
                        <input className="adm-input" type="number" value={sensorForm.criticalThreshold} onChange={(e) => handleSensorFormChange('criticalThreshold', e.target.value)} />
                      </div>

                      <div className="adm-config-row">
                        <span className="adm-config-key">Preferred Chart Type</span>
                        <select className="adm-input" value={sensorForm.chartType} onChange={(e) => handleSensorFormChange('chartType', e.target.value)}>
                          <option value="line">Line</option>
                          <option value="area">Area</option>
                          <option value="bar">Bar</option>
                          <option value="gauge">Gauge</option>
                          <option value="scorecard">Scorecard / KPI</option>
                          <option value="status">Heatmap-style status</option>
                          <option value="table">Table</option>
                          <option value="sparkline">Sparkline</option>
                        </select>
                      </div>

                      <div className="adm-config-row">
                        <span className="adm-config-key">Enable Sensor</span>
                        <input type="checkbox" checked={Boolean(sensorForm.enabled)} onChange={(e) => handleSensorFormChange('enabled', e.target.checked)} />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Show in Dashboard</span>
                        <input type="checkbox" checked={Boolean(sensorForm.showInDashboard)} onChange={(e) => handleSensorFormChange('showInDashboard', e.target.checked)} />
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Show in Analytics</span>
                        <input type="checkbox" checked={Boolean(sensorForm.showInAnalytics)} onChange={(e) => handleSensorFormChange('showInAnalytics', e.target.checked)} />
                      </div>

                      <div className="adm-btn-row" style={{ marginTop: '1rem' }}>
                        <button className="adm-action-btn adm-action-btn--start" onClick={handleSensorSave}>
                          <i className="fa-solid fa-floppy-disk" /> {editingSensorId ? 'Update Sensor' : 'Add Sensor'}
                        </button>
                        {editingSensorId && (
                          <button className="adm-action-btn adm-action-btn--stop" onClick={resetSensorForm}>
                            <i className="fa-solid fa-xmark" /> Cancel Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-list" /> Registered Sensors ({sensorRegistry.length})</h3>
                      {sensorRegistry.length === 0 ? (
                        <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No sensors configured yet.</p>
                      ) : (
                        <div className="adm-sensor-table-wrap">
                          <table className="adm-log-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Key</th>
                                <th>Unit</th>
                                <th>Chart</th>
                                <th>Analytics</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sensorRegistry.map((sensor) => (
                                <tr key={sensor.id}>
                                  <td>{sensor.name}</td>
                                  <td>{sensor.key}</td>
                                  <td>{sensor.unit || '-'}</td>
                                  <td>{sensor.chartType}</td>
                                  <td>{sensor.showInAnalytics ? 'Yes' : 'No'}</td>
                                  <td>
                                    <div className="adm-btn-row">
                                      <button className="adm-icon-btn" onClick={() => handleSensorEdit(sensor)} title="Edit sensor">
                                        <i className="fa-solid fa-pen" />
                                      </button>
                                      <button className="adm-icon-btn adm-icon-btn--red" onClick={() => handleSensorDelete(sensor.id, sensor.name)} title="Delete sensor">
                                        <i className="fa-solid fa-trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── LIMITS ──────────────────────────────────── */}
              {activeSection === 'limits' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-gauge-high" /> Limits & Quotas</h2>
                  </div>

                  <div className="adm-device-grid" style={{ marginBottom: '1rem' }}>
                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-droplet" /> Moisture & Watering</h3>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Soil Moisture Threshold (%)</span>
                        <div>
                          <input className="adm-input" type="number" min="0" max="100" value={limitsForm.moistureThreshold} onChange={(e) => handleLimitChange('moistureThreshold', e.target.value)} />
                          {limitErrors.moistureThreshold && <div className="adm-input-error">{limitErrors.moistureThreshold}</div>}
                        </div>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Max Watering Cycles / Day</span>
                        <div>
                          <input className="adm-input" type="number" min="1" max="20" value={limitsForm.maxWateringCyclesPerDay} onChange={(e) => handleLimitChange('maxWateringCyclesPerDay', e.target.value)} />
                          {limitErrors.maxWateringCyclesPerDay && <div className="adm-input-error">{limitErrors.maxWateringCyclesPerDay}</div>}
                        </div>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Watering System Max Cycles / Hour</span>
                        <div>
                          <input className="adm-input" type="number" min="1" max="24" value={limitsForm.maxCyclesPerHour} onChange={(e) => handleLimitChange('maxCyclesPerHour', e.target.value)} />
                          {limitErrors.maxCyclesPerHour && <div className="adm-input-error">{limitErrors.maxCyclesPerHour}</div>}
                        </div>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Watering System Max Cycles / Day</span>
                        <div>
                          <input className="adm-input" type="number" min="1" max="50" value={limitsForm.maxCyclesPerDay} onChange={(e) => handleLimitChange('maxCyclesPerDay', e.target.value)} />
                          {limitErrors.maxCyclesPerDay && <div className="adm-input-error">{limitErrors.maxCyclesPerDay}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-robot" /> AI Quota</h3>
                      <div className="adm-config-row">
                        <span className="adm-config-key">AI Analyses / Day</span>
                        <div>
                          <input className="adm-input" type="number" min="1" max="100" value={limitsForm.aiDailyAnalysisLimit} onChange={(e) => handleLimitChange('aiDailyAnalysisLimit', e.target.value)} />
                          {limitErrors.aiDailyAnalysisLimit && <div className="adm-input-error">{limitErrors.aiDailyAnalysisLimit}</div>}
                        </div>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Usage Today</span>
                        <span className="adm-config-val">{aiUsageData ? `${aiUsageData.usedCount}/${aiUsageData.dailyLimit}` : 'N/A'}</span>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Remaining</span>
                        <span className="adm-config-val">{aiUsageData ? aiUsageData.remaining : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="adm-btn-row" style={{ marginTop: '0.75rem' }}>
                    <button className="adm-action-btn adm-action-btn--start" onClick={handleSaveLimits} disabled={savingLimits || Object.keys(limitErrors).length > 0}>
                      <i className="fa-solid fa-save" /> {savingLimits ? 'Saving...' : 'Save Limits'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── CONFIG ──────────────────────────────────── */}
              {activeSection === 'config' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-sliders" /> Active Configuration</h2>
                  </div>
                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-file-code" /> Config Snapshot</h3>
                    <p className="adm-header-sub">Read-only config view. Use Limits tab to edit operational limits.</p>
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
                    <h2><i className="fa-solid fa-terminal" /> Admin Audit Logs</h2>
                    <div className="adm-btn-row">
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={exportLogs} title="Export current on-screen text logs">
                        <i className="fa-solid fa-file-arrow-down" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('csv')} title="Export filtered audit logs CSV">
                        <i className="fa-solid fa-file-csv" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('json')} title="Export filtered audit logs JSON">
                        <i className="fa-solid fa-file-code" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--red" onClick={clearLogs} title="Clear logs">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Search</span>
                      <input
                        className="adm-input"
                        style={{ width: '220px' }}
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search action, actor, section"
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Level</span>
                      <select className="adm-input" value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
                        <option value="all">All</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </div>

                  <div className="adm-log-stats">
                    <LogBadge type="success" count={filteredLogs.filter(l => l.type === 'success').length} label="Success" />
                    <LogBadge type="info"    count={filteredLogs.filter(l => l.type === 'info').length}    label="Info" />
                    <LogBadge type="warning" count={filteredLogs.filter(l => l.type === 'warning').length} label="Warning" />
                    <LogBadge type="error"   count={filteredLogs.filter(l => l.type === 'error').length}   label="Error" />
                  </div>

                  <div className="adm-glass-box" style={{ marginTop: '1rem' }}>
                    <h3><i className="fa-solid fa-table" /> Filtered Log Table ({filteredLogs.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="adm-log-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Level</th>
                            <th>Actor</th>
                            <th>Section</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="adm-log-table-empty">No matching logs</td>
                            </tr>
                          ) : filteredLogs.map((entry) => (
                            <tr key={`row-${entry.id}`}>
                              <td>{entry.date} {entry.time}</td>
                              <td>
                                <span className={`adm-log-type adm-log-type--${entry.type}`}>
                                  {entry.type?.toUpperCase()}
                                </span>
                              </td>
                              <td>{entry.actor || 'admin'}</td>
                              <td>{entry.section || '-'}</td>
                              <td>{entry.msg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="adm-log-terminal">
                    {filteredLogs.length === 0 ? (
                      <div className="adm-empty">
                        <i className="fa-solid fa-circle-check" /> No actions logged yet.
                      </div>
                    ) : (
                      filteredLogs.map(entry => (
                        <div key={entry.id} className={`adm-log-row adm-log-row--${entry.type}`}>
                          <span className="adm-log-time">[{entry.time}]</span>
                          <span className={`adm-log-type adm-log-type--${entry.type}`}>
                            [{entry.type.toUpperCase()}]
                          </span>
                          <span className="adm-log-msg">{entry.actor || 'admin'}@{entry.section || 'admin-panel'} - {entry.msg}</span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}
              
              {/* ── MOCK DATA ───────────────────────────────── */}
              {activeSection === 'mock' && (
                <div className="adm-section">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
                  }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main, #fff)', margin: '0 0 0.25rem 0' }}>
                        <i className="fa-solid fa-vial" style={{ color: 'var(--color-primary, #10b981)', marginRight: '0.5rem' }} />
                        Mock Data Control
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', margin: 0 }}>
                        Override live API data for testing and presentations. Default: Off.
                      </p>
                    </div>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        color: mockEnabled ? 'var(--color-primary, #10b981)' : 'var(--text-muted, #9ca3af)'
                      }}>
                        {mockEnabled ? 'ON' : 'OFF'}
                      </span>

                      <span style={{ position: 'relative', display: 'inline-block', width: 52, height: 28 }}>
                        <input
                          type="checkbox"
                          checked={mockEnabled}
                          onChange={handleMockToggle}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                          aria-label="Enable mock data mode"
                        />
                        <span style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 9999,
                          background: mockEnabled ? 'var(--color-primary, #10b981)' : 'var(--bg-glass-strong, rgba(255, 255, 255, 0.1))',
                          transition: 'background 200ms ease',
                          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.2))',
                        }}>
                          <span style={{
                            position: 'absolute',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            top: 3,
                            left: mockEnabled ? 27 : 3,
                            transition: 'left 200ms ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          }} />
                        </span>
                      </span>
                    </label>
                  </div>

                  {mockEnabled ? (
                    <MockDataPanel />
                  ) : (
                    <div className="adm-glass-box" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <i className="fa-solid fa-power-off" style={{ fontSize: '2.5rem', color: 'var(--text-muted, #9ca3af)', marginBottom: '1rem' }} />
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)' }}>Mock Data is Disabled</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted, #9ca3af)', maxWidth: '400px', marginInline: 'auto' }}>
                        Turn on the switch above to reveal the control panel and inject mock scenarios into the dashboard.
                      </p>
                    </div>
                  )}
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