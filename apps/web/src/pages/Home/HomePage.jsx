// apps/web/src/pages/Home/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassIcon } from '../../components/bits/GlassIcon';
import './HomePage.css';

const HomePage = ({ theme, sensors, isConnected }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const techRef = useRef(null);
  const [techVisible, setTechVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  useEffect(() => {
    const el = techRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTechVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const soilMoisture = sensors?.soilMoisture ?? 0;
  const temperature  = sensors?.temperature  ?? 0;
  const humidity     = sensors?.humidity     ?? 0;

  const quickStats = [
    {
      label: 'Soil Moisture',
      value: `${soilMoisture}%`,
      icon: 'watering',
      status: soilMoisture < 30 ? 'warning' : soilMoisture < 50 ? 'info' : 'success',
      hint: soilMoisture < 30 ? 'Needs watering' : soilMoisture < 50 ? 'Acceptable' : 'Optimal',
    },
    {
      label: 'Temperature',
      value: `${temperature}°C`,
      icon: 'temperature',
      status: temperature > 35 ? 'warning' : 'success',
      hint: temperature > 35 ? 'Heat stress risk' : 'Normal range',
    },
    {
      label: 'Humidity',
      value: `${humidity}%`,
      icon: 'humidity',
      status: humidity < 30 ? 'info' : 'success',
      hint: humidity < 30 ? 'Low humidity' : 'Good level',
    },
  ];

  const features = [
    {
      title: 'Smart Sensor Network',
      description: 'Six parameters monitored simultaneously — soil moisture, temperature, humidity, pH, NPK levels, and light intensity — via a dual ESP32 architecture with sub-second latency.',
      icon: 'monitoring',
      path: '/sensors',
      tag: 'Real-time',
    },
    {
      title: 'Automated Irrigation',
      description: 'Precision pump control driven by moisture thresholds and daily scheduling windows. Prevents both overwatering and underwatering with configurable safety cutoffs.',
      icon: 'watering',
      path: '/controls',
      tag: 'Automated',
    },
    {
      title: 'On-Device AI Diagnostics',
      description: 'Edge Impulse TFLite model running directly on ESP32-CAM detects 9 plant disease classes — no cloud round-trip, no latency, no data privacy concerns.',
      icon: 'disease',
      path: '/insights',
      tag: 'Edge AI',
    },
    {
      title: 'Live Analytics Dashboard',
      description: 'WebSocket data streams power interactive charts, trend analysis, historical logs, and instant threshold alerts — all accessible from any device.',
      icon: 'bell',
      path: '/analytics',
      tag: 'WebSocket',
    },
  ];

  const techStack = [
    {
      category: 'Hardware',
      color: 'green',
      items: [
        { name: 'ESP32-WROOM', note: 'Sensor controller' },
        { name: 'ESP32-CAM',   note: 'Vision & AI node'  },
        { name: 'DHT22',       note: 'Temp & humidity'   },
        { name: 'Capacitive',  note: 'Soil moisture'     },
        { name: 'pH Probe',    note: 'Soil acidity'      },
        { name: 'NPK Sensor',  note: 'Nutrient levels'   },
      ],
    },
    {
      category: 'Backend',
      color: 'blue',
      items: [
        { name: 'Node.js',      note: 'Runtime'           },
        { name: 'Express',      note: 'REST API'          },
        { name: 'WebSocket',    note: 'Live data stream'  },
        { name: 'MongoDB Atlas',note: 'Cloud database'    },
        { name: 'Render',       note: 'Hosting'           },
        { name: 'REST API',     note: 'Device bridge'     },
      ],
    },
    {
      category: 'Frontend',
      color: 'teal',
      items: [
        { name: 'React 18',     note: 'UI framework'      },
        { name: 'Vite',         note: 'Build tool'        },
        { name: 'Recharts',     note: 'Data charts'       },
        { name: 'React Router', note: 'Navigation'        },
        { name: 'Framer Motion',note: 'Animations'        },
        { name: 'Netlify',      note: 'CDN deploy'        },
      ],
    },
    {
      category: 'AI / ML',
      color: 'orchid',
      items: [
        { name: 'Edge Impulse',    note: 'Model training'     },
        { name: 'TFLite Micro',    note: 'On-device runtime'  },
        { name: 'Image Classify',  note: '9 disease classes'  },
        { name: 'ESP32-CAM',       note: 'Inference host'     },
        { name: 'Gemini API',      note: 'AI diagnosis text'  },
        { name: 'OpenAI API',      note: 'Advisory analysis'  },
      ],
    },
  ];

  const archNodes = [
    {
      icon: 'sensors',
      title: 'ESP32-SENSOR',
      desc: 'Reads soil moisture, temperature, humidity, pH and NPK via ADC1. Controls the relay-driven irrigation pump.',
      accent: 'green',
    },
    {
      icon: 'disease',
      title: 'ESP32-CAM',
      desc: 'Captures leaf images every cycle, runs TFLite disease classification on-device, and posts results to the backend.',
      accent: 'teal',
    },
    {
      icon: 'monitoring',
      title: 'Node.js Backend',
      desc: 'Express REST + WebSocket server hosted on Render. Persists all readings, watering events, and AI detections to MongoDB Atlas.',
      accent: 'blue',
    },
    {
      icon: 'records',
      title: 'React Dashboard',
      desc: 'Vite SPA on Netlify. Real-time sensor charts, alert history, AI insight viewer, and full system control panel.',
      accent: 'orchid',
    },
  ];

  const systemStatus = [
    { label: 'Backend API (Render)' },
    { label: 'MongoDB Atlas'        },
    { label: 'ESP32 Devices'        },
    { label: 'WebSocket Stream'     },
  ];

  return (
    <div className={`hp ${isVisible ? 'hp--visible' : ''}`} data-theme={theme}>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hp-hero__blob hp-hero__blob--1" aria-hidden="true" />
        <div className="hp-hero__blob hp-hero__blob--2" aria-hidden="true" />
        <div className="hp-hero__blob hp-hero__blob--3" aria-hidden="true" />

        <div className="hp-hero__inner">
          <div className="hp-hero__badge">
            <GlassIcon name="sprout" />
            <span>IoT + Edge AI · Plant Care System</span>
          </div>

          <h1 className="hp-hero__title">
            SproutSense
            <span className="hp-hero__title-sub">
              Precision Plant Care — Powered by Sensors &amp; AI
            </span>
          </h1>

          <p className="hp-hero__desc">
            A full-stack IoT system built on dual ESP32 microcontrollers with six-parameter
            soil monitoring, on-device machine learning for plant disease detection, and
            automated irrigation — all managed from a live cloud dashboard.
          </p>

          <div className="hp-hero__actions">
            <button className="hp-btn hp-btn--primary" onClick={() => navigate('/controls')}>
              <GlassIcon name="controls" />
              <span>Open Controls</span>
            </button>
            <button className="hp-btn hp-btn--ghost" onClick={() => navigate('/sensors')}>
              <GlassIcon name="sensors" />
              <span>Live Sensors</span>
            </button>
          </div>

          <div className={`hp-hero__status ${isConnected ? 'hp-hero__status--on' : 'hp-hero__status--off'}`}>
            <span className="hp-hero__status-dot" />
            {isConnected
              ? 'All systems online · WebSocket active'
              : 'Attempting to connect to ESP32 network…'}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LIVE SENSOR METRICS
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-stats">
        <div className="hp-section__head">
          <h2>Live Sensor Readings</h2>
          <p>Streamed directly from ESP32 over WebSocket in real time</p>
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
                <span className="hp-stat-card__hint">{s.hint}</span>
              </div>
              <div className={`hp-stat-card__pulse hp-stat-card__pulse--${s.status}`} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          QUICK ACTIONS — Device & Settings
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-actions">
        <div className="hp-section__head">
          <h2>Device Management</h2>
          <p>Connect and configure your IoT devices</p>
        </div>
        <div className="hp-actions__grid">
          <div
            className="hp-action-card hp-action-card--device"
            onClick={() => navigate('/esp32')}
            role="button"
            tabIndex={0}
          >
            <div className="hp-action-card__icon">
              <GlassIcon name="esp32" />
            </div>
            <h3>Device Connected</h3>
            <p>View and monitor ESP32 sensor board and camera status</p>
            <div className="hp-action-card__arrow">
              <GlassIcon name="arrow-right" />
            </div>
          </div>
          <div
            className="hp-action-card hp-action-card--settings"
            onClick={() => navigate('/settings')}
            role="button"
            tabIndex={0}
          >
            <div className="hp-action-card__icon">
              <GlassIcon name="settings" />
            </div>
            <h3>Device Pairing</h3>
            <p>Pair new devices, manage authentication, and configure alerts</p>
            <div className="hp-action-card__arrow">
              <GlassIcon name="arrow-right" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CORE FEATURES — animation preserved
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-features">
        <div className="hp-section__head">
          <h2>Core Capabilities</h2>
          <p>Four integrated systems that work together to keep your plants healthy 24 / 7</p>
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

      {/* ═══════════════════════════════════════
          ABOUT — 3 glass panels
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-about">
        <div className="hp-section__head">
          <h2>About SproutSense</h2>
          <p>An end-to-end open-source IoT + AI solution designed for precision horticulture</p>
        </div>
        <div className="hp-about__grid">
          <div className="hp-glass-card">
            <GlassIcon name="leaf" className="hp-glass-card__icon hp-glass-card__icon--amber" />
            <h3>The Problem</h3>
            <p>
              Inconsistent watering, undetected soil imbalances, and late-stage disease
              identification account for the majority of avoidable plant losses — both
              in home gardens and small-scale commercial setups.
            </p>
          </div>
          <div className="hp-glass-card">
            <GlassIcon name="sprout" className="hp-glass-card__icon hp-glass-card__icon--green" />
            <h3>Our Approach</h3>
            <p>
              SproutSense combines a six-sensor ESP32 node, an on-device AI camera, and
              a smart irrigation relay — all tied together through a real-time WebSocket
              dashboard backed by MongoDB Atlas.
            </p>
          </div>
          <div className="hp-glass-card">
            <GlassIcon name="check" className="hp-glass-card__icon hp-glass-card__icon--teal" />
            <h3>What You Get</h3>
            <ul className="hp-check-list">
              <li>Precision irrigation with configurable thresholds</li>
              <li>Early disease alerts without cloud dependency</li>
              <li>Historical trends and actionable soil analytics</li>
              <li>Full control from any browser, anywhere</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SYSTEM ARCHITECTURE
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-arch">
        <div className="hp-section__head">
          <h2>System Architecture</h2>
          <p>Four tightly coupled layers from physical sensor edge to browser interface</p>
        </div>
        <div className="hp-arch__grid">
          {archNodes.map((n, i) => (
            <div
              key={n.title}
              className={`hp-arch-card hp-arch-card--${n.accent}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="hp-arch-card__num">{String(i + 1).padStart(2, '0')}</div>
              <div className="hp-arch-card__icon"><GlassIcon name={n.icon} /></div>
              <h3>{n.title}</h3>
              <p>{n.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TECHNOLOGY STACK — animated badge grid
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-tech" ref={techRef}>
        <div className="hp-section__head">
          <h2>Technology Stack</h2>
          <p>Open-source tools across hardware, cloud infrastructure, and AI layers</p>
        </div>
        <div className="hp-tech__grid">
          {techStack.map((layer, li) => (
            <div
              key={layer.category}
              className={`hp-tech-card hp-tech-card--${layer.color} ${techVisible ? 'hp-tech-card--visible' : ''}`}
              style={{ transitionDelay: `${li * 80}ms` }}
            >
              <div className="hp-tech-card__head">
                <span className={`hp-tech-card__dot hp-tech-card__dot--${layer.color}`} />
                <h3>{layer.category}</h3>
              </div>
              <div className="hp-tech-card__badges">
                {layer.items.map((item, ii) => (
                  <div
                    key={item.name}
                    className="hp-tech-badge"
                    style={{ transitionDelay: techVisible ? `${li * 80 + ii * 45}ms` : '0ms' }}
                  >
                    <span className="hp-tech-badge__name">{item.name}</span>
                    <span className="hp-tech-badge__note">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          QUICK ACTIONS
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-actions">
        <div className="hp-glass-card hp-actions__card">
          <div className="hp-section__head hp-section__head--left">
            <h2>Quick Actions</h2>
            <p>Jump directly to any part of your SproutSense system</p>
          </div>
          <div className="hp-actions__grid">
            {[
              { icon: 'watering', label: 'Water Now',   path: '/controls'  },
              { icon: 'sensors',  label: 'Sensors',     path: '/sensors'   },
              { icon: 'records',  label: 'Analytics',   path: '/analytics' },
              { icon: 'disease',  label: 'AI Insights', path: '/insights'  },
              { icon: 'settings', label: 'Settings',    path: '/settings'  },
            ].map((a) => (
              <button key={a.label} className="hp-action-btn" onClick={() => navigate(a.path)}>
                <GlassIcon name={a.icon} className="hp-action-btn__icon" />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SYSTEM STATUS
      ═══════════════════════════════════════ */}
      <section className="hp-section hp-status">
        <div className="hp-glass-card hp-status__card">
          <h3>System Status</h3>
          <div className="hp-status__grid">
            {systemStatus.map((s) => (
              <div key={s.label} className="hp-status__item">
                <span className="hp-status__dot hp-status__dot--online" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="hp-status__footer">
            All systems operational · Last checked: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
