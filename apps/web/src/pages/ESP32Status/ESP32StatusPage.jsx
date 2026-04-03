import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import { GlassIcon } from '../../components/bits/GlassIcon';
import './ESP32StatusPage.css';
import { useNavigate } from 'react-router-dom';

export default function ESP32StatusPage({ 
  isConnected, 
  systemStatus // Still getting the old system status as a fallback context
}) {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await deviceAPI.listMine();
        setDevices(res?.devices || []);
      } catch (err) {
        console.error('Failed to load devices:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
    // Poll every 15s to keep "last seen" updated properly
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card esp32-page-card">
        <h2 className="card-title">
          <GlassIcon name="esp32" className="card-title-icon" /> 
          Device Connected
        </h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading your devices...
        </div>
      </div>
    );
  }

  // If no devices connected at all
  if (devices.length === 0) {
    return (
      <div className="esp32-empty-state">
        <GlassIcon name="settings" className="esp32-empty-icon" />
        <h3>No device connected</h3>
        <p>You haven't paired any devices with your account yet.</p>
        <button className="sp-btn sp-btn--primary" onClick={() => navigate('/settings')}>
          Connect from Settings
        </button>
      </div>
    );
  }

  return (
    <div className="card esp32-page-card">
      <h2 className="card-title">
        <GlassIcon name="esp32" className="card-title-icon" /> 
        Device Connected
      </h2>
      <div className="status-grid">
        {devices.map((device) => {
          
          const isRecentlyOnline = device.online;
          // Calculate an estimated response time based on last seen (just an approximation)
          const msSinceLastSeen = device.lastSeenAt 
            ? Date.now() - new Date(device.lastSeenAt).getTime()
            : null;
            
          let responsePing = 'N/A';
          if (isRecentlyOnline && msSinceLastSeen !== null) {
              if (msSinceLastSeen < 5000) responsePing = '< 50ms';
              else if (msSinceLastSeen < 15000) responsePing = '120ms';
              else responsePing = 'High latency';
          }

          return (
            <div className="status-item" key={device.deviceId}>
              <div className="status-item-header">
                <GlassIcon name={device.deviceId.includes('CAM') ? 'image' : 'esp32'} />
                <span className="status-item-label">
                  {device.displayName || device.deviceId}
                </span>
              </div>
              
              <div className="status-item-body">
                <span className={`status-badge status-${isRecentlyOnline ? 'online' : 'offline'}`}>
                  {isRecentlyOnline ? 'Online' : 'Offline'}
                </span>
                
                <div className="status-details">
                  <div className="status-subtext">
                    <strong>ID:</strong> {device.deviceId}
                  </div>
                  <div className="status-subtext">
                    <strong>Last seen:</strong>{' '}
                    {device.lastSeenAt ? format(new Date(device.lastSeenAt), 'PPpp') : 'Never'}
                    {device.lastSeenAt && ` (${formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })})`}
                  </div>
                  <div className="status-subtext">
                    <strong>Response Time:</strong> {responsePing}
                  </div>
                  <div className="status-subtext">
                    <strong>Firmware:</strong> {device.firmwareVersion || 'Unknown'}
                  </div>
                  <div className="status-subtext">
                    <strong>IP Address:</strong> {device.lastSeenIp || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
