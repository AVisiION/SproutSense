import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../utils/api';
import './PublicPages.css';

const CORE_CAPABILITIES = [
  {
    title: 'Smart Sensor Network',
    description: 'Six parameters monitored simultaneously: soil moisture, temperature, humidity, pH, NPK, and light intensity via a dual-ESP32 architecture.',
    icon: 'fa-solid fa-wave-square',
  },
  {
    title: 'Automated Irrigation',
    description: 'Precision pump control driven by moisture thresholds and scheduling windows to prevent both overwatering and underwatering.',
    icon: 'fa-solid fa-droplet',
  },
  {
    title: 'On-Device AI Diagnostics',
    description: 'ESP32-CAM and edge-model workflows support early disease awareness without cloud-only dependency for core detection cycles.',
    icon: 'fa-solid fa-camera',
  },
  {
    title: 'Live Analytics Dashboard',
    description: 'WebSocket-powered visibility across trend analysis, history, and operational insights from any connected device.',
    icon: 'fa-solid fa-chart-line',
  },
];

const ABOUT_STORY = [
  {
    title: 'The Problem',
    description: 'Inconsistent watering, delayed disease detection, and low sensor visibility cause avoidable plant loss in small and medium setups.',
    icon: 'fa-solid fa-bullseye',
  },
  {
    title: 'Our Approach',
    description: 'SproutSense combines sensor telemetry, an AI-capable camera node, and a web dashboard with role-safe workflows.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'What You Get',
    description: 'Practical irrigation guidance, transparent monitoring, and safer operations through clear role-based boundaries.',
    icon: 'fa-solid fa-layer-group',
  },
];

const ARCHITECTURE_LAYERS = [
  {
    title: 'ESP32-SENSOR',
    description: 'Reads moisture, temperature, humidity, pH, and related telemetry while driving relay-based irrigation control.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'ESP32-CAM',
    description: 'Captures plant imagery and posts disease-related inference outputs for monitoring and review.',
    icon: 'fa-solid fa-camera',
  },
  {
    title: 'Node.js Backend',
    description: 'Express API and WebSocket bridge persist readings, watering logs, and AI events to MongoDB Atlas.',
    icon: 'fa-solid fa-server',
  },
  {
    title: 'React Dashboard',
    description: 'Public and authenticated interfaces deliver real-time data, trends, and control experiences by role.',
    icon: 'fa-solid fa-desktop',
  },
];

const TECHNOLOGY_STACK = [
  {
    title: 'Hardware Layer',
    description: 'ESP32-WROOM, ESP32-CAM, DHT22, capacitive moisture, pH, and NPK sensors.',
    icon: 'fa-solid fa-microchip',
  },
  {
    title: 'Backend Layer',
    description: 'Node.js, Express, WebSocket streaming, MongoDB Atlas, and Render deployment.',
    icon: 'fa-solid fa-server',
  },
  {
    title: 'Frontend Layer',
    description: 'React 18, Vite, React Router, charting workflows, and Netlify hosting.',
    icon: 'fa-solid fa-window-maximize',
  },
  {
    title: 'AI and Insights',
    description: 'Edge Impulse/TFLite pathways plus advisory AI integrations for richer diagnosis context.',
    icon: 'fa-solid fa-brain',
  },
];

function Hero({ kicker, title, description, actions = null }) {
  return (
    <section className="pp-hero pp-glass">
      <div className="pp-hero-blob pp-hero-blob-1" aria-hidden="true" />
      <div className="pp-hero-blob pp-hero-blob-2" aria-hidden="true" />
      <div className="pp-hero-content">
        {kicker && <span className="pp-kicker">{kicker}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
        {actions && <div className="pp-actions">{actions}</div>}
      </div>
    </section>
  );
}

export function PublicHomePage() {
  return (
    <div className="pp-page">
      <Hero
        kicker="IoT Plant Monitoring Platform"
        title="SproutSense keeps plant care measurable, reliable, and easy to trust."
        description="Built on a dual-ESP32 architecture with a modern MERN dashboard, SproutSense helps teams monitor plant health, understand trends, and make better watering decisions with confidence."
        actions={
          <>
            <Link className="pp-btn pp-btn-primary" to="/demo"><i className="fa-solid fa-play" /> Explore Demo</Link>
            <Link className="pp-btn pp-btn-ghost" to="/features"><i className="fa-solid fa-seedling" /> View Features</Link>
          </>
        }
      />

      <section className="pp-grid pp-grid-2">
        <article className="pp-card pp-glass">
          <h3><i className="fa-solid fa-circle-info" /> Product Overview</h3>
          <p>SproutSense combines sensor telemetry, disease-awareness intelligence, and a role-aware web application for clean visibility from public discovery to authenticated operations.</p>
        </article>
        <article className="pp-card pp-glass">
          <h3><i className="fa-solid fa-shield-halved" /> Public Access Scope</h3>
          <p>Public pages focus on discovery, education, and transparent preview data. Real control actions, account workflows, and role permissions are available after login.</p>
        </article>
      </section>

      <section className="pp-grid">
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-wave-square" /> Live Sensor Visibility</h3><p>Track moisture, temperature, humidity, pH, and water-flow indicators in a clear dashboard workflow.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-brain" /> AI-Guided Insights</h3><p>Surface actionable recommendations and disease-related context from captured plant signals.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-user-lock" /> Role-Safe Operations</h3><p>Public, Viewer, User, and Admin experiences stay separated so access is intuitive and secure.</p></article>
      </section>
    </div>
  );
}

export function PublicAboutPage() {
  return (
    <div className="pp-page">
      <Hero
        title="About SproutSense"
        description="SproutSense is an end-to-end IoT + AI platform focused on reliable plant monitoring, practical automation, and transparent decision support."
      />

      <section className="pp-grid">
        {ABOUT_STORY.map((item) => (
          <article key={item.title} className="pp-card pp-glass">
            <h3><i className={item.icon} /> {item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="pp-grid">
        {ARCHITECTURE_LAYERS.map((item) => (
          <article key={item.title} className="pp-card pp-glass">
            <h3><i className={item.icon} /> {item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function PublicFeaturesPage() {
  return (
    <div className="pp-page">
      <Hero
        title="Product Features"
        description="SproutSense combines monitoring, automation, AI diagnostics, and role-aware operations in one integrated workflow."
      />

      <section className="pp-grid">
        {CORE_CAPABILITIES.map((item) => (
          <article key={item.title} className="pp-card pp-glass">
            <h3><i className={item.icon} /> {item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="pp-grid">
        {TECHNOLOGY_STACK.map((item) => (
          <article key={item.title} className="pp-card pp-glass">
            <h3><i className={item.icon} /> {item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function PublicContactPage() {
  return (
    <div className="pp-page">
      <Hero
        title="Contact"
        description="For partnerships, deployments, and support requests, reach our project team."
      />

      <section className="pp-grid">
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-envelope" /> Email</h3><p>support@sproutsense.local</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-diagram-project" /> Project</h3><p>Final-year IoT + AI smart plant monitoring platform.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-clock" /> Availability</h3><p>Mon-Sat, 10:00 to 18:00 IST.</p></article>
      </section>
    </div>
  );
}

export function PublicPlantLibraryPage() {
  return (
    <div className="pp-page">
      <Hero
        title="Plant Insights Library"
        description="Educational guidance for soil, humidity, light, and disease-awareness basics."
      />

      <section className="pp-grid">
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-seedling" /> Tomato</h3><p>Best pH: 6.0-6.8, moderate moisture, avoid overwatering during fruiting stage.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-pepper-hot" /> Chili</h3><p>Prefers warm temperatures, quick drainage, and stable humidity around 55-70%.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-leaf" /> Leaf Disease Basics</h3><p>Watch for spots, mold, yellowing, and progressive leaf damage before treatment.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-sun-plant-wilt" /> Light Guidance</h3><p>Most edible plants need consistent light windows and gradual adaptation to stronger sun.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-water" /> Moisture Guidance</h3><p>Use moisture trends, not single readings, to avoid both drought stress and root oversaturation.</p></article>
        <article className="pp-card pp-glass"><h3><i className="fa-solid fa-notes-medical" /> Care Notes</h3><p>Pair visual plant checks with sensor data to build consistent, low-risk care routines.</p></article>
      </section>
    </div>
  );
}

export function PublicDemoPage() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reportRows, setReportRows] = useState([]);

  useEffect(() => {
    publicAPI.getOverview().then((res) => setOverview(res?.data || null)).catch(() => setOverview(null));
    publicAPI.getAnalyticsPreview(24).then((res) => setAnalytics(res?.data?.summary || null)).catch(() => setAnalytics(null));
    publicAPI.getReportsPreview().then((res) => setReportRows(res?.data?.weeklyWatering || [])).catch(() => setReportRows([]));
  }, []);

  const previewRows = useMemo(() => reportRows.slice(-5), [reportRows]);

  return (
    <div className="pp-page">
      <Hero
        title="Interactive Product Demo"
        description="This demo combines monitoring, analytics, and reports in one safe read-only experience."
      />

      <section className="pp-grid">
        <article className="pp-card pp-glass pp-metric"><span>Soil Moisture</span><strong>{overview?.latest?.soilMoisture ?? '--'}%</strong></article>
        <article className="pp-card pp-glass pp-metric"><span>Temperature</span><strong>{overview?.latest?.temperature ?? '--'} C</strong></article>
        <article className="pp-card pp-glass pp-metric"><span>Humidity</span><strong>{overview?.latest?.humidity ?? '--'}%</strong></article>
      </section>

      <section className="pp-grid">
        <article className="pp-card pp-glass pp-metric"><span>Avg Soil Moisture</span><strong>{analytics?.avgSoilMoisture ?? '--'}%</strong></article>
        <article className="pp-card pp-glass pp-metric"><span>Avg Temperature</span><strong>{analytics?.avgTemperature ?? '--'} C</strong></article>
        <article className="pp-card pp-glass pp-metric"><span>Avg Humidity</span><strong>{analytics?.avgHumidity ?? '--'}%</strong></article>
      </section>

      <section className="pp-card pp-glass">
        <h3><i className="fa-solid fa-table" /> Weekly Watering Snapshot</h3>
        <table className="pp-table">
          <thead><tr><th>Day</th><th>Watering Cycles</th><th>Volume (mL)</th></tr></thead>
          <tbody>
            {previewRows.length === 0 ? (
              <tr><td colSpan={3}>No preview data available</td></tr>
            ) : previewRows.map((row) => (
              <tr key={row.day}><td>{row.day}</td><td>{row.cycles}</td><td>{row.volumeML}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
