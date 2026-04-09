/**
 * ConfigCard.jsx — Full Redesign v3
 *
 * Uses inline SVG icons (zero CDN dependency for icons).
 * Sections:
 *   1. Header  — icon + title + last-sync badge
 *   2. Stats   — 3 live telemetry tiles
 *   3. Auto-Watering toggle row
 *   4. Data Management — Apply / Export CSV / Clear History dropdown
 *   5. Footer hint
 */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { configAPI, sensorAPI } from '../utils/api';
import '../styles/configcard.css';

/* ─── Inline SVG icon library (all MIT/free) ─────────────────────── */
const SVG = {
  sliders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4"  y1="21" x2="4"  y2="14"/>
      <line x1="4"  y1="10" x2="4"  y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8"  x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1"  y1="14" x2="7"  y2="14"/>
      <line x1="9"  y1="8"  x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  droplet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  rotateCcw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  ),
  hdd: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="12" x2="2" y2="12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
      <line x1="6" y1="16" x2="6.01" y2="16"/>
      <line x1="10" y1="16" x2="10.01" y2="16"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  spinner: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{animation:'cc-spin 0.8s linear infinite',display:'block'}}>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/>
      <path d="M21 12a9 9 0 00-9-9" strokeOpacity="1"/>
    </svg>
  ),
};

function Icon({ name, className = '' }) {
  return (
    <span className={`cc-svg-icon ${className}`} aria-hidden="true">
      {SVG[name]}
    </span>
  );
}

export function ConfigCard({ onNotification }) {
  const [autoMode,  setAutoMode]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearMenu, setClearMenu] = useState(false);
  const [stats, setStats] = useState({
    totalReadings : 0,
    todayReadings : 0,
    lastUpdate    : null,
  });

  const extract = (result) => {
    if (Array.isArray(result))                 return result;
    if (Array.isArray(result?.data))           return result.data;
    if (Array.isArray(result?.readings))       return result.readings;
    if (Array.isArray(result?.data?.readings)) return result.data.readings;
    return [];
  };

  useEffect(() => {
    (async () => {
      try {
        const [cfgRes, statsRes] = await Promise.all([
          configAPI.get(),
          sensorAPI.getHistory(24),
        ]);
        const cfg = cfgRes?.data || cfgRes;
        setAutoMode(cfg?.autoWaterEnabled || false);
        const readings = extract(statsRes);
        const today = new Date().toDateString();
        setStats({
          totalReadings : readings.length,
          todayReadings : readings.filter(r => new Date(r.timestamp).toDateString() === today).length,
          lastUpdate    : readings[0]?.timestamp || null,
        });
      } catch { /* silent */ }
    })();
  }, []);

  const handleApply = async () => {
    setLoading(true);
    try {
      await configAPI.update('ESP32-SENSOR', { autoWaterEnabled: autoMode });
      onNotification?.(`Auto-watering ${autoMode ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      onNotification?.('Failed to update configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result   = await sensorAPI.getHistory(168);
      const readings = extract(result);
      if (!readings.length) { onNotification?.('No data to export', 'info'); return; }
      const csv = [
        'Timestamp,Soil Moisture,Temperature,Humidity,Light,pH',
        ...readings.map(r =>
          `${r.timestamp},${r.soilMoisture},${r.temperature},${r.humidity},${r.light},${r.pH}`
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `sproutsense-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onNotification?.(`Exported ${readings.length} readings`, 'success');
    } catch {
      onNotification?.('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const CLEAR_OPTS = [
    { key: '1', label: 'Sensor Readings',    days: 90,  fn: configAPI.clearSensorHistory  },
    { key: '2', label: 'Watering Logs',      days: 365, fn: configAPI.clearWateringHistory },
    { key: '3', label: 'Disease Detections', days: 180, fn: configAPI.clearDiseaseHistory  },
  ];

  const handleClear = async (opt) => {
    setClearMenu(false);
    if (opt.key !== 'all' && !window.confirm(`Clear ${opt.label} older than ${opt.days} days?`)) return;
    if (opt.key === 'all' && !window.confirm('Clear ALL history? This cannot be undone!')) return;
    setClearing(true);
    try {
      if (opt.key === 'all') {
        const res = await configAPI.clearAllHistory('ESP32-SENSOR');
        onNotification?.(`Cleared ${res?.totalRecordsDeleted || 0} records`, 'success');
      } else {
        const res = await opt.fn('ESP32-SENSOR', opt.days);
        onNotification?.(`Cleared ${res?.recordsDeleted || 0} ${opt.label}`, 'success');
      }
    } catch {
      onNotification?.('Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="cc-root card">

      {/* ══ HEADER ══ */}
      <div className="cc-header">
        <span className="cc-header-icon">
          <Icon name="sliders" />
        </span>
        <div className="cc-header-text">
          <h2 className="cc-title">System Overview</h2>
          <p className="cc-subtitle">Device settings &amp; historical data</p>
        </div>
        {stats.lastUpdate && (
          <span className="cc-sync-badge">
            <Icon name="refresh" className="cc-badge-icon" />
            {format(new Date(stats.lastUpdate), 'HH:mm')}
          </span>
        )}
      </div>

      {/* ══ STAT TILES ══ */}
      <div className="cc-stats">
        <StatTile iconName="database"  color="var(--sensor-humidity)" value={stats.totalReadings}  label="24h Readings" />
        <StatTile iconName="calendar"  color="var(--sensor-moisture)" value={stats.todayReadings}  label="Today" />
        <StatTile iconName="clock"     color="var(--sensor-ph)"
          value={stats.lastUpdate ? format(new Date(stats.lastUpdate), 'HH:mm') : '—'}
          label="Last Sync" />
      </div>

      {/* ══ AUTO-WATERING ══ */}
      <div className="cc-auto-row">
        <div className="cc-auto-left">
          <span className="cc-auto-icon">
            <Icon name="droplet" />
          </span>
          <div>
            <p className="cc-auto-title">Auto-Watering</p>
            <p className="cc-auto-desc">Threshold-based irrigation — triggers below optimal soil moisture</p>
          </div>
        </div>
        <button
          className={`cc-toggle ${autoMode ? 'on' : 'off'}`}
          onClick={() => setAutoMode(v => !v)}
          aria-label="Toggle auto-watering"
        >
          <span className="cc-toggle-knob" />
        </button>
      </div>

      {/* ══ DATA MANAGEMENT ══ */}
      <div className="cc-mgmt">
        <p className="cc-mgmt-title">
          <Icon name="hdd" />
          Data Management
        </p>

        <div className="cc-actions">

          {/* Apply */}
          <button className="cc-btn cc-btn--primary" onClick={handleApply} disabled={loading}>
            <Icon name={loading ? 'spinner' : 'check'} />
            {loading ? 'Saving…' : 'Apply Settings'}
          </button>

          {/* Export */}
          <button className="cc-btn cc-btn--secondary" onClick={handleExport} disabled={exporting}>
            <Icon name={exporting ? 'spinner' : 'download'} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>

          {/* Clear — dropdown */}
          <div className="cc-clear-wrap">
            <button
              className="cc-btn cc-btn--danger"
              onClick={() => setClearMenu(v => !v)}
              disabled={clearing}
            >
              <Icon name={clearing ? 'spinner' : 'trash'} />
              {clearing ? 'Clearing…' : 'Clear History'}
              <Icon name="chevronDown" className="cc-chev" />
            </button>

            {clearMenu && (
              <>
                <div className="cc-menu-backdrop" onClick={() => setClearMenu(false)} />
                <div className="cc-clear-menu">
                  {CLEAR_OPTS.map(opt => (
                    <button key={opt.key} className="cc-clear-item" onClick={() => handleClear(opt)}>
                      <Icon name="rotateCcw" />
                      <span>{opt.label}</span>
                      <span className="cc-clear-days">&gt;{opt.days}d</span>
                    </button>
                  ))}
                  <div className="cc-clear-divider" />
                  <button
                    className="cc-clear-item cc-clear-item--all"
                    onClick={() => handleClear({ key: 'all', label: 'ALL history', days: 0 })}
                  >
                    <Icon name="trash" />
                    <span>Clear ALL</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        <p className="cc-hint">
          <Icon name="info" />
          Actions here directly affect the persistent historical database.
        </p>
      </div>

    </div>
  );
}

function StatTile({ iconName, color, value, label }) {
  return (
    <div className="cc-stat" style={{ '--cc-color': color }}>
      <span className="cc-stat-icon"><Icon name={iconName} /></span>
      <span className="cc-stat-value">{value}</span>
      <span className="cc-stat-label">{label}</span>
    </div>
  );
}
