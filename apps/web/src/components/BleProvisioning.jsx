import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './BleProvisioning.css';

export default function BleProvisioning() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    // Optionally fetch current config to pre-fill SSID if needed
    const fetchConfig = async () => {
      try {
        const res = await api.get('/config');
        if (res.data?.config?.wifiConfiguration?.ssid) {
          setSsid(res.data.config.wifiConfiguration.ssid);
        }
      } catch (err) {
        console.error('Failed to load config', err);
      }
    };
    fetchConfig();
  }, []);

  const saveWifiConfig = async () => {
    if (!ssid || !password) {
      alert('Please enter both SSID and Password.');
      return;
    }

    setIsProvisioning(true);
    setStatus('Saving WiFi credentials to backend...');

    try {
      await api.patch('/config/ESP32-SENSOR', {
        wifiConfiguration: { ssid, password }
      });
      await api.patch('/config/ESP32-CAM', {
        wifiConfiguration: { ssid, password }
      });

      setStatus('Credentials saved successfully! Your devices will sync them shortly.');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="ble-provisioning-container">
      <h3>Device WiFi Settings</h3>
      <p className="help-text">
        Set the target WiFi network for your devices. The devices must first connect via the default "SproutSense_Default" network before they can download these settings.
      </p>

      <div className="form-group">
        <label>WiFi SSID</label>
        <input 
          type="text" 
          value={ssid} 
          onChange={(e) => setSsid(e.target.value)} 
          placeholder="Network Name"
          disabled={isProvisioning} 
        />
      </div>

      <div className="form-group">
        <label>WiFi Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Network Password"
          disabled={isProvisioning} 
        />
      </div>

      <button 
        className="btn-primary btn-provision" 
        onClick={saveWifiConfig} 
        disabled={isProvisioning}
      >
        {isProvisioning ? 'Saving...' : 'Save WiFi Credentials'}
      </button>

      {status && (
        <div className="status-message active">
          {status}
        </div>
      )}
    </div>
  );
}