/**
 * ConfigCard.jsx — Redesigned
 *
 * Sections:
 *  1. Header              — FA icon + title + last-sync badge
 *  2. Stats Row           — 3 live telemetry stat tiles
 *  3. Auto-Watering Row   — toggle + threshold description
 *  4. Data Management     — Apply, Export CSV, Clear History
 *  5. Footer hint
 *
 * Removed: Backend status section, Device Connected grid.
 */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { configAPI, sensorAPI } from '../utils/api';
import '../styles/configcard.css';

export function ConfigCard({ onNotification }) {
  const [autoMode,  setAutoMode]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalReadings : 0,
    todayReadings : 0,
    lastUpdate    : null,
  });

  // ── helpers
  const extract = (result) => {
    if (Array.isArray(result))              return result;
    if (Array.isArray(result?.data))        return result.data;
    if (Array.isArray(result?.readings))    return result.readings;
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

  // ── Save auto-watering setting
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

  // ── Export CSV
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

  // ── Clear history (modal-free, uses confirm)
  const CLEAR_OPTS = [
    { key: '1', label: 'Sensor Readings',    days: 90,  fn: configAPI.clearSensorHistory  },
    { key: '2', label: 'Watering Logs',      days: 365, fn: configAPI.clearWateringHistory },
    { key: '3', label: 'Disease Detections', days: 180, fn: configAPI.clearDiseaseHistory  },
  ];

  const [clearMenu, setClearMenu] = useState(false);

  const handleClear = async (opt) => {
    setClearMenu(false);
    if (!window.confirm(`Clear ${opt.label} older than ${opt.days} days?`)) return;
    setClearing(true);
    try {
      if (opt.key === 'all') {
        if (!window.confirm('Clear ALL history? This cannot be undone!')) { setClearing(false); return; }
        const res = await configAPI.clearAllHistory('ESP32-SENSOR');
        onNotification?.(`Cleared ${res.totalRecordsDeleted || 0} records`, 'success');
      } else {
        const res = await opt.fn('ESP32-SENSOR', opt.days);
        const n   = res?.recordsDeleted || 0;
        onNotification?.(`Cleared ${n} ${opt.label}`, 'success');
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
        <span className="cc-header-icon" aria-hidden="true">
          <i className="fa-solid fa-sliders" />
        </span>
        <div className="cc-header-text">
          <h2 className="cc-title">System Overview</h2>
          <p className="cc-subtitle">Manage device settings and historical data</p>
        </div>
        {stats.lastUpdate && (
          <span className="cc-sync-badge">
            <i className="fa-solid fa-rotate" aria-hidden="true" />
            {format(new Date(stats.lastUpdate), 'HH:mm')}
          </span>
        )}
      </div>

      {/* ══ STAT TILES ══ */}
      <div className="cc-stats">
        <StatTile fa="fa-database" color="#22d3ee"
          value={stats.totalReadings} label="24h Readings" />
        <StatTile fa="fa-calendar-day" color="#22c55e"
          value={stats.todayReadings} label="Today" />
        <StatTile fa="fa-clock"
          color="#a78bfa"
          value={stats.lastUpdate ? format(new Date(stats.lastUpdate), 'HH:mm') : '—'}
          label="Last Sync" />
      </div>

      {/* ══ AUTO-WATERING ROW ══ */}
      <div className="cc-auto-row">
        <div className="cc-auto-left">
          <span className="cc-auto-icon" aria-hidden="true">
            <i className="fa-solid fa-faucet-drip" />
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
          <i className="fa-solid fa-hard-drive" aria-hidden="true" /> Data Management
        </p>
        <div className="cc-actions">

          {/* Apply */}
          <button className="cc-btn cc-btn--primary" onClick={handleApply} disabled={loading}>
            <i className={`fa-solid ${loading ? 'fa-rotate fa-spin' : 'fa-check'}`} aria-hidden="true" />
            {loading ? 'Saving...' : 'Apply Settings'}
          </button>

          {/* Export */}
          <button className="cc-btn cc-btn--secondary" onClick={handleExport} disabled={exporting}>
            <i className={`fa-solid ${exporting ? 'fa-rotate fa-spin' : 'fa-file-csv'}`} aria-hidden="true" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          {/* Clear history — dropdown */}
          <div className="cc-clear-wrap">
            <button
              className="cc-btn cc-btn--danger"
              onClick={() => setClearMenu(v => !v)}
              disabled={clearing}
            >
              <i className={`fa-solid ${clearing ? 'fa-rotate fa-spin' : 'fa-trash-can'}`} aria-hidden="true" />
              {clearing ? 'Clearing...' : 'Clear History'}
              <i className="fa-solid fa-chevron-down cc-chev" aria-hidden="true" />
            </button>

            {clearMenu && (
              <div className="cc-clear-menu">
                {CLEAR_OPTS.map(opt => (
                  <button key={opt.key} className="cc-clear-item" onClick={() => handleClear(opt)}>
                    <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                    {opt.label}
                    <span className="cc-clear-days">&gt; {opt.days}d</span>
                  </button>
                ))}
                <div className="cc-clear-divider" />
                <button
                  className="cc-clear-item cc-clear-item--all"
                  onClick={() => handleClear({ key: 'all', label: 'ALL history', days: 0 })}
                >
                  <i className="fa-solid fa-trash" aria-hidden="true" /> Clear ALL
                </button>
              </div>
            )}
          </div>

        </div>
        <p className="cc-hint">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          Actions here directly affect the persistent historical database.
        </p>
      </div>

    </div>
  );
}

function StatTile({ fa, color, value, label }) {
  return (
    <div className="cc-stat" style={{ '--cc-color': color }}>
      <span className="cc-stat-icon"><i className={`fa-solid ${fa}`} aria-hidden="true" /></span>
      <span className="cc-stat-value">{value}</span>
      <span className="cc-stat-label">{label}</span>
    </div>
  );
}
