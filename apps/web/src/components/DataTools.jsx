import React, { useState } from 'react';
import { format } from 'date-fns';
import { configAPI, sensorAPI } from '../utils/api';

const SVG = {
  database: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  timer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/><path d="M12 2v3"/></svg>),
  download: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  spinner: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'sp-spin 0.8s linear infinite',display:'block'}}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/><path d="M21 12a9 9 0 00-9-9" strokeOpacity="1"/></svg>),
  trash: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>),
  broadcast: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 010 10.72M5.64 6.64a9 9 0 000 10.72"/><path d="M15.54 9.46a5 5 0 010 5.08M8.46 9.46a5 5 0 000 5.08"/><line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="3"/></svg>),
  copy: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>),
};

function Icon({ name, size = 14 }) {
  return (
    <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
      {SVG[name] || null}
    </span>
  );
}

export default function DataTools({ selectedDeviceId = 'ESP32-SENSOR', stats = {}, onNotification }) {
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [latestRaw, setLatestRaw] = useState(null);
  const [loadingLatestRaw, setLoadingLatestRaw] = useState(false);

  const extract = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.readings)) return result.readings;
    if (Array.isArray(result?.data?.readings)) return result.data.readings;
    return [];
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const result = await sensorAPI.getHistory(168, selectedDeviceId);
      const readings = extract(result);
      if (!readings.length) { onNotification?.('No records available to export', 'info'); return; }
      const csv = [
        'Timestamp,Soil Moisture,Temperature,Humidity,Light,pH',
        ...readings.map(r => `${r.timestamp},${r.soilMoisture},${r.temperature},${r.humidity},${r.light},${r.pH}`)
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sproutsense-data-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onNotification?.(`Exported ${readings.length} records`, 'success');
    } catch (err) {
      onNotification?.('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleClear = async (type) => {
    const confirmMsg = type === 'all'
      ? 'Clear ALL history? This cannot be undone!'
      : `Clear ${type} older than default retention?`;
    if (!window.confirm(confirmMsg)) return;
    setClearing(true);
    try {
      let res;
      if (type === 'sensor') res = await configAPI.clearSensorHistory(selectedDeviceId, 90);
      else if (type === 'watering') res = await configAPI.clearWateringHistory(selectedDeviceId, 365);
      else if (type === 'disease') res = await configAPI.clearDiseaseHistory(selectedDeviceId, 180);
      else if (type === 'all') res = await configAPI.clearAllHistory(selectedDeviceId);

      // interpret backend response
      let count = 0;
      if (type === 'all') {
        if (res?.deleted && typeof res.deleted === 'object') {
          count = Object.values(res.deleted).reduce((s, v) => s + (Number(v) || 0), 0);
        } else {
          count = Number(res?.deleted ?? res?.deletedCount ?? res?.totalRecordsDeleted ?? 0) || 0;
        }
        onNotification?.(`Cleared ${count} total records`, 'success');
      } else {
        count = Number(res?.deleted ?? res?.deletedCount ?? res?.recordsDeleted ?? 0) || 0;
        onNotification?.(`Cleared ${count} ${type} records`, 'success');
      }
    } catch {
      onNotification?.('Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const refreshLatest = async () => {
    setLoadingLatestRaw(true);
    try {
      const res = await sensorAPI.getLatest(selectedDeviceId).catch(() => null);
      const payload = res?.data || res || null;
      setLatestRaw(payload);
    } catch {
      onNotification?.('Failed to load latest payload', 'error');
      setLatestRaw(null);
    } finally {
      setLoadingLatestRaw(false);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestRaw || {}, null, 2));
      onNotification?.('Copied raw payload to clipboard', 'success');
    } catch {
      onNotification?.('Copy failed', 'error');
    }
  };

  return (
    <div className="sp-data-tools">
      <div className="sp-about-grid sp-data-stats-grid">
        <div className="sp-about-tile">
          <span className="sp-about-tile-icon"><Icon name="database" size={14} /></span>
          <span className="sp-about-tile-label">24h Readings</span>
          <span className="sp-about-tile-value">{stats.totalReadings ?? '--'}</span>
        </div>
        <div className="sp-about-tile">
          <span className="sp-about-tile-icon"><Icon name="calendar" size={14} /></span>
          <span className="sp-about-tile-label">Today</span>
          <span className="sp-about-tile-value">{stats.todayReadings ?? '--'}</span>
        </div>
        <div className="sp-about-tile">
          <span className="sp-about-tile-icon"><Icon name="timer" size={14} /></span>
          <span className="sp-about-tile-label">Last Sync</span>
          <span className="sp-about-tile-value">{stats.lastUpdate ? format(new Date(stats.lastUpdate), 'HH:mm') : '--'}</span>
        </div>
      </div>

      <div className="sp-action-row">
        <button className="sp-btn sp-btn--secondary" onClick={handleExportCsv} disabled={exporting}>
          <Icon name={exporting ? 'spinner' : 'download'} size={14} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>

        <div style={{display:'flex',gap:8}}>
          <button className="sp-btn sp-btn--danger" onClick={() => handleClear('sensor')} disabled={clearing}>
            <Icon name={clearing ? 'spinner' : 'trash'} size={14} />
            {clearing ? 'Clearing…' : 'Clear Sensor'}
          </button>
          <button className="sp-btn sp-btn--danger" onClick={() => handleClear('watering')} disabled={clearing}>
            <Icon name={clearing ? 'spinner' : 'trash'} size={14} />
            Clear Watering
          </button>
          <button className="sp-btn sp-btn--danger" onClick={() => handleClear('disease')} disabled={clearing}>
            <Icon name={clearing ? 'spinner' : 'trash'} size={14} />
            Clear Disease
          </button>
          <button className="sp-btn sp-btn--danger" onClick={() => handleClear('all')} disabled={clearing}>
            <Icon name={clearing ? 'spinner' : 'trash'} size={14} />
            Clear ALL
          </button>
        </div>
      </div>

      <div className="sp-raw-data">
        <div className="sp-raw-data-head">
          <h3>Latest Raw Payload</h3>
          <div style={{display:'flex',gap:8}}>
            <button className="sp-btn sp-btn--secondary" onClick={refreshLatest} disabled={loadingLatestRaw}>
              <Icon name={loadingLatestRaw ? 'spinner' : 'broadcast'} size={14} />
              {loadingLatestRaw ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="sp-btn sp-btn--ghost" onClick={handleCopyRaw} disabled={!latestRaw}>
              <Icon name="copy" size={14} />
              Copy
            </button>
          </div>
        </div>
        <div className="sp-raw-data-body">
          <pre className="sp-raw-pre" aria-live="polite">{latestRaw ? JSON.stringify(latestRaw, null, 2) : 'No data available.'}</pre>
        </div>
      </div>
    </div>
  );
}
