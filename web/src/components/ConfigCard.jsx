import React, { useState, useEffect } from 'react';
import { configAPI, sensorAPI } from '../utils/api';
import { GlassIcon } from './GlassIcon';

export function ConfigCard({ onNotification }) {
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    esp32: 'checking',
    uptime: 0,
  });
  const [stats, setStats] = useState({
    totalReadings: 0,
    todayReadings: 0,
    lastUpdate: null,
  });
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // Load initial config
    const fetchConfig = async () => {
      try {
        const config = await configAPI.get();
        setAutoMode(config?.autoWaterEnabled || false);
        
        // Backend is online if we got here
        setSystemStatus(prev => ({
          ...prev,
          backend: 'online',
          database: 'online',
        }));
      } catch (error) {
        console.error('Failed to load config:', error);
        setSystemStatus(prev => ({
          ...prev,
          backend: 'offline',
          database: 'offline',
        }));
      }
    };

    const fetchStats = async () => {
      try {
        const result = await sensorAPI.getHistory(24);
        const readings = Array.isArray(result) ? result : (result?.data || []);
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
        console.error('Failed to load stats:', error);
        setStats({
          totalReadings: 0,
          todayReadings: 0,
          lastUpdate: null,
        });
      }
    };

    fetchConfig();
    fetchStats();

    // Check ESP32 status periodically
    const checkESP32 = async () => {
      try {
        const result = await sensorAPI.getLatest();
        const data = result?.data || result;
        const timestamp = data?.timestamp;
        
        if (!timestamp) {
          setSystemStatus(prev => ({ ...prev, esp32: 'offline' }));
          return;
        }
        
        const lastReading = new Date(timestamp);
        const now = new Date();
        const diffMinutes = (now - lastReading) / 1000 / 60;
        
        setSystemStatus(prev => ({
          ...prev,
          esp32: diffMinutes < 2 ? 'online' : 'offline',
        }));
      } catch (error) {
        console.error('ESP32 status check failed:', error);
        setSystemStatus(prev => ({ ...prev, esp32: 'offline' }));
      }
    };

    checkESP32();
    const interval = setInterval(checkESP32, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveAutoMode = async () => {
    setLoading(true);
    try {
      await configAPI.update('ESP32-001', {
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
    if (!window.confirm('Are you sure you want to clear all sensor history? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    try {
      // TODO: Implement DELETE endpoint in backend
      // Example: await api.delete('/sensors/history')
      onNotification?.('History clearing feature coming soon', 'info');
    } catch (error) {
      console.error('Failed to clear history:', error);
      onNotification?.('Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await sensorAPI.getHistory(168); // 7 days
      const readings = Array.isArray(result) ? result : (result?.data || []);
      
      if (readings.length === 0) {
        onNotification?.('No data available to export', 'info');
        return;
      }
      
      const csv = [
        'Timestamp,Soil Moisture (%),Temperature (°C),Humidity (%),Light (lux),pH',
        ...readings.map(r => {
          const timestamp = r.timestamp || 'N/A';
          const moisture = r.soilMoisture || r.soil_moisture || 'N/A';
          const temp = r.temperature || 'N/A';
          const humidity = r.humidity || 'N/A';
          const light = r.light || 'N/A';
          const ph = r.pH || r.ph || 'N/A';
          return `${timestamp},${moisture},${temp},${humidity},${light},${ph}`;
        })
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const link_url = URL.createObjectURL(blob);
      link.setAttribute('href', link_url);
      link.setAttribute('download', `sproutsense-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onNotification?.(`Data exported successfully (${readings.length} records)`, 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      onNotification?.('Failed to export data', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline';
      case 'checking': return 'status-checking';
      default: return 'status-unknown';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="card config-card">
      <h2 className="card-title">
        <GlassIcon name="config" className="card-title-icon" />
        System Configuration
      </h2>

      {/* System Status */}
      <div className="config-section">
        <h3 className="config-section-title">
          <GlassIcon name="activity" /> System Status
        </h3>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-item-header">
              <GlassIcon name="server" />
              <span className="status-item-label">Backend Server</span>
            </div>
            <span className={`status-badge ${getStatusColor(systemStatus.backend)}`}>
              {getStatusLabel(systemStatus.backend)}
            </span>
          </div>
          
          <div className="status-item">
            <div className="status-item-header">
              <GlassIcon name="database" />
              <span className="status-item-label">Database</span>
            </div>
            <span className={`status-badge ${getStatusColor(systemStatus.database)}`}>
              {getStatusLabel(systemStatus.database)}
            </span>
          </div>
          
          <div className="status-item">
            <div className="status-item-header">
              <GlassIcon name="esp32" />
              <span className="status-item-label">ESP32 Device</span>
            </div>
            <span className={`status-badge ${getStatusColor(systemStatus.esp32)}`}>
              {getStatusLabel(systemStatus.esp32)}
            </span>
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="config-section">
        <h3 className="config-section-title">
          <GlassIcon name="chart" /> Data Statistics
        </h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.totalReadings}</div>
            <div className="stat-label">Total Readings (24h)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.todayReadings}</div>
            <div className="stat-label">Today's Readings</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {stats.lastUpdate 
                ? new Date(stats.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
            </div>
            <div className="stat-label">Last Update</div>
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="config-section">
        <h3 className="config-section-title">
          <GlassIcon name="controls" /> Quick Settings
        </h3>
        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-label">Auto-Watering Mode</span>
            <span className="config-hint">Automatically water when moisture drops below threshold</span>
          </div>
          <button
            className={`toggle-switch ${autoMode ? 'on' : 'off'}`}
            onClick={() => setAutoMode(!autoMode)}
            aria-label="Toggle auto-watering"
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <button 
          className="btn btn-success config-save-btn" 
          onClick={handleSaveAutoMode}
          disabled={loading}
        >
          <GlassIcon name={loading ? 'refresh' : 'check'} className="btn-icon" animated={loading} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Data Management */}
      <div className="config-section">
        <h3 className="config-section-title">
          <GlassIcon name="database" /> Data Management
        </h3>
        <div className="config-actions">
          <button 
            className="btn btn-primary config-action-btn" 
            onClick={handleExportData}
          >
            <GlassIcon name="download" className="btn-icon" />
            Export Data (CSV)
          </button>
          <button 
            className="btn btn-danger config-action-btn" 
            onClick={handleClearHistory}
            disabled={clearing}
          >
            <GlassIcon name="trash" className="btn-icon" />
            {clearing ? 'Clearing...' : 'Clear History'}
          </button>
        </div>
        <p className="config-note">
          Export your sensor data as CSV or clear all historical records. Export includes the last 7 days of readings.
        </p>
      </div>

      {/* System Info */}
      <div className="config-section config-info-section">
        <div className="config-info-grid">
          <div className="config-info-item">
            <GlassIcon name="info" />
            <div>
              <div className="config-info-label">Version</div>
              <div className="config-info-value">2.0.0 IoT</div>
            </div>
          </div>
          <div className="config-info-item">
            <GlassIcon name="wifi" />
            <div>
              <div className="config-info-label">WebSocket</div>
              <div className="config-info-value">{systemStatus.backend === 'online' ? 'Connected' : 'Disconnected'}</div>
            </div>
          </div>
          <div className="config-info-item">
            <GlassIcon name="clock" />
            <div>
              <div className="config-info-label">Refresh Rate</div>
              <div className="config-info-value">5s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
