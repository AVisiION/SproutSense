import React, { useState, useEffect, useCallback } from 'react';
import { sensorAPI } from '../utils/api';
import { GlassIcon } from '../components/GlassIcon';
import './RecordsPage.css';

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

function sparkline(values, width = 120, height = 36) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} className="sparkline">
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="2.5" fill="currentColor" />
    </svg>
  );
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[2]); // 24h default
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - selectedRange.hours * 3600 * 1000);
      const resp = await sensorAPI.getHistory(start.toISOString(), end.toISOString());
      const data = resp.data || resp || [];
      setRecords(Array.isArray(data) ? data : data.readings || []);
      setTotalRecords(Array.isArray(data) ? data.length : data.total || data.length || 0);
      setPage(1);
    } catch (e) {
      setError('Failed to load records. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Pagination
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRecords = records.slice(startIdx, startIdx + PAGE_SIZE);
  const totalPages = Math.ceil(records.length / PAGE_SIZE);

  // Sparkline data for each metric
  const metrics = ['soilMoisture', 'temperature', 'humidity', 'light', 'pH'];
  const metricInfo = {
    soilMoisture: { label: 'Soil Moisture', unit: '%', icon: 'humidity', color: '#22c55e' },
    temperature:  { label: 'Temperature', unit: '°C', icon: 'temperature', color: '#f59e0b' },
    humidity:     { label: 'Humidity', unit: '%', icon: 'weather', color: '#22d3ee' },
    light:        { label: 'Light', unit: 'lux', icon: 'light', color: '#fbbf24' },
    pH:           { label: 'pH', unit: '', icon: 'ph', color: '#a78bfa' },
  };

  function metricValues(key) {
    return records.map(r => r[key]).filter(v => v !== undefined && v !== null);
  }

  function avg(arr) {
    return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
  }

  function minVal(arr) {
    return arr.length ? Math.min(...arr).toFixed(1) : '—';
  }

  function maxVal(arr) {
    return arr.length ? Math.max(...arr).toFixed(1) : '—';
  }

  return (
    <div className="records-page">
      {/* Header */}
      <div className="records-header">
        <div className="records-header-left">
          <GlassIcon name="records" />
          <div>
            <h1 className="records-title">Data Records</h1>
            <p className="records-subtitle">
              {totalRecords} readings stored &mdash; MongoDB IoT database
            </p>
          </div>
        </div>
        <div className="records-header-right">
          <div className="records-range-tabs">
            {TIME_RANGES.map(r => (
              <button
                key={r.label}
                className={`records-range-tab${selectedRange.label === r.label ? ' active' : ''}`}
                onClick={() => setSelectedRange(r)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="records-refresh-btn" onClick={fetchRecords} title="Refresh">
            <GlassIcon name="refresh" />
          </button>
        </div>
      </div>

      {/* Summary sparklines */}
      {!loading && records.length > 0 && (
        <div className="records-summary-grid">
          {metrics.map(key => {
            const vals = metricValues(key);
            const info = metricInfo[key];
            if (!vals.length) return null;
            return (
              <div className="records-summary-card" key={key} style={{ '--metric-color': info.color }}>
                <div className="rsc-top">
                  <GlassIcon name={info.icon} />
                  <span className="rsc-label">{info.label}</span>
                </div>
                <div className="rsc-sparkline">{sparkline(vals)}</div>
                <div className="rsc-stats">
                  <span>Avg <strong>{avg(vals)}{info.unit}</strong></span>
                  <span>Min <strong>{minVal(vals)}{info.unit}</strong></span>
                  <span>Max <strong>{maxVal(vals)}{info.unit}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Records table */}
      <div className="records-table-card">
        <div className="records-table-header">
          <span>Recent Sensor Readings</span>
          <span className="records-count">{records.length} records</span>
        </div>

        {loading && (
          <div className="records-loading">
            <div className="records-spinner" />
            Loading records from MongoDB...
          </div>
        )}

        {error && !loading && (
          <div className="records-error">
            <GlassIcon name="warning" />
            {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="records-empty">
            <GlassIcon name="database" />
            <p>No records found for the selected time range.</p>
            <p className="records-empty-hint">Data is stored automatically 5× per day via scheduled job.</p>
          </div>
        )}

        {!loading && !error && pageRecords.length > 0 && (
          <>
            <div className="records-table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Soil Moisture</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Light</th>
                    <th>pH</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((rec, i) => (
                    <tr key={rec._id || i}>
                      <td className="records-ts">{formatTimestamp(rec.timestamp)}</td>
                      <td>
                        <span className={`records-val${rec.soilMoisture < 20 ? ' warn' : ''}`}>
                          {rec.soilMoisture !== undefined ? `${rec.soilMoisture}%` : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`records-val${rec.temperature > 38 ? ' warn' : ''}`}>
                          {rec.temperature !== undefined ? `${rec.temperature}°C` : '—'}
                        </span>
                      </td>
                      <td>{rec.humidity !== undefined ? `${rec.humidity}%` : '—'}</td>
                      <td>{rec.light !== undefined ? `${rec.light} lux` : '—'}</td>
                      <td>
                        <span className={`records-val${rec.pH !== undefined && (rec.pH < 5.5 || rec.pH > 7.5) ? ' warn' : ''}`}>
                          {rec.pH !== undefined ? rec.pH : '—'}
                        </span>
                      </td>
                      <td className="records-device">{rec.deviceId || 'ESP32-001'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="records-pagination">
                <button
                  className="records-page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹ Prev
                </button>
                <span className="records-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="records-page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
