import React, { useState, useEffect, useCallback } from 'react';
import { sensorAPI } from '../utils/api';
import { GlassIcon } from '../components/GlassIcon';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './RecordsPage.css';

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{formatTimestamp(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            <strong>{entry.name}:</strong> {entry.value.toFixed(1)}{entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatShortTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else if (hours < 24) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
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

  // Prepare chart data
  const chartData = records.map(r => ({
    timestamp: r.timestamp,
    soilMoisture: r.soilMoisture,
    temperature: r.temperature,
    humidity: r.humidity,
    light: r.light,
    pH: r.pH ? r.pH * 10 : null, // Scale pH for better visibility
  })).reverse(); // Show oldest to newest for timeline

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
        <>
          {/* Main Multi-Metric Chart */}
          <div className="records-main-chart-card">
            <div className="chart-header">
              <h2>Sensor Trends Overview</h2>
              <p>Real-time monitoring across all metrics</p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatShortTime}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Moisture / Temp / Humidity (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Light (lux)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Soil Moisture (%)"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Temperature (°C)"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  name="Humidity (%)"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="light" 
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  name="Light (lux)"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Metric Cards with Area Charts */}
          <div className="records-summary-grid">
            {metrics.map(key => {
              const vals = metricValues(key);
              const info = metricInfo[key];
              if (!vals.length) return null;
              
              const individualData = records.map(r => ({
                timestamp: r.timestamp,
                value: r[key],
              })).reverse().filter(d => d.value !== undefined && d.value !== null);

              return (
                <div className="records-summary-card" key={key} style={{ '--metric-color': info.color }}>
                  <div className="rsc-top">
                    <GlassIcon name={info.icon} />
                    <span className="rsc-label">{info.label}</span>
                  </div>
                  <div className="rsc-chart">
                    <ResponsiveContainer width="100%" height={80}>
                      <AreaChart data={individualData}>
                        <defs>
                          <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={info.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={info.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={info.color} 
                          strokeWidth={2}
                          fill={`url(#gradient-${key})`}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rsc-stats">
                    <span>Avg <strong>{avg(vals)}{info.unit}</strong></span>
                    <span>Min <strong>{minVal(vals)}{info.unit}</strong></span>
                    <span>Max <strong>{maxVal(vals)}{info.unit}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
