import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { configAPI, sensorAPI } from '../utils/api';
import { GlassIcon } from './bits/GlassIcon';
import '../styles/configcard.css';

export function ConfigCard({ onNotification, systemStatus }) {
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReadings: 0,
    todayReadings: 0,
    lastUpdate: null,
  });
  const [clearing, setClearing] = useState(false);

  const extractReadings = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.readings)) return result.readings;
    if (Array.isArray(result?.data?.readings)) return result.data.readings;
    return [];
  };

  const formatNextCleanupMessage = (result, label) => {
    const analyticsDeleted = result?.recordsDeleted || 0;
    const nextCleanupDate = result?.nextCleanup ? new Date(result.nextCleanup) : null;
    const hasValidNextCleanup = nextCleanupDate && !Number.isNaN(nextCleanupDate.getTime());

    return hasValidNextCleanup
      ? `Cleared ${analyticsDeleted} ${label}. Next cleanup: ${nextCleanupDate.toLocaleDateString()}`
      : `Cleared ${analyticsDeleted} ${label}.`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [configResponse, statsResponse] = await Promise.all([
          configAPI.get(),
          sensorAPI.getHistory(24)
        ]);

        const configData = configResponse?.data || configResponse;
        setAutoMode(configData?.autoWaterEnabled || false);

        const readings = extractReadings(statsResponse);
        setStats({
          totalReadings: readings.length,
          todayReadings: readings.filter(r => {
            const readingDate = new Date(r.timestamp);
            const today = new Date();
            return readingDate.toDateString() === today.toDateString();
          }).length,
          lastUpdate: readings[0]?.timestamp || null,
        });
      } catch (error) {
        console.error('Failed to load initial config/stats:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleSaveAutoMode = async () => {
    setLoading(true);
    try {
      await configAPI.update('ESP32-SENSOR', {
        autoWaterEnabled: autoMode
      });
      onNotification?.(`Auto-watering ${autoMode ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      console.error('Failed to save config:', error);
      onNotification?.('Failed to update configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const clearOptions = `Select which history to clear:

  - Sensor Readings (older than 90 days)
  - Watering Logs (older than 365 days)
  - Disease Detections (older than 180 days)

Options:
1. Clear Sensor Readings
2. Clear Watering Logs
3. Clear Disease History
4. Clear ALL history
0. Cancel`;

    const choice = window.prompt(clearOptions, '');
    if (choice === null || choice === '0') return;

    setClearing(true);
    try {
      let result;
      const typeMap = {
        '1': { label: 'sensor readings', days: 90, fn: configAPI.clearSensorHistory },
        '2': { label: 'watering logs', days: 365, fn: configAPI.clearWateringHistory },
        '3': { label: 'disease detections', days: 180, fn: configAPI.clearDiseaseHistory },
      };

      if (choice === '4') {
        if (window.confirm('Clear ALL history? This cannot be undone!')) {
          result = await configAPI.clearAllHistory('ESP32-SENSOR');
          onNotification?.(`Cleared ${result.totalRecordsDeleted || 0} records`, 'success');
        }
      } else if (typeMap[choice]) {
        const { label, days, fn } = typeMap[choice];
        if (window.confirm(`Clear ${label} older than ${days} days?`)) {
          result = await fn('ESP32-SENSOR', days);
          onNotification?.(formatNextCleanupMessage(result, label), 'success');
        }
      } else {
        onNotification?.('Invalid option', 'error');
      }
    } catch (error) {
      onNotification?.('Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await sensorAPI.getHistory(168);
      const readings = extractReadings(result);
      if (!readings.length) return onNotification?.('No data to export', 'info');
      
      const csv = ['Timestamp,Soil Moisture,Temperature,Humidity,Light,pH',
        ...readings.map(r => `${r.timestamp},${r.soilMoisture},${r.temperature},${r.humidity},${r.light},${r.pH}`)
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sproutsense-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      onNotification?.(`Exported ${readings.length} readings`, 'success');
    } catch {
      onNotification?.('Export failed', 'error');
    }
  };

  const statusMap = {
    online: { label: 'Online', class: 'status-online', icon: 'check' },
    offline: { label: 'Offline', class: 'status-offline', icon: 'x' },
    checking: { label: 'Checking', class: 'status-checking', icon: 'refresh' }
  };

  const getStatus = (key) => statusMap[systemStatus?.[key]] || statusMap.offline;

  return (
    <div className="card config-card">
      <div className="config-card-header">
        <div className="config-header-icon"><GlassIcon name="config" /></div>
        <div>
          <h2 className="card-title">System Overview</h2>
          <p className="card-subtitle">Manage device connectivity and historical data</p>
        </div>
      </div>

      <div className="config-grid">
        {/* Connection Status */}
        <div className="config-section">
          <h3 className="config-section-title"><GlassIcon name="activity" /> Connectivity</h3>
          <div className="status-grid">
            {[
              { id: 'backend', label: 'API Server', icon: 'server' },
              { id: 'database', label: 'Primary Database', icon: 'database' },
              { id: 'esp32', label: 'Sensor Node', icon: 'wifi' },
              { id: 'esp32Cam', label: 'Camera Module', icon: 'image' }
            ].map(item => {
              const status = getStatus(item.id);
              return (
                <div key={item.id} className="status-item">
                  <div className="status-item-info">
                    <GlassIcon name={item.icon} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`status-badge ${status.class}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="config-section">
          <h3 className="config-section-title"><GlassIcon name="sprout" /> Analytics Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalReadings}</span>
              <span className="stat-label">Total (24h)</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.todayReadings}</span>
              <span className="stat-label">Today</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-sm">
                {stats.lastUpdate ? format(new Date(stats.lastUpdate), 'HH:mm') : 'N/A'}
              </span>
              <span className="stat-label">Last Sync</span>
            </div>
          </div>
          <div className="config-auto-header">
            <div className="config-auto-title">
              <GlassIcon name="activity" />
              <div>
                <h3>Auto-Watering</h3>
                <p>Threshold-based irrigation</p>
              </div>
            </div>
            <button 
              className={`toggle-switch ${autoMode ? 'on' : 'off'}`}
              onClick={() => setAutoMode(!autoMode)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div className="config-section">
        <h3 className="config-section-title"><GlassIcon name="controls" /> Data Management</h3>
        <div className="config-actions">
          <button className="config-btn config-btn-primary" onClick={handleSaveAutoMode} disabled={loading}>
            <GlassIcon name={loading ? 'refresh' : 'check'} animated={loading} />
            {loading ? 'Saving Settings...' : 'Apply Threshold'}
          </button>
          <button className="config-btn config-btn-secondary" onClick={handleExportData}>
            <GlassIcon name="download" /> Export (CSV)
          </button>
          <button className="config-btn config-btn-danger" onClick={handleClearHistory} disabled={clearing}>
            <GlassIcon name="trash" /> {clearing ? 'Clearing...' : 'Wipe History'}
          </button>
        </div>
        <p className="config-hint">Actions performed here directly affect the persistent historical database.</p>
      </div>
    </div>
  );
}

