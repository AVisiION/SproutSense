import React, { useMemo } from 'react';
import '../SectionStyles.css';

function detectModel(deviceId = '') {
  const upper = String(deviceId).toUpperCase();
  return upper.includes('CAM') ? 'ESP32-CAM' : 'ESP32-SENSOR';
}

function statusTone(value) {
  const status = String(value || '').toLowerCase();
  if (status.includes('online') || status.includes('connected') || status.includes('healthy')) return '#4ade80';
  if (status.includes('degraded') || status.includes('warning')) return '#facc15';
  if (status.includes('offline') || status.includes('error') || status.includes('down')) return '#f87171';
  return '#94a3b8';
}

export default function ConnectionsSection({ deviceKeys = [], loadingDeviceKeys = false, systemInfo = {} }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const initial = {
      'ESP32-SENSOR': { registered: 0, online: 0 },
      'ESP32-CAM': { registered: 0, online: 0 },
    };

    return (Array.isArray(deviceKeys) ? deviceKeys : []).reduce((acc, key) => {
      const model = detectModel(key?.deviceId);
      acc[model].registered += 1;

      if (key?.lastSeenAt) {
        const seenAt = new Date(key.lastSeenAt).getTime();
        if (Number.isFinite(seenAt) && now - seenAt <= ONLINE_WINDOW_MS) {
          acc[model].online += 1;
        }
      }

      return acc;
    }, initial);
  }, [deviceKeys]);

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-plug-circle-check" /> Connections</h2>
      </div>

      {loadingDeviceKeys ? (
        <div className="adm-loading">
          <i className="fa-solid fa-spinner fa-spin" />
          <span>Loading connection summary...</span>
        </div>
      ) : (
        <div className="adm-device-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="adm-glass-box" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}><i className="fa-solid fa-microchip" /> ESP32-SENSOR</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span>Registered</span>
              <strong>{stats['ESP32-SENSOR'].registered}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Online</span>
              <strong>{stats['ESP32-SENSOR'].online}</strong>
            </div>
          </div>

          <div className="adm-glass-box" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}><i className="fa-solid fa-camera" /> ESP32-CAM</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span>Registered</span>
              <strong>{stats['ESP32-CAM'].registered}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Online</span>
              <strong>{stats['ESP32-CAM'].online}</strong>
            </div>
          </div>

          <div className="adm-glass-box" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}><i className="fa-solid fa-database" /> MongoDB</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status</span>
              <strong style={{ color: statusTone(systemInfo?.database) }}>{systemInfo?.database || 'Unknown'}</strong>
            </div>
          </div>

          <div className="adm-glass-box" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}><i className="fa-solid fa-bolt" /> WebSocket</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status</span>
              <strong style={{ color: statusTone(systemInfo?.websocket) }}>{systemInfo?.websocket || 'Unknown'}</strong>
            </div>
          </div>

          <div className="adm-glass-box" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0' }}><i className="fa-solid fa-server" /> Backend</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status</span>
              <strong style={{ color: statusTone(systemInfo?.backend) }}>{systemInfo?.backend || 'Unknown'}</strong>
            </div>
          </div>
        </div>
      )}

      <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
        Online count is based on device activity within the last 5 minutes.
      </p>
    </div>
  );
}
