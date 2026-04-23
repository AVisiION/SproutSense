import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import { GlassIcon } from '../../components/bits/GlassIcon';
import { useNavigate } from 'react-router-dom';
import './ESP32StatusPage.css';

/* ── helpers ── */
function getPing(ms) {
  if (ms === null) return { label: 'N/A', quality: 'unknown' };
  if (ms < 5000)  return { label: '< 50 ms',    quality: 'excellent' };
  if (ms < 15000) return { label: '~120 ms',    quality: 'good' };
  if (ms < 30000) return { label: '~300 ms',    quality: 'fair' };
  return              { label: 'High latency', quality: 'poor' };
}

function getSignalBars(quality) {
  const levels = { excellent: 4, good: 3, fair: 2, poor: 1, unknown: 0 };
  return levels[quality] ?? 0;
}

function DeviceTypeIcon({ deviceId }) {
  const isCam = deviceId?.toUpperCase().includes('CAM');
  return isCam
    ? <i className="fa-solid fa-camera" />
    : <i className="fa-solid fa-microchip" />;
}

function SignalStrength({ quality }) {
  const bars = getSignalBars(quality);
  return (
    <div className="dc-signal" title={`Signal: ${quality}`}>
      {[1, 2, 3, 4].map(b => (
        <span key={b} className={`dc-signal__bar ${b <= bars ? 'dc-signal__bar--lit' : ''}`} />
      ))}
    </div>
  );
}

function StatusRing({ online }) {
  return (
    <div className={`dc-ring ${online ? 'dc-ring--online' : 'dc-ring--offline'}`}>
      <span className="dc-ring__pulse" />
      <span className="dc-ring__dot" />
    </div>
  );
}

function MetricPill({ label, value, icon }) {
  return (
    <div className="dc-metric">
      <i className={`fa-solid ${icon} dc-metric__icon`} />
      <div className="dc-metric__body">
        <span className="dc-metric__label">{label}</span>
        <span className="dc-metric__value">{value || '—'}</span>
      </div>
    </div>
  );
}

/* ── device card ── */
function DeviceCard({ device }) {
  const isCam   = device.deviceId?.toUpperCase().includes('CAM');
  const online  = device.online;
  const msSince = device.lastSeenAt
    ? Date.now() - new Date(device.lastSeenAt).getTime()
    : null;
  const ping    = getPing(online ? msSince : null);

  return (
    <div className={`dc-card ${online ? 'dc-card--online' : 'dc-card--offline'}`}>
      {/* Glow orb */}
      <div className="dc-card__glow" aria-hidden="true" />

      {/* Header */}
      <div className="dc-card__head">
        <div className={`dc-card__avatar dc-card__avatar--${isCam ? 'cam' : 'sensor'}`}>
          <DeviceTypeIcon deviceId={device.deviceId} />
        </div>
        <div className="dc-card__identity">
          <h3 className="dc-card__name">{device.displayName || device.deviceId}</h3>
          <span className="dc-card__id">{device.deviceId}</span>
        </div>
        <StatusRing online={online} />
      </div>

      {/* Status badge row */}
      <div className="dc-card__status-row">
        <span className={`dc-badge dc-badge--${online ? 'online' : 'offline'}`}>
          <span className="dc-badge__dot" />
          {online ? 'Online' : 'Offline'}
        </span>
        <SignalStrength quality={ping.quality} />
        <span className="dc-badge dc-badge--type">
          {isCam ? 'ESP32-CAM' : 'ESP32 Sensor'}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="dc-metrics">
        <MetricPill
          label="Last Seen"
          value={
            device.lastSeenAt
              ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })
              : 'Never'
          }
          icon="fa-clock"
        />
        <MetricPill label="Response" value={ping.label} icon="fa-wifi" />
        <MetricPill label="Firmware" value={device.firmwareVersion || 'Unknown'} icon="fa-code-branch" />
        <MetricPill label="IP Address" value={device.lastSeenIp || 'Unknown'} icon="fa-network-wired" />
      </div>

      {/* Last seen full date */}
      {device.lastSeenAt && (
        <div className="dc-card__timestamp">
          <i className="fa-solid fa-calendar-clock" />
          {format(new Date(device.lastSeenAt), 'MMM d, yyyy · HH:mm:ss')}
        </div>
      )}
    </div>
  );
}

/* ── main ── */
export default function ESP32StatusPage({ isConnected }) {
  const navigate  = useNavigate();
  const [devices, setDevices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastPoll, setLastPoll] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await deviceAPI.listMine();
        const now = Date.now();
        const fixedDevices = (res?.devices || []).map(d => {
          const msSince = d.lastSeenAt ? now - new Date(d.lastSeenAt).getTime() : null;
          const isOnline = msSince !== null && msSince <= 5 * 60 * 1000;
          return { ...d, online: isOnline };
        });
        setDevices(fixedDevices);
        setLastPoll(new Date());
      } catch {
        /* silently keep stale data */
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
    const id = setInterval(fetchDevices, 15000);
    return () => clearInterval(id);
  }, []);

  const onlineCount  = devices.filter(d => d.online).length;
  const offlineCount = devices.length - onlineCount;

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="dc-root">
        <div className="dc-header">
          <div className="dc-header__left">
            <div className="dc-header__icon"><i className="fa-solid fa-tower-broadcast" /></div>
            <div>
              <h2 className="dc-header__title">Device Connected</h2>
              <p className="dc-header__sub">Loading your paired devices…</p>
            </div>
          </div>
        </div>
        <div className="dc-grid">
          {[0, 1].map(i => (
            <div key={i} className="dc-card dc-card--skeleton">
              <div className="dc-skeleton dc-skeleton--head" />
              <div className="dc-skeleton dc-skeleton--body" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── empty state ── */
  if (devices.length === 0) {
    return (
      <div className="dc-root">
        <div className="dc-empty">
          <div className="dc-empty__icon">
            <i className="fa-solid fa-tower-broadcast" />
          </div>
          <h3>No devices paired</h3>
          <p>Pair your ESP32 devices from Settings to start monitoring.</p>
          <button className="dc-empty__btn" onClick={() => navigate('/settings')}>
            <i className="fa-solid fa-plus" /> Pair a Device
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dc-root">
      {/* Page header */}
      <div className="dc-header">
        <div className="dc-header__left">
          <div className="dc-header__icon">
            <i className="fa-solid fa-tower-broadcast" />
          </div>
          <div>
            <h2 className="dc-header__title">Device Connected</h2>
            <p className="dc-header__sub">
              {devices.length} device{devices.length !== 1 ? 's' : ''} paired ·{' '}
              {lastPoll && `Polled ${formatDistanceToNow(lastPoll, { addSuffix: true })}`}
            </p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="dc-header__pills">
          {onlineCount > 0 && (
            <span className="dc-summary-pill dc-summary-pill--online">
              <span className="dc-summary-pill__dot" />
              {onlineCount} Online
            </span>
          )}
          {offlineCount > 0 && (
            <span className="dc-summary-pill dc-summary-pill--offline">
              <span className="dc-summary-pill__dot" />
              {offlineCount} Offline
            </span>
          )}
        </div>
      </div>

      {/* WebSocket status banner */}
      <div className={`dc-ws-banner ${isConnected ? 'dc-ws-banner--live' : 'dc-ws-banner--down'}`}>
        <i className={`fa-solid ${isConnected ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
        {isConnected
          ? 'WebSocket live — data is streaming in real time'
          : 'WebSocket disconnected — data may be stale'}
      </div>

      {/* Device cards */}
      <div className="dc-grid">
        {devices.map(device => (
          <DeviceCard key={device.deviceId} device={device} />
        ))}
      </div>
    </div>
  );
}
