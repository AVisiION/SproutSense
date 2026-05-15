/**
 * AIRecommendation.jsx — Redesigned AI Assistant
 *
 * Features (all free, no extra APIs):
 *  • Chat-style message feed with typing indicator
 *  • Confidence radial ring (SVG)
 *  • Live sensor context pills (from props)
 *  • Priority badge (critical / warning / info)
 *  • Quick-action chips for common queries
 *  • Scan animation overlay on the camera feed placeholder
 *  • Collapsible history log (last 10 analyses)
 *  • Auto-refresh every 5 min with countdown strip
 *  • Copy-to-clipboard button on each message
 *  • Full light / dark support
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getCSSVariableValue } from '../utils/colorUtils';
import { aiAPI } from '../utils/api';
import '../styles/AIrecommendation.css';

// ── Helpers ─────────────────────────────────────────────────────────
function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function priorityMeta(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'critical': return { color: 'var(--rec-critical)', fa: 'fa-circle-exclamation', label: 'Critical' };
    case 'high':     return { color: 'var(--rec-high)', fa: 'fa-triangle-exclamation', label: 'High' };
    case 'medium':   return { color: 'var(--rec-medium)', fa: 'fa-circle-info',         label: 'Medium' };
    default:         return { color: 'var(--rec-normal)', fa: 'fa-circle-check',        label: 'Normal' };
  }
}

// ── Confidence ring ───────────────────────────────────────────────────
function ConfidenceRing({ pct = 0 }) {
  const R = 22, C = 2 * Math.PI * R;
  const colorVar = pct >= 80 ? '--rec-normal' : pct >= 50 ? '--rec-high' : '--rec-critical';
  const color = getCSSVariableValue(colorVar);
  return (
    <div className="ai-conf-ring">
      <svg viewBox="0 0 56 56" width="56" height="56">
        <circle cx="28" cy="28" r={R} fill="none" strokeWidth="4"
          stroke="rgba(255,255,255,0.07)" />
        <circle cx="28" cy="28" r={R} fill="none" strokeWidth="4"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`}
          strokeDashoffset={C * 0.25}
          style={{ filter: `drop-shadow(0 0 5px ${color}90)`,
                   transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <span className="ai-conf-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="ai-typing">
      <i className="fa-solid fa-robot ai-typing-avatar" aria-hidden="true" />
      <div className="ai-typing-bubble">
        <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
      </div>
    </div>
  );
}

// ── Single message bubble ──────────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const pm = priorityMeta(msg.priority);
  // Resolve CSS variable to a concrete color string before concatenation.
  // Some style expressions below append alpha hex ('1a', '40'); resolving
  // ensures we have a usable color string (e.g. '#22c55e') rather than 'var(...)'.
  const pmResolvedColor = getCSSVariableValue(pm.color) || pm.color;

  const copy = () => {
    navigator.clipboard?.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="ai-bubble">
      <div className="ai-bubble-header">
        <span className="ai-bubble-avatar">
          <i className="fa-solid fa-robot" aria-hidden="true" />
        </span>
        <span className="ai-bubble-title">SproutSense AI</span>
        <span className="ai-bubble-time">{msg.time}</span>
        {msg.confidence !== undefined && (
          <ConfidenceRing pct={msg.confidence} />
        )}
        <span className="ai-priority-pill" style={{ background: `${pmResolvedColor}1a`, color: pmResolvedColor, borderColor: `${pmResolvedColor}40` }}>
          <i className={`fa-solid ${pm.fa}`} aria-hidden="true" />
          {pm.label}
        </span>
        <button className="ai-copy-btn" onClick={copy} title="Copy">
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" />
        </button>
      </div>

      <p className="ai-bubble-text">{msg.text}</p>

      {msg.action && (
        <div className="ai-bubble-action">
          <i className="fa-solid fa-bolt" aria-hidden="true" />
          <strong>Recommended Action:</strong> {msg.action}
        </div>
      )}

      {msg.tags && msg.tags.length > 0 && (
        <div className="ai-bubble-tags">
          {msg.tags.map(t => (
            <span key={t} className="ai-tag">
              <i className="fa-solid fa-tag" aria-hidden="true" />{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sensor context strip ───────────────────────────────────────────────
const SENSOR_PILLS = [
  { key: 'soilMoisture', label: 'Soil',  unit: '%',      fa: 'fa-droplet',          color: 'var(--sensor-moisture)' },
  { key: 'temperature',  label: 'Temp',  unit: '\u00b0C', fa: 'fa-temperature-half', color: 'var(--sensor-temperature)' },
  { key: 'humidity',     label: 'Humid', unit: '%',      fa: 'fa-cloud-rain',       color: 'var(--sensor-humidity)' },
  { key: 'pH',           label: 'pH',    unit: '',       fa: 'fa-flask',            color: 'var(--sensor-ph)' },
  { key: 'light',        label: 'Light', unit: ' lx',    fa: 'fa-sun',              color: 'var(--sensor-light)' },
];

function SensorStrip({ sensors }) {
  if (!sensors) return null;
  return (
    <div className="ai-sensor-strip">
      <span className="ai-sensor-strip-label">
        <i className="fa-solid fa-microchip" aria-hidden="true" /> Context
      </span>
      {SENSOR_PILLS.map(({ key, label, unit, fa, color }) => {
        const val = sensors[key];
        if (val === undefined) return null;
        return (
          <span key={key} className="ai-sensor-pill" style={{ '--sp-color': color }}>
            <i className={`fa-solid ${fa}`} aria-hidden="true" />
            {label}: <strong>{val}{unit}</strong>
          </span>
        );
      })}
    </div>
  );
}

// ── Quick-action chips ─────────────────────────────────────────────────
const QUICK_CHIPS = [
  { fa: 'fa-droplet',           label: 'Watering advice'     },
  { fa: 'fa-bug',               label: 'Disease check'       },
  { fa: 'fa-sun',               label: 'Light analysis'      },
  { fa: 'fa-flask',             label: 'pH recommendation'   },
  { fa: 'fa-seedling',          label: 'Growth tips'         },
  { fa: 'fa-triangle-exclamation', label: 'Alert summary'    },
];

// ── Auto-refresh countdown bar ─────────────────────────────────────────
const REFRESH_SEC = 300;
function CountdownBar({ seconds }) {
  const pct = ((REFRESH_SEC - seconds) / REFRESH_SEC) * 100;
  return (
    <div className="ai-countdown">
      <i className="fa-solid fa-rotate" aria-hidden="true" />
      <div className="ai-countdown-track">
        <div className="ai-countdown-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>Next scan in {seconds}s</span>
    </div>
  );
}

// ── History log ────────────────────────────────────────────────────────
function HistoryLog({ history, open, onToggle }) {
  if (history.length === 0) return null;
  return (
    <div className="ai-history">
      <button className="ai-history-toggle" onClick={onToggle}>
        <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
        Analysis History ({history.length})
        <i className={`fa-solid fa-chevron-down ai-history-caret${open ? ' open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="ai-history-list">
          {history.map((h, i) => {
            const pm = priorityMeta(h.priority);
            return (
              <div key={i} className="ai-history-row">
                <span className="ai-history-time">{h.time}</span>
                <i className={`fa-solid ${pm.fa}`} style={{ color: pm.color, fontSize: 11 }} aria-hidden="true" />
                <span className="ai-history-text">{h.text.slice(0, 80)}{h.text.length > 80 ? '\u2026' : ''}</span>
                {h.confidence !== undefined && (
                  <span className="ai-history-conf" style={{ color: pm.color }}>{h.confidence}%</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Scan overlay camera placeholder ────────────────────────────────────
function ScanView({ scanning, lastStatus }) {
  const color =
    lastStatus === 'healthy' ? 'var(--health-healthy)' :
    lastStatus === 'disease' ? 'var(--health-disease)' : 'var(--health-neutral)';
  return (
    <div className="ai-scan-view">
      {/* Corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <span key={c} className={`ai-bracket ai-bracket--${c}`}
          style={{ borderColor: color }} />
      ))}
      {/* Scan line */}
      {scanning && <div className="ai-scan-line" style={{ background: `linear-gradient(to right,transparent,${color},transparent)` }} />}
      {/* Center icon */}
      <div className="ai-scan-center">
        <i className={`fa-solid ${scanning ? 'fa-circle-notch fa-spin' : lastStatus === 'disease' ? 'fa-bug' : 'fa-leaf'} ai-scan-icon`}
          style={{ color }} aria-hidden="true" />
        <span className="ai-scan-status" style={{ color }}>
          {scanning ? 'Scanning…' : lastStatus === 'disease' ? 'Disease Detected' : 'Plant Healthy'}
        </span>
      </div>
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────
export function AIRecommendation({ showHeader = true, sensors = null }) {
  const [messages,    setMessages]    = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(REFRESH_SEC);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastStatus,  setLastStatus]  = useState('healthy');
  const feedRef = useRef(null);
  const timerRef = useRef(null);
  const countRef = useRef(null);

  const buildMessage = (data) => ({
    text:       data?.message || data?.recommendation || 'Analysis complete.',
    action:     data?.action     || null,
    priority:   data?.priority   || 'normal',
    confidence: data?.confidence !== undefined ? Math.round(data.confidence) : undefined,
    tags:       data?.tags       || [],
    time:       timestamp(),
  });

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setCountdown(REFRESH_SEC);
    try {
      const raw  = await aiAPI.getRecommendation();
      const data = raw?.data || raw;
      const msg  = buildMessage(data);
      setMessages(prev => [msg, ...prev].slice(0, 20));
      setHistory(prev  => [msg, ...prev].slice(0, 10));
      setLastStatus(
        (data?.priority === 'critical' || data?.priority === 'high') ? 'disease' : 'healthy'
      );
    } catch {
      const errMsg = { text: 'Unable to reach AI analysis service. Please check your connection.', priority: 'normal', time: timestamp() };
      setMessages(prev => [errMsg, ...prev].slice(0, 20));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 min
  useEffect(() => {
    runAnalysis();
    timerRef.current = setInterval(runAnalysis, REFRESH_SEC * 1000);
    return () => clearInterval(timerRef.current);
  }, [runAnalysis]);

  // Countdown ticker
  useEffect(() => {
    countRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_SEC : c - 1));
    }, 1000);
    return () => clearInterval(countRef.current);
  }, []);

  // Scroll feed to top when new message arrives
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [messages.length]);

  return (
    <section className="ai-root">

      {/* ===== HEADER ===== */}
      {showHeader && (
        <div className="ai-header">
          <div className="ai-header-left">
            <span className="ai-header-avatar" aria-hidden="true">
              <i className="fa-solid fa-robot" />
            </span>
            <div>
              <h2 className="ai-header-title">AI Plant Assistant</h2>
              <p className="ai-header-sub">Powered by SproutSense Vision Engine</p>
            </div>
          </div>
          <span className={`ai-status-badge${loading ? ' scanning' : lastStatus === 'disease' ? ' disease' : ' healthy'}`}>
            <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin' : lastStatus === 'disease' ? 'fa-bug' : 'fa-circle-check'}`} aria-hidden="true" />
            {loading ? 'Scanning' : lastStatus === 'disease' ? 'Issue Detected' : 'Healthy'}
          </span>
        </div>
      )}

      {/* ===== SENSOR CONTEXT STRIP ===== */}
      <SensorStrip sensors={sensors} />

      {/* ===== TWO-COLUMN BODY ===== */}
      <div className="ai-body">

        {/* Left: Scan view + quick chips */}
        <div className="ai-left">
          <ScanView scanning={loading} lastStatus={lastStatus} />

          <div className="ai-chips-label">
            <i className="fa-solid fa-bolt" aria-hidden="true" /> Quick Analysis
          </div>
          <div className="ai-chips">
            {QUICK_CHIPS.map(({ fa, label }) => (
              <button key={label} className="ai-chip" onClick={runAnalysis} disabled={loading}>
                <i className={`fa-solid ${fa}`} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <button
            className="ai-refresh-btn"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading
              ? <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> Analyzing&hellip;</>
              : <><i className="fa-solid fa-microscope" aria-hidden="true" /> Run Full Analysis</>}
          </button>

          <CountdownBar seconds={countdown} />
        </div>

        {/* Right: Message feed */}
        <div className="ai-feed-wrap">
          <div className="ai-feed-header">
            <i className="fa-solid fa-comments" aria-hidden="true" />
            AI Insights Feed
            <span className="ai-feed-count">{messages.length}</span>
          </div>
          <div className="ai-feed" ref={feedRef}>
            {loading && messages.length === 0 && <TypingDots />}
            {loading && messages.length > 0 && <TypingDots />}
            {messages.length === 0 && !loading && (
              <div className="ai-empty">
                <i className="fa-solid fa-seedling ai-empty-icon" aria-hidden="true" />
                <p>No analysis yet. Click <strong>Run Full Analysis</strong> to start.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== HISTORY ===== */}
      <HistoryLog history={history} open={historyOpen} onToggle={() => setHistoryOpen(o => !o)} />
    </section>
  );
}
