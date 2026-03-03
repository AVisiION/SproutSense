import React, { useState, useEffect } from 'react';
import { configAPI } from '../utils/api';
import { GlassIcon } from './GlassIcon';

export function ConfigCard({ onNotification }) {
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial config
    const fetchConfig = async () => {
      try {
        const response = await configAPI.get();
        const config = response.data || response;
        setAutoMode(config.autoWaterEnabled || false);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await configAPI.update('esp32-001', {
        autoWaterEnabled: autoMode
      });
      onNotification?.('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save config:', error);
      onNotification?.('Failed to save configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <GlassIcon name="config" className="card-title-icon" />
        Configuration
      </h2>
      <div className="config-form">
        <label>
          <span className="config-label-row">
            <GlassIcon name="controls" className="metric-icon" />
            Auto Mode:
          </span>
          <input 
            type="checkbox" 
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
          />
        </label>
        <button 
          className="btn btn-success" 
          onClick={handleSave}
          disabled={loading}
        >
          <GlassIcon name="guide" className="btn-icon" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
