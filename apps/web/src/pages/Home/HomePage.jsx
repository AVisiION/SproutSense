// apps/web/src/pages/Home/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassIcon } from '../../components/bits/GlassIcon';
import ScrollReveal from '../../components/bits/ScrollReveal';
import './HomePage.css';

const HomePage = ({ theme, sensors, isConnected }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const soilMoisture = sensors?.soilMoisture ?? 0;
  const temperature = sensors?.temperature ?? 0;
  const humidity = sensors?.humidity ?? 0;
  const light = sensors?.light ?? 0;
  const flowVolume = sensors?.flowVolume ?? 0;

  // Derived health score
  const healthScore = Math.min(100, Math.max(0,
    (soilMoisture > 30 && soilMoisture < 80 ? 40 : 10) +
    (temperature > 15 && temperature < 30 ? 30 : 10) +
    (humidity > 40 && humidity < 70 ? 30 : 10)
  ));

  const quickStats = [
    { label: 'Soil Moisture', value: `${soilMoisture}%`, icon: 'watering', status: soilMoisture < 30 ? 'warning' : 'success' },
    { label: 'Temperature', value: `${temperature}°C`, icon: 'temperature', status: temperature > 35 ? 'warning' : 'success' },
    { label: 'Humidity', value: `${humidity}%`, icon: 'humidity', status: humidity < 30 ? 'info' : 'success' },
    { label: 'Light Level', value: `${light}%`, icon: 'monitoring', status: 'success' },
  ];

  const activityLog = [
    { time: '10:24 AM', event: 'Pump activated via auto-schedule', type: 'info' },
    { time: '09:15 AM', event: 'High temperature alert: 36.2°C', type: 'warning' },
    { time: '08:00 AM', event: 'AI Health Scan: All parameters optimal', type: 'success' },
    { time: 'Yesterday', event: 'Firmware updated to v3.1.2', type: 'system' },
  ];

  const latestAI = {
    class: 'Healthy',
    confidence: 98.4,
    date: '2 hours ago',
    recommendation: 'Maintain current moisture levels. Next scan scheduled for 4:00 PM.'
  };

  return (
    <div className={`hp ${isVisible ? 'hp--visible' : ''}`} data-theme={theme}>

      {/* ═══════════════════════════════════════
          COMMAND HERO
      ═══════════════════════════════════════ */}
      <section className="hp-command-hero">
        <div className="hp-hero-visual">
          <img
            src="/assets/dashboard_hero.png"
            alt="System Visualization"
            className="hp-hero-img"
          />
          <div className="hp-hero-overlay" />
        </div>

        <div className="hp-hero-content">
          <div className="hp-hero-header">
            <div className="hp-system-status">
              <span className={`status-pill ${isConnected ? 'online' : 'offline'}`}>
                <span className="pulse-dot" />
                {isConnected ? 'System Live' : 'System Offline'}
              </span>
              <span className="health-badge">
                Health Score: {healthScore}%
              </span>
            </div>
            <h1 className="hp-title">SproutSense Command</h1>
          </div>

          <div className="hp-hero-stats">
            <div className="hp-main-stat">
              <span className="stat-label">Main Controller</span>
              <span className="stat-value">ESP32-v3.1</span>
            </div>
            <div className="hp-main-stat border-l">
              <span className="stat-label">Active Sensors</span>
              <span className="stat-value">6 Active</span>
            </div>
            <div className="hp-main-stat border-l">
              <span className="stat-label">Up Time</span>
              <span className="stat-value">12d 4h</span>
            </div>
          </div>

          <div className="hp-hero-actions">
            <button className="cmd-btn primary" onClick={() => navigate('/controls')}>
              <GlassIcon name="watering" /> Quick Water
            </button>
            <button className="cmd-btn secondary" onClick={() => navigate('/insights')}>
              <GlassIcon name="disease" /> AI Scan
            </button>
          </div>
        </div>

        <div className="hp-scroll-hint">
          <span>SCROLL TO DISCOVER</span>
          <i className="fa-solid fa-chevron-down" />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BENTO DASHBOARD
      ═══════════════════════════════════════ */}
      <div className="hp-bento-container">
        
        {/* Environment Strip (Full Width) */}
        <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={-2} scrollOffset={0.1}>
          <section className="hp-telemetry-strip hp-glass">
            <div className="hp-telemetry-item">
              <span className="hp-metric-label">Soil Moisture</span>
              <span className="hp-metric-val">{sensors?.soilMoisture ?? '--'}%</span>
              <div className="hp-metric-status hp-status-active">
                <i className="fa-solid fa-circle" /> Live
              </div>
            </div>
            <div className="hp-telemetry-item">
              <span className="hp-metric-label">Air Temp</span>
              <span className="hp-metric-val">{sensors?.temperature ?? '--'}°C</span>
            </div>
            <div className="hp-telemetry-item">
              <span className="hp-metric-label">Humidity</span>
              <span className="hp-metric-val">{sensors?.humidity ?? '--'}%</span>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={3} scrollOffset={0.2}>
          {/* Sensor Grid (Top Left) */}
          <section className="bento-item sensor-grid-area">
            <div className="bento-header">
              <h3>Environment Telemetry</h3>
              <button className="view-all-btn" onClick={() => navigate('/sensors')}>Real-time</button>
            </div>
            <div className="sensor-compact-grid">
              {quickStats.map((s) => (
                <div key={s.label} className={`sensor-pill ${s.status}`}>
                  <GlassIcon name={s.icon} />
                  <div className="sensor-pill-info">
                    <span className="label">{s.label}</span>
                    <span className="value">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={-3} scrollOffset={0.25}>
          {/* AI Insight (Top Right) */}
          <section className="bento-item ai-insight-area" onClick={() => navigate('/insights')}>
            <div className="bento-header">
              <h3>Latest AI Diagnosis</h3>
              <span className="ai-tag">Edge AI</span>
            </div>
            <div className="ai-insight-content">
              <div className="ai-result">
                <span className="ai-class">{latestAI.class}</span>
                <span className="ai-conf">{latestAI.confidence}% confidence</span>
              </div>
              <p className="ai-rec">{latestAI.recommendation}</p>
              <span className="ai-date">{latestAI.date}</span>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal baseOpacity={0} blurStrength={5} baseRotation={1} scrollOffset={0.3}>
          {/* Activity Feed (Bottom Left) */}
          <section className="bento-item activity-feed-area">
            <div className="bento-header">
              <h3>System Activity</h3>
              <GlassIcon name="history" className="header-icon" />
            </div>
            <div className="activity-list">
              {activityLog.map((log, i) => (
                <div key={i} className={`activity-row ${log.type}`}>
                  <span className="activity-time">{log.time}</span>
                  <span className="activity-event">{log.event}</span>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal baseOpacity={0} blurStrength={5} baseRotation={-1} scrollOffset={0.35}>
          {/* Device Management (Bottom Right) */}
          <section className="bento-item device-mgmt-area">
            <div className="bento-header">
              <h3>Device Hub</h3>
            </div>
            <div className="device-buttons">
              <button className="device-tile" onClick={() => navigate('/esp32')}>
                <GlassIcon name="esp32" />
                <span>Monitoring</span>
              </button>
              <button className="device-tile" onClick={() => navigate('/settings')}>
                <GlassIcon name="settings" />
                <span>Pairing</span>
              </button>
            </div>
          </section>
        </ScrollReveal>

      </div>

      {/* Philosophical Scroll Reveal */}
      <section className="hp-quote-section">
        <ScrollReveal
          baseOpacity={0.1}
          enableBlur
          baseRotation={0}
          blurStrength={10}
        >
          When does a man die? When he is hit by a bullet? No! When he suffers a disease?
          No! When he ate a soup made out of a poisonous mushroom?
          No! A man dies when he is forgotten!
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════
          TECHNICAL INFO (Collapsible)
      ═══════════════════════════════════════ */}
      <div className="hp-info-footer">
        <button
          className={`info-toggle ${isInfoExpanded ? 'expanded' : ''}`}
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
        >
          <div className="info-toggle-left">
            <div className="tech-pulse">
              <div className="tech-pulse-inner" />
            </div>
            <div className="info-labels">
              <span className="main-label">System Intelligence Core</span>
              <span className="sub-label">v4.0.2 · Edge Node Architecture · Neural Engine Active</span>
            </div>
          </div>
          <div className="info-toggle-right">
            <span className="expand-hint">{isInfoExpanded ? 'CONSOLIDATE' : 'DECRYPT SYSTEM DATA'}</span>
            <div className="toggle-chevron-wrap">
              <GlassIcon name="chevron-right" />
            </div>
          </div>
        </button>
        {isInfoExpanded && (
          <div className="expanded-info-grid">
            <div className="info-card">
              <h4>System Architecture</h4>
              <p>Dual ESP32 nodes (Sensor + CAM) connected via WebSocket bridge to a Node.js/MongoDB cloud cluster.</p>
            </div>
            <div className="info-card">
              <h4>Security & Data</h4>
              <p>Edge AI processing ensures image privacy, while encrypted device tokens secure telemetry streams.</p>
            </div>
            <div className="info-card">
              <h4>Stack Components</h4>
              <div className="stack-badges">
                <span>React 18</span><span>Node.js</span><span>TFLite</span><span>WebSocket</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          SYSTEM STATUS BAR
      ═══════════════════════════════════════ */}
      <footer className="hp-status-bar">
        <div className="status-group">
          <span className="dot online" /> <span>API: Online</span>
        </div>
        <div className="status-group">
          <span className="dot online" /> <span>DB: Connected</span>
        </div>
        <div className="status-group">
          <span className="dot online" /> <span>WebSocket: Live</span>
        </div>
        <div className="status-timestamp">
          Last Check: {new Date().toLocaleTimeString()}
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
