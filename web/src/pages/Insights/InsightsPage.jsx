/**
 * InsightsPage.jsx — Redesigned
 *
 * Sections:
 *  1. Page Header            — title, time selector, refresh button
 *  2. KPI Bar                — 4 quick-stat pills
 *  3. Health Score           — large ring + factor grid
 *  4. Insights Feed          — tabbed by severity, animated cards
 *  5. Predictions Timeline   — horizontal scroll, confidence bars
 *  6. Disease Detection      — Edge Impulse breakdown with progress bars
 *  7. Sensor Trends          — SVG line chart with axes, grid, tooltip
 *  8. Summary Stats          — 4-col stat strip
 *
 * No external chart libraries — pure SVG.
 * Font Awesome 6 icons throughout.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDiseaseName } from '../../utils/formatters';
import './InsightsPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ─── helpers ──────────────────────────────────────────────────────────────────
const SEV_META = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',  fa: 'fa-circle-exclamation',      label: 'Critical' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.28)', fa: 'fa-triangle-exclamation',    label: 'High'     },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', fa: 'fa-circle-info',             label: 'Medium'   },
  low:      { color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.28)', fa: 'fa-circle-info',             label: 'Low'      },
  none:     { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.20)',  fa: 'fa-circle-check',            label: 'Healthy'  },
};

const CAT_FA = {
  soil_moisture: 'fa-droplet',
  temperature:   'fa-temperature-half',
  light:         'fa-sun',
  watering:      'fa-faucet-drip',
  disease:       'fa-bug',
  health:        'fa-heart-pulse',
};

const GRAPH_TABS = [
  { key: 'soilMoisture', label: 'Soil',    unit: '%',    fa: 'fa-droplet',          color: '#22c55e' },
  { key: 'temperature',  label: 'Temp',    unit: '\u00b0C',  fa: 'fa-temperature-half', color: '#f59e0b' },
  { key: 'humidity',     label: 'Humidity',unit: '%',    fa: 'fa-cloud-rain',       color: '#22d3ee' },
  { key: 'lightLevel',   label: 'Light',   unit: ' lux', fa: 'fa-sun',              color: '#fbbf24' },
];

// ─── Health score ring ────────────────────────────────────────────────────────
function HealthRing({ score = 0 }) {
  const R  = 58;
  const C  = 2 * Math.PI * R;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Poor';
  return (
    <div className="ip-ring-wrap">
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={R} fill="none" strokeWidth="10"
          stroke="rgba(255,255,255,0.06)" />
        <circle cx="70" cy="70" r={R} fill="none" strokeWidth="10"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${(score / 100) * C} ${C}`}
          strokeDashoffset={C * 0.25}
          style={{ filter: `drop-shadow(0 0 10px ${color}80)`,
                   transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="ip-ring-inner">
        <span className="ip-ring-score" style={{ color }}>{score}</span>
        <span className="ip-ring-label" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ─── KPI pill ─────────────────────────────────────────────────────────────────
function KpiPill({ fa, label, value, color }) {
  return (
    <div className="ip-kpi" style={{ '--kpi-color': color }}>
      <span className="ip-kpi-icon"><i className={`fa-solid ${fa}`} aria-hidden="true" /></span>
      <div className="ip-kpi-body">
        <span className="ip-kpi-value">{value ?? '—'}</span>
        <span className="ip-kpi-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const [open, setOpen] = useState(false);
  const s = SEV_META[insight.severity] || SEV_META.none;
  const catFa = CAT_FA[insight.category] || 'fa-leaf';
  return (
    <div className="ip-insight" style={{
      '--is-color':  s.color,
      '--is-bg':     s.bg,
      '--is-border': s.border,
    }}>
      <div className="ip-insight-head">
        <span className="ip-insight-cat-icon"><i className={`fa-solid ${catFa}`} aria-hidden="true" /></span>
        <span className="ip-insight-cat">{insight.category.replace(/_/g,' ')}</span>
        <span className="ip-sev-pill">
          <i className={`fa-solid ${s.fa}`} aria-hidden="true" />{s.label}
        </span>
        {insight.edgeImpulseConfidence && (
          <span className="ip-ei-badge">
            <i className="fa-solid fa-microchip" aria-hidden="true" />
            {(insight.edgeImpulseConfidence * 100).toFixed(0)}%
          </span>
        )}
        <button className="ip-expand-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <i className={`fa-solid fa-chevron-down${open ? ' ip-caret-open' : ''}`} aria-hidden="true" />
        </button>
      </div>
      <p className="ip-insight-msg">{insight.message}</p>
      {open && (
        <div className="ip-insight-detail">
          <div className="ip-detail-row ip-detail-row--tip">
            <i className="fa-solid fa-lightbulb" aria-hidden="true" />
            <span>{insight.suggestion}</span>
          </div>
          {insight.impact && (
            <div className="ip-detail-row ip-detail-row--warn">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              <span>{insight.impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Prediction card ──────────────────────────────────────────────────────────
function PredictionCard({ p }) {
  const pct = Math.round((p.confidence || 0) * 100);
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="ip-pred">
      <div className="ip-pred-head">
        <i className="fa-solid fa-chart-line ip-pred-icon" aria-hidden="true" />
        <span className="ip-pred-type">{p.type.replace(/_/g,' ')}</span>
      </div>
      <p className="ip-pred-msg">{p.message}</p>
      <p className="ip-pred-text">
        <i className="fa-solid fa-crystal-ball" aria-hidden="true" style={{ marginRight: 5 }} />
        {p.prediction}
      </p>
      <div className="ip-pred-footer">
        <div className="ip-conf-bar-wrap">
          <div className="ip-conf-bar" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="ip-conf-pct" style={{ color }}>{pct}%</span>
      </div>
      {p.recommendation && (
        <div className="ip-pred-rec">
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          {p.recommendation}
        </div>
      )}
    </div>
  );
}

// ─── Disease row ──────────────────────────────────────────────────────────────
function DiseaseRow({ d, maxCount }) {
  const pct = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;
  const conf = Math.round((d.avgConfidence || 0) * 100);
  return (
    <div className="ip-disease-row">
      <div className="ip-disease-head">
        <i className="fa-solid fa-bug ip-disease-icon" aria-hidden="true" />
        <span className="ip-disease-name">{formatDiseaseName(d._id)}</span>
        <span className="ip-disease-conf">{conf}% conf</span>
        <span className="ip-disease-count">{d.count}×</span>
      </div>
      <div className="ip-disease-bar-track">
        <div className="ip-disease-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, unit, color, label }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length < 2) {
    return (
      <div className="ip-chart-empty">
        <i className="fa-solid fa-chart-line" aria-hidden="true" />
        <p>Not enough data for this period</p>
      </div>
    );
  }

  const pts = data.slice(-60);
  const vals = pts.map(d => d.value).filter(v => v != null);
  if (vals.length === 0) return null;

  const W = 800, H = 220, PAD = { top: 16, right: 20, bottom: 36, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top  - PAD.bottom;

  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const rangeV = maxV - minV || 1;
  const avgV = vals.reduce((a,b) => a+b, 0) / vals.length;

  const xOf = i => PAD.left + (i / (pts.length - 1)) * cW;
  const yOf = v => PAD.top  + cH - ((v - minV) / rangeV) * cH;

  const linePts = pts.map((p, i) => `${xOf(i)},${yOf(p.value)}`).join(' ');
  const areaPts = `${xOf(0)},${PAD.top + cH} ${linePts} ${xOf(pts.length-1)},${PAD.top + cH}`;

  // Y-axis ticks
  const yTicks = 4;
  const yTickVals = Array.from({length: yTicks + 1}, (_,i) => minV + (rangeV * i / yTicks));

  // X-axis ticks (show up to 6 labels)
  const xStep = Math.ceil(pts.length / 6);
  const xTicks = pts.filter((_, i) => i % xStep === 0);

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const pctX   = (mouseX - PAD.left) / cW;
    const idx    = Math.round(pctX * (pts.length - 1));
    if (idx < 0 || idx >= pts.length) return;
    const pt = pts[idx];
    setTooltip({ x: xOf(idx), y: yOf(pt.value), val: pt.value, idx });
  };

  const gradId = `ipGrad-${label.replace(/\s/g,'')}`;

  return (
    <div className="ip-chart-wrap">
      {/* Stats strip */}
      <div className="ip-chart-stats">
        <span><i className="fa-solid fa-arrow-up" style={{ color: '#f59e0b' }} aria-hidden="true" /> Max: <strong>{maxV.toFixed(1)}{unit}</strong></span>
        <span><i className="fa-solid fa-arrow-down" style={{ color: '#22d3ee' }} aria-hidden="true" /> Min: <strong>{minV.toFixed(1)}{unit}</strong></span>
        <span><i className="fa-solid fa-equals" style={{ color }} aria-hidden="true" /> Avg: <strong>{avgV.toFixed(1)}{unit}</strong></span>
        <span><i className="fa-solid fa-database" style={{ color }} aria-hidden="true" /> Points: <strong>{pts.length}</strong></span>
      </div>

      {/* SVG chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="ip-chart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTickVals.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
              fontSize="10" fill="rgba(255,255,255,0.35)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicks.map((pt, i) => {
          const idx = pts.indexOf(pt);
          return (
            <text key={i} x={xOf(idx)} y={H - 8} textAnchor="middle"
              fontSize="9" fill="rgba(255,255,255,0.30)">
              {pt.time ? new Date(pt.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : i}
            </text>
          );
        })}

        {/* Average line */}
        <line x1={PAD.left} y1={yOf(avgV)} x2={W - PAD.right} y2={yOf(avgV)}
          stroke={`${color}50`} strokeWidth="1" strokeDasharray="4 4" />

        {/* Area fill */}
        <polygon points={areaPts} fill={`url(#${gradId})`} />

        {/* Line */}
        <polyline points={linePts} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />

        {/* Tooltip dot + crosshair */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + cH}
              stroke={`${color}40`} strokeWidth="1" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
            {/* Tooltip box */}
            <g transform={`translate(${Math.min(tooltip.x + 10, W - 90)}, ${Math.max(tooltip.y - 30, PAD.top)})`}>
              <rect width="76" height="22" rx="5"
                fill="rgba(15,23,42,0.88)" stroke={`${color}60`} strokeWidth="1" />
              <text x="8" y="15" fontSize="11" fill={color} fontWeight="700">
                {parseFloat(tooltip.val).toFixed(1)}{unit}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="ip-skeleton">
      {[1,2,3,4].map(i => <div key={i} className="ip-skel-block" />)}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function InsightsPage() {
  const [insights,      setInsights]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [days,          setDays]          = useState(7);
  const [activeGraph,   setActiveGraph]   = useState('soilMoisture');
  const [sevFilter,     setSevFilter]     = useState('all');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/ai/insights?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      const json = await res.json();
      setInsights(json.data);
      setError(null);
      setLastRefreshed(new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchInsights();
    const id = setInterval(fetchInsights, 60_000);
    return () => clearInterval(id);
  }, [fetchInsights]);

  // ── Filtered insights
  const allInsights = insights?.insights || [];
  const sevCounts = ['critical','high','medium','low','none'].reduce((acc, s) => {
    acc[s] = allInsights.filter(i => i.severity === s).length;
    return acc;
  }, {});
  const filteredInsights = sevFilter === 'all'
    ? allInsights
    : allInsights.filter(i => i.severity === sevFilter);

  const score = insights?.overallHealth?.score ?? null;

  // Active graph tab meta
  const activeTab = GRAPH_TABS.find(t => t.key === activeGraph) || GRAPH_TABS[0];
  const activeData = insights?.graphData?.[activeGraph];

  // Disease max count
  const diseases = insights?.diseaseAnalysis?.diseaseBreakdown || [];
  const maxCount  = diseases.reduce((m, d) => Math.max(m, d.count), 0);

  // ── Error state
  if (error && !insights) return (
    <div className="ip-root">
      <div className="ip-error">
        <i className="fa-solid fa-triangle-exclamation ip-error-icon" aria-hidden="true" />
        <h3>Unable to load insights</h3>
        <p>{error}</p>
        <button className="ip-retry-btn" onClick={fetchInsights}>
          <i className="fa-solid fa-rotate" aria-hidden="true" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="ip-root">

      {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
      <div className="ip-header">
        <div className="ip-header-left">
          <span className="ip-header-icon-wrap" aria-hidden="true">
            <i className="fa-solid fa-chart-mixed" />
          </span>
          <div>
            <h1 className="ip-header-title">Plant Insights</h1>
            <p className="ip-header-sub">AI-powered analysis &bull; Edge Impulse disease detection</p>
          </div>
        </div>
        <div className="ip-header-right">
          {/* Time range */}
          <div className="ip-time-tabs">
            {[['1','24h'],[' 7','7d'],['30','30d']].map(([d,l]) => (
              <button key={d} className={`ip-time-tab${days === +d.trim() ? ' active' : ''}`}
                onClick={() => setDays(+d.trim())}>{l}</button>
            ))}
          </div>
          <button className="ip-refresh-btn" onClick={fetchInsights} disabled={loading}>
            <i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {lastRefreshed && (
        <p className="ip-last-refresh">
          <i className="fa-solid fa-clock" aria-hidden="true" /> Last updated: {lastRefreshed}
        </p>
      )}

      {loading && !insights ? <Skeleton /> : (
        <>
          {/* ══ KPI BAR ══════════════════════════════════════════════ */}
          <div className="ip-kpi-bar">
            <KpiPill fa="fa-heart-pulse" label="Health Score"
              value={score !== null ? `${score}/100` : null} color="#22c55e" />
            <KpiPill fa="fa-triangle-exclamation" label="Active Alerts"
              value={insights?.diseaseAnalysis?.activeAlerts ?? '—'} color="#f59e0b" />
            <KpiPill fa="fa-microscope" label="Total Scans"
              value={insights?.diseaseAnalysis?.totalScans ?? '—'} color="#22d3ee" />
            <KpiPill fa="fa-faucet-drip" label="Watering Events"
              value={insights?.wateringAnalysis?.totalEvents ?? '—'} color="#a78bfa" />
          </div>

          {/* ══ HEALTH SCORE ════════════════════════════════════════ */}
          {insights?.overallHealth && (
            <div className="ip-health-card">
              <div className="ip-health-left">
                <HealthRing score={score} />
              </div>
              <div className="ip-health-right">
                <h2 className="ip-health-title">Overall Plant Health</h2>
                <p className={`ip-health-status ip-health-status--${insights.overallHealth.status}`}>
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                  {insights.overallHealth.status?.toUpperCase()}
                </p>
                <div className="ip-factor-grid">
                  {Object.entries(insights.overallHealth.factors || {}).map(([k, v]) => (
                    <span key={k} className={`ip-factor${v === 'good' ? ' ip-factor--good' : ' ip-factor--warn'}`}>
                      <i className={`fa-solid ${v === 'good' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} aria-hidden="true" />
                      {k.replace(/_/g,' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ INSIGHTS FEED ═══════════════════════════════════════ */}
          {allInsights.length > 0 && (
            <div className="ip-section">
              <div className="ip-section-header">
                <i className="fa-solid fa-list-check" aria-hidden="true" />
                <h2>Insights Feed</h2>
                <span className="ip-section-count">{allInsights.length}</span>
              </div>

              {/* Severity filter tabs */}
              <div className="ip-sev-tabs">
                <button className={`ip-sev-tab${sevFilter === 'all' ? ' active' : ''}`}
                  onClick={() => setSevFilter('all')}>
                  All <span className="ip-sev-num">{allInsights.length}</span>
                </button>
                {['critical','high','medium','low','none'].map(s => sevCounts[s] > 0 && (
                  <button key={s}
                    className={`ip-sev-tab ip-sev-tab--${s}${sevFilter === s ? ' active' : ''}`}
                    onClick={() => setSevFilter(s)}
                    style={{ '--st-color': SEV_META[s].color }}>
                    <i className={`fa-solid ${SEV_META[s].fa}`} aria-hidden="true" />
                    {SEV_META[s].label}
                    <span className="ip-sev-num">{sevCounts[s]}</span>
                  </button>
                ))}
              </div>

              <div className="ip-insights-list">
                {filteredInsights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
                {filteredInsights.length === 0 && (
                  <div className="ip-no-results">
                    <i className="fa-solid fa-filter-circle-xmark" aria-hidden="true" />
                    No insights match this filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PREDICTIONS ════════════════════════════════════════ */}
          {insights?.predictions?.length > 0 && (
            <div className="ip-section">
              <div className="ip-section-header">
                <i className="fa-solid fa-chart-line" aria-hidden="true" />
                <h2>Predictions &amp; Trends</h2>
                <span className="ip-section-count">{insights.predictions.length}</span>
              </div>
              <div className="ip-pred-scroll">
                {insights.predictions.map((p, i) => (
                  <PredictionCard key={i} p={p} />
                ))}
              </div>
            </div>
          )}

          {/* ══ DISEASE DETECTION ══════════════════════════════════ */}
          {insights?.diseaseAnalysis && (
            <div className="ip-section">
              <div className="ip-section-header">
                <i className="fa-solid fa-microscope" aria-hidden="true" />
                <h2>Edge Impulse Disease Detection</h2>
              </div>
              <div className="ip-disease-stats">
                <div className="ip-dsstat">
                  <span className="ip-dsstat-val">{insights.diseaseAnalysis.totalScans}</span>
                  <span className="ip-dsstat-label">
                    <i className="fa-solid fa-camera" aria-hidden="true" /> Total Scans
                  </span>
                </div>
                <div className="ip-dsstat">
                  <span className="ip-dsstat-val" style={{ color: insights.diseaseAnalysis.activeAlerts > 0 ? '#ef4444' : '#22c55e' }}>
                    {insights.diseaseAnalysis.activeAlerts}
                  </span>
                  <span className="ip-dsstat-label">
                    <i className="fa-solid fa-bell" aria-hidden="true" /> Active Alerts
                  </span>
                </div>
                <div className="ip-dsstat">
                  <span className="ip-dsstat-val">{diseases.length}</span>
                  <span className="ip-dsstat-label">
                    <i className="fa-solid fa-bug" aria-hidden="true" /> Conditions Detected
                  </span>
                </div>
              </div>
              {diseases.length > 0 && (
                <div className="ip-disease-list">
                  {diseases.map((d, i) => (
                    <DiseaseRow key={i} d={d} maxCount={maxCount} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ SENSOR TRENDS ══════════════════════════════════════ */}
          {insights?.graphData && (
            <div className="ip-section">
              <div className="ip-section-header">
                <i className="fa-solid fa-wave-square" aria-hidden="true" />
                <h2>Sensor Data Trends</h2>
              </div>

              {/* Graph tab bar */}
              <div className="ip-graph-tabs">
                {GRAPH_TABS.map(tab => (
                  <button key={tab.key}
                    className={`ip-graph-tab${activeGraph === tab.key ? ' active' : ''}`}
                    style={{ '--gt-color': tab.color }}
                    onClick={() => setActiveGraph(tab.key)}
                  >
                    <i className={`fa-solid ${tab.fa}`} aria-hidden="true" />
                    {tab.label}
                    {/* mini sparkline */}
                    {insights.graphData[tab.key]?.length > 1 && (
                      <MiniSparkline data={insights.graphData[tab.key]} color={tab.color} />
                    )}
                  </button>
                ))}
              </div>

              <div className="ip-chart-card">
                <LineChart
                  data={activeData}
                  unit={activeTab.unit}
                  color={activeTab.color}
                  label={activeTab.label}
                />
              </div>
            </div>
          )}

          {/* ══ SUMMARY STATS ══════════════════════════════════════ */}
          {insights?.stats && (
            <div className="ip-section">
              <div className="ip-section-header">
                <i className="fa-solid fa-table-cells" aria-hidden="true" />
                <h2>Summary — {days} Day{days > 1 ? 's' : ''}</h2>
              </div>
              <div className="ip-stats-grid">
                <StatTile fa="fa-droplet"          color="#22c55e" label="Avg Soil Moisture"
                  value={insights.stats.avgSoilMoisture?.toFixed(1)} unit="%" />
                <StatTile fa="fa-temperature-half" color="#f59e0b" label="Avg Temperature"
                  value={insights.stats.avgTemperature?.toFixed(1)} unit="°C" />
                <StatTile fa="fa-faucet-drip"       color="#a78bfa" label="Watering Events"
                  value={insights.wateringAnalysis?.totalEvents} unit="" />
                <StatTile fa="fa-circle-check"      color="#22d3ee" label="Watering Success"
                  value={insights.wateringAnalysis?.successRate} unit="%" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ fa, color, label, value, unit }) {
  return (
    <div className="ip-stat-tile" style={{ '--st-color': color }}>
      <span className="ip-stat-icon"><i className={`fa-solid ${fa}`} aria-hidden="true" /></span>
      <span className="ip-stat-value">{value ?? '—'}{unit}</span>
      <span className="ip-stat-label">{label}</span>
    </div>
  );
}

// ─── Mini sparkline (inside graph tab) ────────────────────────────────────────
function MiniSparkline({ data, color }) {
  const pts = data.slice(-16);
  const vals = pts.map(d => d.value).filter(v => v != null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const points = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * 48;
    const y = 14 - ((p.value - min) / range) * 14;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 48 16" width="48" height="16" className="ip-sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default InsightsPage;
