// apps/web/src/pages/Home/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { aiAPI, sensorAPI } from '../../utils/api';
import './HomePage.css';

gsap.registerPlugin(ScrollTrigger);

const HomePage = ({ sensors, isConnected }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [realLogs, setRealLogs] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ health: 'WAITING', updated: '...' });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hp-v9-title span', {
        y: 100, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out'
      });
    }, heroRef);

    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch Insights and History in parallel
        const [insRes, histRes] = await Promise.all([
          aiAPI.getInsights({ days: 1 }),
          sensorAPI.getHistory(24) // Last 24 hours
        ]);

        // Process Logs
        if (insRes.insights) {
          const logs = insRes.insights.slice(0, 5).map(ins => ({
            time: new Date(ins.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: ins.category.replace(/_/g, ' ').toUpperCase(),
            desc: ins.message,
            i: ins.category === 'soil_moisture' ? 'droplet' : 
               ins.category === 'temperature' ? 'temperature-high' : 
               ins.category === 'light' ? 'sun' : 'leaf',
            severity: ins.severity
          }));
          setRealLogs(logs);
        }

        // Process History for Chart
        if (histRes && Array.isArray(histRes)) {
          const formatted = histRes.map(p => ({
            time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit' }),
            moisture: p.soilMoisture,
            temp: p.temperature
          }));
          setHistoryData(formatted);

          // Calculate Health (Example: Average moisture in healthy range 40-70)
          const avgMoisture = histRes.reduce((acc, curr) => acc + curr.soilMoisture, 0) / histRes.length;
          const healthStatus = avgMoisture > 40 && avgMoisture < 80 ? 'EXCELLENT' : 'NEEDS_CARE';
          
          setStats({
            health: healthStatus,
            updated: new Date(histRes[histRes.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    return () => ctx.revert();
  }, []);

  const miniTrend = [
    { v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 15 }, { v: 20 }
  ];

  const automationProtocols = [
    { id: '01', t: 'Sunlight Monitor', d: 'Adjusts light for best growth.', i: 'sun' },
    { id: '02', t: 'Smart Watering', d: 'Watering when soil gets dry.', i: 'droplet' },
    { id: '03', t: 'Temp Control', d: 'Keeps plants cozy and safe.', i: 'shield' },
  ];

  const expertTips = [
    { t: 'Morning Care', d: 'Check soil early before sun gets too hot.', i: 'clock' },
    { t: 'Healthy Leaves', d: 'Stable humidity keeps leaves green and strong.', i: 'leaf' },
    { t: 'Soil Health', d: 'Adding nutrients every month helps big growth.', i: 'flask' },
  ];

  const getStatus = () => {
    const alerts = [];
    const moisture = sensors?.soilMoisture ?? 0;
    const temp = sensors?.temperature ?? 0;
    if (moisture < 35) alerts.push({ type: 'warning', txt: 'Soil is thirsty. Watering soon!' });
    else alerts.push({ type: 'success', txt: 'Soil moisture is just right.' });
    if (temp > 32) alerts.push({ type: 'danger', txt: 'It is a bit hot for the plants.' });
    else alerts.push({ type: 'info', txt: 'Temperature is nice and steady.' });
    return alerts;
  };

  const statusAlerts = getStatus();

  return (
    <div className="hp-v9" ref={heroRef}>
      
      <section className="hp-v9-hero">
        <div className="hp-v9-header-meta">
          <span>[ SPROUTSENSE_OS ]</span>
          <span>EST_LINK: {isConnected ? 'SECURE' : 'LOST'}</span>
        </div>

        <div className="hero-content-wrap">
          <div className="hero-text-side">
            <h1 className="hp-v9-title">
              <span className="sprout">Sprout</span>
              <span className="sense">Sense</span>
              <span className="accent">Intelligence</span>
            </h1>
            <p className="hp-v9-hero-abstract">
              The future of farming is here. <br />
              Connected plants. Smarter growth. Simple care.
            </p>
          </div>

          <div className="hero-action-side">
            <div className="hp-v9-hero-cta">
              <button className="hp-v9-btn-elite" onClick={() => navigate('/intelligence')}>
                START_MONITORING
              </button>
              <div className="hp-v9-sync-pill">
                <div className={`dot ${isConnected ? 'on' : 'off'}`} />
                <span>{isConnected ? 'NODE_ACTIVE' : 'OFFLINE_MODE'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hp-v9-scroll-hint">
          <div className="scroll-bar">
            <div className="scroll-dot" />
          </div>
          <span>SCROLL_TO_EXPAND_INTEL</span>
        </div>
      </section>

      <section className="hp-v9-bento">
        
        {/* GROWTH_GRAPH (REAL TELEMETRY) */}
        <div className="hp-v9-card AREA_CORE_TELEMETRY">
          <div className="card-head">
            <span className="card-label">MOISTURE_TELEMETRY</span>
            <div className="live-tag">{isConnected ? 'NODE_LIVE' : 'BUFFER_MODE'}</div>
          </div>
          <div className="v9-graph">
            {loading ? (
              <div className="graph-loader">SYNCING_CHANNELS...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--elite-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--elite-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ background: 'var(--glass-color)', border: 'var(--glass-border)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--elite-accent)' }}
                  />
                  <Area type="monotone" dataKey="moisture" stroke="var(--elite-accent)" fillOpacity={1} fill="url(#moistureGradient)" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="v9-graph-footer">
            <div className="g-item"><span>VITAL_HEALTH</span><strong>{stats.health}</strong></div>
            <div className="g-item"><span>LAST_SYNC</span><strong>{stats.updated}</strong></div>
          </div>
        </div>

        {/* AI_ASSISTANT */}
        <div className="hp-v9-card AREA_NEURAL_LINK">
          <div className="card-head"><span className="card-label">SMART_ALERTS</span></div>
          <div className="v9-analysis-list">
            {statusAlerts.map((alert, i) => (
              <div key={i} className={`analysis-item ${alert.type}`}>
                <div className="analysis-dot" />
                <p>{alert.txt}</p>
              </div>
            ))}
          </div>
          <div className="card-info">
             <strong>PLANT_HELPER</strong>
             <span>I am watching your plants!</span>
          </div>
        </div>

        {/* METRICS */}
        <div className="hp-v9-card AREA_REALTIME_METRICS">
          <div className="card-head">
            <span className="card-label">SENSORY_DATA</span>
            <div className="unit-label">SYSTEM_UNITS: SI</div>
          </div>
          <div className="v9-pro-metrics">
            {[
              { l: 'SOIL_MOISTURE', v: sensors?.soilMoisture ?? 0, u: '%', i: 'droplet' },
              { l: 'AMBIENT_TEMP', v: sensors?.temperature ?? 0, u: '°C', i: 'temperature-high' },
              { l: 'AIR_HUMIDITY', v: sensors?.humidity ?? 0, u: '%', i: 'wind' }
            ].map((m, idx) => (
              <div key={m.l} className="pro-m-row">
                <div className="m-meta">
                  <div className="m-icon"><i className={`fa-solid fa-${m.i}`} /></div>
                  <div className="m-info">
                    <span>{m.l}</span>
                    <strong>{m.v}{m.u}</strong>
                  </div>
                </div>
                <div className="m-spark">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miniTrend}>
                      <Line type="monotone" dataKey="v" stroke="var(--elite-accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="hp-v9-card AREA_SYSTEM_LOGS">
          <div className="card-head"><span className="card-label">SYSTEM_ACTIVITY</span></div>
          <div className="v9-log-list">
            {loading ? (
               <div className="loading-logs">Fetching secure logs...</div>
            ) : realLogs.length > 0 ? (
              realLogs.map((act, i) => (
                <div key={i} className={`log-entry ${act.severity}`}>
                  <div className="log-time">{act.time}</div>
                  <div className="log-icon"><i className={`fa-solid fa-${act.i}`} /></div>
                  <div className="log-txt">
                    <strong>{act.event}</strong>
                    <p>{act.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-logs">No activity detected.</div>
            )}
          </div>
        </div>

        {/* TIPS */}
        <div className="hp-v9-card AREA_BIOLOGICAL_TIPS">
          <div className="card-head"><span className="card-label">EXPERT_TIPS</span></div>
          <div className="v9-tips-list">
            {expertTips.map((tip, i) => (
              <div key={i} className="tip-item">
                <div className="tip-icon"><i className={`fa-solid fa-${tip.i}`} /></div>
                <div className="tip-txt">
                  <strong>{tip.t}</strong>
                  <p>{tip.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AUTOMATION */}
        <div className="hp-v9-card AREA_SYSTEM_PROTOCOLS">
          <div className="card-head"><span className="card-label">SMART_AUTOMATION</span></div>
          <div className="v9-protocols">
            {automationProtocols.map(p => (
              <div key={p.id} className="p-item">
                <div className="p-icon"><i className={`fa-solid fa-${p.i}`} /></div>
                <div className="p-txt">
                  <span className="p-id">#{p.id}</span>
                  <h4>{p.t}</h4>
                  <p>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      <footer className="hp-v9-footer">
        <div className="footer-brand">
          <div className="f-logo">SPROUT<span>SENSE</span></div>
          <p>Your Digital Garden Partner</p>
        </div>
        <div className="footer-meta">
          <div className="meta-box"><span>SECURITY</span><strong>ACTIVE</strong></div>
          <div className="meta-box"><span>STATUS</span><strong>ONLINE</strong></div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
