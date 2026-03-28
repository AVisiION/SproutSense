// web/src/pages/Home/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassIcon } from '../../components/bits/GlassIcon';
import ScrollVelocity from '../../components/bits/ScrollVelocity';
import './HomePage.css';
import '../../components/bits/ScrollVelocity.css';

const HomePage = ({ theme, sensors, isConnected }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const soilMoisture = sensors?.soilMoisture ?? 0;
  const temperature  = sensors?.temperature  ?? 0;
  const humidity     = sensors?.humidity     ?? 0;
  const pH           = sensors?.pH           ?? 0;

  const quickStats = [
    {
      label: 'Soil Moisture',
      value: `${soilMoisture}%`,
      icon: 'watering',
      unit: '%',
      status: soilMoisture < 30 ? 'warning' : soilMoisture < 50 ? 'info' : 'success',
    },
    {
      label: 'Temperature',
      value: `${temperature}°C`,
      icon: 'temperature',
      unit: '°C',
      status: temperature > 35 ? 'warning' : 'success',
    },
    {
      label: 'Humidity',
      value: `${humidity}%`,
      icon: 'humidity',
      unit: '%',
      status: humidity < 30 ? 'info' : 'success',
    },
    {
      label: 'Soil pH',
      value: pH.toFixed(1),
      icon: 'ph',
      unit: 'pH',
      status: pH < 5.5 || pH > 7.5 ? 'warning' : 'success',
    },
  ];

  const features = [
    {
      title: 'Smart Monitoring',
      description: '6 sensors track soil moisture, temperature, humidity, pH, NPK, and light intensity in real-time via dual ESP32 architecture.',
      icon: 'monitoring',
      path: '/sensors',
      tag: 'Real-time',
    },
    {
      title: 'Auto Watering',
      description: 'Intelligent pump control with moisture thresholds, timed watering, and daily scheduling — no overwatering or underwatering.',
      icon: 'watering',
      path: '/controls',
      tag: 'Automated',
    },
    {
      title: 'AI Disease Detection',
      description: 'Edge Impulse ML model on ESP32-CAM identifies 9 plant diseases at the edge — no cloud round-trip required.',
      icon: 'disease',
      path: '/insights',
      tag: 'On-device AI',
    },
    {
      title: 'Analytics Dashboard',
      description: 'WebSocket live data streaming, interactive charts, historical logs, and instant alerts for critical plant conditions.',
      icon: 'bell',
      path: '/analytics',
      tag: 'Live data',
    },
  ];

  const techStack = [
    { category: 'Hardware',  items: ['ESP32-SENSOR', 'ESP32-CAM', 'Soil Moisture', 'DHT22', 'pH Sensor', 'NPK Sensor'] },
    { category: 'Backend',   items: ['Node.js', 'Express', 'MongoDB Atlas', 'WebSocket', 'REST API', 'Render'] },
    { category: 'Frontend',  items: ['React 18', 'Vite', 'Recharts', 'React Router', 'Netlify'] },
    { category: 'AI / ML',   items: ['Edge Impulse', 'TensorFlow Lite', 'On-device Inference', 'Image Classification'] },
  ];

  const archNodes = [
    {
      icon: 'sensors',
      title: 'ESP32-SENSOR',
      desc: 'ADC1 multi-sensor node. Reads soil moisture, DHT22, pH, NPK and drives the relay pump.',
      accent: 'green',
    },
    {
      icon: 'disease',
      title: 'ESP32-CAM',
      desc: 'Captures leaf images, runs Edge Impulse TFLite model on-device, sends disease events via REST.',
      accent: 'teal',
    },
    {
      icon: 'monitoring',
      title: 'Node.js Backend',
      desc: 'Express REST API + WebSocket server on Render. Persists all readings to MongoDB Atlas.',
      accent: 'blue',
    },
    {
      icon: 'records',
      title: 'React Dashboard',
      desc: 'Vite SPA on Netlify. Real-time charts, alerts, controls, and AI insight viewer.',
      accent: 'orchid',
    },
  ];

  const systemStatus = [
    { label: 'Backend API', key: 'api' },
    { label: 'MongoDB Atlas', key: 'db' },
    { label: 'ESP32 Devices', key: 'esp' },
    { label: 'WebSocket', key: 'ws' },
  ];

  return (
    <div className={`hp ${isVisible ? 'hp--visible' : ''}`} data-theme={theme}>

      {/* ═══════════════════════════════════
          HERO — pure glass, no image
      ═══════════════════════════════════ */}
      <section className="hp-hero">
        {/* ambient blobs */}
        <div className="hp-hero__blob hp-hero__blob--1" aria-hidden="true" />
        <div className="hp-hero__blob hp-hero__blob--2" aria-hidden="true" />
        <div className="hp-hero__blob hp-hero__blob--3" aria-hidden="true" />

        <div className="hp-hero__inner">
          <div className="hp-hero__badge">
            <GlassIcon name="sprout" />
            <span>IoT + AI Plant Care System</span>
          </div>

          <h1 className="hp-hero__title">
            SproutSense
            <span className="hp-hero__title-sub">Smart Plant Care Without the Guesswork</span>
          </h1>

          <p className="hp-hero__desc">
            Dual ESP32 microcontrollers, six-parameter soil monitoring, on-device AI disease
            detection, and automated irrigation — keeping your plants healthy 24 / 7.
          </p>

          <div className="hp-hero__actions">
            <button className="hp-btn hp-btn--primary" onClick={() => navigate('/controls')}>
              <GlassIcon name="controls" />
              <span>Control System</span>
            </button>
            <button className="hp-btn hp-btn--ghost" onClick={() => navigate('/sensors')}>
              <GlassIcon name="sensors" />
              <span>Live Dashboard</span>
            </button>
          </div>

          {/* connection pill */}
          <div className={`hp-hero__status ${isConnected ? 'hp-hero__status--on' : 'hp-hero__status--off'}`}>
            <span className="hp-hero__status-dot" />
            {isConnected ? 'System Online · WebSocket Live' : 'Connecting to ESP32 sensors…'}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          LIVE SENSOR METRICS
      ═══════════════════════════════════ */}
      <section className="hp-section hp-stats">
        <div className="hp-section__head">
          <h2>Live Sensor Readings</h2>
          <p>All values streamed directly from ESP32 over WebSocket</p>
        </div>
        <div className="hp-stats__grid">
          {quickStats.map((s, i) => (
            <div
              key={s.label}
              className={`hp-stat-card hp-stat-card--${s.status}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="hp-stat-card__icon">
                <GlassIcon name={s.icon} />
              </div>
              <div className="hp-stat-card__body">
                <span className="hp-stat-card__label">{s.label}</span>
                <span className="hp-stat-card__value">{s.value}</span>
              </div>
              <div className={`hp-stat-card__pulse hp-stat-card__pulse--${s.status}`} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          CORE FEATURES  ← animation kept
      ═══════════════════════════════════ */}
      <section className="hp-section hp-features">
        <div className="hp-section__head">
          <h2>Core Features</h2>
          <p>Everything you need for intelligent, automated plant care</p>
        </div>
        <div className="features-grid-new">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feature-card-new"
              style={{ animationDelay: `${i * 150}ms` }}
              onClick={() => navigate(f.path)}
            >
              <div className="feature-icon-bg">
                <GlassIcon name={f.icon} className="feature-icon-new" />
              </div>
              <span className="hp-feature-tag">{f.tag}</span>
              <h3 className="feature-title-new">{f.title}</h3>
              <p className="feature-desc-new">{f.description}</p>
              <div className="feature-arrow">
                <GlassIcon name="arrow-right" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          ABOUT — 3 glass panels
      ═══════════════════════════════════ */}
      <section className="hp-section hp-about">
        <div className="hp-section__head">
          <h2>About SproutSense</h2>
          <p>An end-to-end IoT + AI solution built for precision agriculture</p>
        </div>
        <div className="hp-about__grid">
          <div className="hp-glass-card">
            <GlassIcon name="leaf" className="hp-glass-card__icon hp-glass-card__icon--green" />
            <h3>The Problem</h3>
            <p>
              Overwatering, nutrient deficiencies, and undetected fungal diseases cause significant
              crop losses. Manual checks are slow, inconsistent, and miss early warning signs.
            </p>
          </div>
          <div className="hp-glass-card">
            <GlassIcon name="sprout" className="hp-glass-card__icon hp-glass-card__icon--teal" />
            <h3>Our Solution</h3>
            <p>
              SproutSense combines six soil and environment sensors, an on-device AI camera, and
              smart irrigation — all managed from a single real-time cloud dashboard.
            </p>
          </div>
          <div className="hp-glass-card">
            <GlassIcon name="check" className="hp-glass-card__icon hp-glass-card__icon--green" />
            <h3>Key Benefits</h3>
            <ul className="hp-check-list">
              <li>Precision irrigation, reduced water waste</li>
              <li>Early disease alerts from on-device AI</li>
              <li>Real-time monitoring via WebSocket</li>
              <li>Automated logs and analytics in MongoDB</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SYSTEM ARCHITECTURE
      ═══════════════════════════════════ */}
      <section className="hp-section hp-arch">
        <div className="hp-section__head">
          <h2>System Architecture</h2>
          <p>Four interconnected layers from sensor edge to user interface</p>
        </div>
        <div className="hp-arch__grid">
          {archNodes.map((n, i) => (
            <div key={n.title} className={`hp-arch-card hp-arch-card--${n.accent}`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="hp-arch-card__num">{String(i + 1).padStart(2, '0')}</div>
              <div className="hp-arch-card__icon">
                <GlassIcon name={n.icon} />
              </div>
              <h3>{n.title}</h3>
              <p>{n.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          TECH STACK — scroll velocity
      ═══════════════════════════════════ */}
      <section className="hp-section hp-tech">
        <div className="hp-section__head">
          <h2>Technology Stack</h2>
          <p>Built on proven open-source tools across hardware, cloud, and AI layers</p>
        </div>
        <div className="hp-tech__grid">
          {techStack.map((stack, i) => (
            <div key={stack.category} className="hp-glass-card hp-tech__card" style={{ animationDelay: `${i * 80}ms` }}>
              <h3 className="hp-tech__cat">{stack.category}</h3>
              <ScrollVelocity
                texts={[stack.items.join(' • ')]}
                className="tech-badge"
                parallaxClassName="tech-parallax"
                scrollerClassName="tech-scroller"
                velocity={i % 2 !== 0 ? -80 : 70}
                numCopies={2}
                velocityMapping={{ input: [0, 1000], output: [0, 5] }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          QUICK ACTIONS
      ═══════════════════════════════════ */}
      <section className="hp-section hp-actions">
        <div className="hp-glass-card hp-actions__card">
          <div className="hp-section__head hp-section__head--left">
            <h2>Quick Actions</h2>
            <p>Jump directly to any part of your SproutSense system</p>
          </div>
          <div className="hp-actions__grid">
            {[
              { icon: 'watering', label: 'Water Now',    path: '/controls'  },
              { icon: 'sensors',  label: 'Sensors',      path: '/sensors'   },
              { icon: 'records',  label: 'Analytics',    path: '/analytics' },
              { icon: 'disease',  label: 'AI Insights',  path: '/insights'  },
              { icon: 'settings', label: 'Settings',     path: '/settings'  },
            ].map((a) => (
              <button key={a.label} className="hp-action-btn" onClick={() => navigate(a.path)}>
                <GlassIcon name={a.icon} className="hp-action-btn__icon" />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SYSTEM STATUS
      ═══════════════════════════════════ */}
      <section className="hp-section hp-status">
        <div className="hp-glass-card hp-status__card">
          <h3>System Status</h3>
          <div className="hp-status__grid">
            {systemStatus.map((s) => (
              <div key={s.key} className="hp-status__item">
                <span className="hp-status__dot hp-status__dot--online" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="hp-status__footer">
            All systems operational · Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
