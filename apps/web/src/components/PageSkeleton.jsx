/**
 * PageSkeleton.jsx
 * Route-aware skeleton loading screens for SproutSense.
 * Reads current pathname to render the correct skeleton layout.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import './PageSkeleton.css';

/* ─── Primitive skeleton block ─────────────────────────────── */
const Sk = ({ w = '100%', h = 12, r = 6, style = {}, className = '' }) => (
  <div
    className={`ss-sk ${className}`}
    style={{ width: w, height: h, borderRadius: r, ...style }}
  />
);

/* ─── Reusable shell: glass card ───────────────────────────── */
const SkCard = ({ children, style = {}, className = '' }) => (
  <div className={`ss-sk-card ${className}`} style={style}>{children}</div>
);

/* ─── Stat tile ────────────────────────────────────────────── */
const SkStat = ({ delay = 0 }) => (
  <SkCard className="ss-sk-stat" style={{ animationDelay: `${delay}ms` }}>
    <div className="ss-sk-stat-top">
      <Sk w={36} h={36} r={10} />
      <Sk w="55%" h={10} r={5} />
    </div>
    <Sk w="70%" h={22} r={6} />
    <Sk w="40%" h={8} r={4} />
  </SkCard>
);

/* ─── Chart block ───────────────────────────────────────────── */
const SkChart = ({ height = 160, bars = 8, delay = 0 }) => (
  <SkCard style={{ animationDelay: `${delay}ms` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <Sk w="38%" h={10} r={5} />
      <Sk w={60} h={24} r={999} />
    </div>
    <div className="ss-sk-bars" style={{ height }}>
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          className="ss-sk ss-sk-bar"
          style={{
            height: `${30 + Math.round(Math.sin(i * 0.9 + 1) * 35 + 40)}%`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  </SkCard>
);

/* ─── Sensor card ───────────────────────────────────────────── */
const SkSensor = ({ delay = 0 }) => (
  <SkCard className="ss-sk-sensor" style={{ animationDelay: `${delay}ms` }}>
    <div className="ss-sk-sensor-header">
      <Sk w={40} h={40} r={12} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Sk w="60%" h={10} r={5} />
        <Sk w="35%" h={8} r={4} />
      </div>
      <Sk w={52} h={20} r={999} />
    </div>
    <Sk w="100%" h={3} r={2} style={{ margin: '12px 0' }} />
    <Sk w="50%" h={32} r={8} />
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <Sk w="30%" h={8} r={4} />
      <Sk w="40%" h={8} r={4} />
    </div>
  </SkCard>
);

/* ─── Alert row ────────────────────────────────────────────── */
const SkAlertRow = ({ delay = 0 }) => (
  <SkCard className="ss-sk-alert-row" style={{ animationDelay: `${delay}ms` }}>
    <Sk w={10} h={44} r={4} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Sk w="55%" h={11} r={5} />
      <Sk w="38%" h={8} r={4} />
    </div>
    <Sk w={72} h={24} r={999} />
  </SkCard>
);

/* ─── Table row ────────────────────────────────────────────── */
const SkTableRow = ({ delay = 0 }) => (
  <div className="ss-sk-table-row" style={{ animationDelay: `${delay}ms` }}>
    <Sk w={32} h={32} r={50} />
    <Sk w="22%" h={10} r={5} />
    <Sk w="14%" h={10} r={5} />
    <Sk w="16%" h={10} r={5} />
    <Sk w="12%" h={10} r={5} />
    <Sk w={60} h={22} r={999} />
  </div>
);

/* ─── Shared page chrome: title bar ─────────────────────────── */
const SkPageHeader = ({ wide = false }) => (
  <div className="ss-sk-page-header">
    <div>
      <Sk w={200} h={18} r={7} />
      <Sk w={140} h={10} r={5} style={{ marginTop: 8 }} />
    </div>
    {wide && <Sk w={110} h={36} r={10} />}
  </div>
);

/* ─── ROUTE SKELETONS ───────────────────────────────────────── */

/* Dashboard / Home */
const HomeSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader wide />
    <div className="ss-sk-stats-grid">
      {[0, 80, 160, 240].map(d => <SkStat key={d} delay={d} />)}
    </div>
    <div className="ss-sk-two-col">
      <SkChart height={160} bars={9} delay={120} />
      <SkChart height={160} bars={6} delay={200} />
    </div>
    <div className="ss-sk-sensors-grid">
      {[0, 100, 200].map(d => <SkSensor key={d} delay={d} />)}
    </div>
  </div>
);

/* Sensors */
const SensorsSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    <div className="ss-sk-sensors-grid">
      {[0, 80, 160, 240, 320, 400].map(d => <SkSensor key={d} delay={d} />)}
    </div>
  </div>
);

/* Analytics */
const AnalyticsSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader wide />
    <div className="ss-sk-stats-grid">
      {[0, 60, 120, 180].map(d => <SkStat key={d} delay={d} />)}
    </div>
    <SkChart height={200} bars={12} delay={100} />
    <div className="ss-sk-two-col" style={{ marginTop: 12 }}>
      <SkChart height={140} bars={7} delay={160} />
      <SkChart height={140} bars={5} delay={220} />
    </div>
  </div>
);

/* Alerts */
const AlertsSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    <SkCard style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[80, 90, 70, 80].map((w, i) => <Sk key={i} w={w} h={28} r={999} />)}
      </div>
    </SkCard>
    {[0, 90, 180, 270, 360].map(d => <SkAlertRow key={d} delay={d} />)}
  </div>
);

/* Controls */
const ControlsSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    <div className="ss-sk-two-col">
      <SkCard>
        <Sk w="50%" h={12} r={6} />
        <Sk w="100%" h={90} r={14} style={{ marginTop: 16 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Sk w="48%" h={40} r={10} />
          <Sk w="48%" h={40} r={10} />
        </div>
      </SkCard>
      <SkCard>
        <Sk w="55%" h={12} r={6} />
        <Sk w="100%" h={120} r={14} style={{ marginTop: 16 }} />
        <Sk w="35%" h={36} r={10} style={{ marginTop: 16 }} />
      </SkCard>
    </div>
    <div className="ss-sk-two-col" style={{ marginTop: 12 }}>
      <SkStat delay={100} />
      <SkStat delay={180} />
    </div>
  </div>
);

/* ─── AI Chat / Intelligence Hub skeleton ──────────────────── */
const AIChatSkeleton = () => (
  <div className="ss-sk-page" style={{ gap: 0, padding: 0 }}>

    {/* ── Topbar: avatar + title + pills */}
    <div className="ss-sk-ai-topbar">
      <div className="ss-sk-ai-header">
        <Sk w={44} h={44} r={50} style={{ flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Sk w={160} h={14} r={6} />
          <Sk w={120} h={9} r={4} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Sk w={90} h={28} r={999} />
          <Sk w={72} h={28} r={999} />
        </div>
      </div>

      {/* ── Sensor badge strip */}
      <div className="ss-sk-ai-badges">
        {[80, 96, 76, 88, 72].map((w, i) => (
          <div key={i} className="ss-sk-badge-pill">
            <Sk w={18} h={18} r={50} />
            <Sk w={w} h={9} r={4} />
          </div>
        ))}
      </div>

      {/* ── Tabs */}
      <div className="ss-sk-ai-tabs">
        {[70, 68, 86].map((w, i) => (
          <Sk key={i} w={w} h={30} r={8} style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>

    {/* ── Chat body */}
    <div className="ss-sk-ai-body">

      {/* Quick prompts grid */}
      <div className="ss-sk-ai-prompts">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Sk key={i} w="100%" h={36} r={8} style={{ animationDelay: `${i * 55}ms` }} />
        ))}
      </div>

      {/* Spacer pushes messages down */}
      <div style={{ flex: 1 }} />

      {/* Chat bubbles */}
      <div className="ss-sk-ai-messages">
        {[
          { side: 'left',  w: '72%', lines: 2, delay: 0   },
          { side: 'right', w: '54%', lines: 1, delay: 60  },
          { side: 'left',  w: '78%', lines: 3, delay: 120 },
        ].map(({ side, w, lines, delay }, i) => (
          <div key={i} className={`ss-sk-ai-bubble ss-sk-ai-${side}`}
               style={{ animationDelay: `${delay}ms` }}>
            {side === 'left' && (
              <Sk w={30} h={30} r={50} style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div className="ss-sk-ai-bubble-inner">
              {Array.from({ length: lines }, (_, j) => (
                <Sk key={j} w={j === lines - 1 ? '60%' : '90%'} h={10}
                    r={5} style={{ marginBottom: j < lines - 1 ? 6 : 0,
                    animationDelay: `${delay + j * 40}ms` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Composer bar */}
      <div className="ss-sk-ai-composer">
        <Sk w="100%" h={48} r={12} />
        <Sk w={44} h={44} r={50} style={{ flexShrink: 0 }} />
      </div>

    </div>
  </div>
);

/* ESP32 / Device Status */
const ESP32Skeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    <div className="ss-sk-two-col">
      <SkCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Sk w={48} h={48} r={50} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Sk w="55%" h={11} r={5} />
            <Sk w="35%" h={8} r={4} />
          </div>
          <Sk w={70} h={24} r={999} />
        </div>
        {[0, 60, 120, 180, 240].map(d => (
          <div key={d} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Sk w="35%" h={9} r={4} />
            <Sk w="40%" h={9} r={4} />
          </div>
        ))}
      </SkCard>
      <SkCard>
        <Sk w="50%" h={11} r={5} />
        <Sk w="100%" h={180} r={12} style={{ marginTop: 16 }} />
      </SkCard>
    </div>
    <div className="ss-sk-stats-grid" style={{ marginTop: 12 }}>
      {[0, 80, 160, 240].map(d => <SkStat key={d} delay={d} />)}
    </div>
  </div>
);

/* Settings */
const SettingsSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    {[0, 1, 2, 3].map(i => (
      <SkCard key={i} style={{ marginBottom: 12, animationDelay: `${i * 80}ms` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sk w={32} h={32} r={8} />
            <Sk w={120} h={11} r={5} />
          </div>
          <Sk w={40} h={22} r={999} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1].map(j => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Sk w="45%" h={9} r={4} />
              <Sk w="30%" h={9} r={4} />
            </div>
          ))}
        </div>
      </SkCard>
    ))}
  </div>
);

/* Admin panel */
const AdminSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader wide />
    <div className="ss-sk-stats-grid">
      {[0, 80, 160, 240].map(d => <SkStat key={d} delay={d} />)}
    </div>
    <SkCard style={{ marginTop: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Sk w="30%" h={11} r={5} />
        <Sk w={90} h={30} r={8} />
      </div>
      {[0, 70, 140, 210, 280].map(d => <SkTableRow key={d} delay={d} />)}
    </SkCard>
  </div>
);

/* Auth pages (login/register) */
const AuthSkeleton = () => (
  <div className="ss-sk-page ss-sk-page-center">
    <SkCard style={{ width: 'min(400px, 90vw)', padding: 36 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Sk w={56} h={56} r={50} />
        <Sk w="55%" h={14} r={6} />
        <Sk w="70%" h={9} r={4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Sk w="100%" h={44} r={10} />
        <Sk w="100%" h={44} r={10} />
        <Sk w="100%" h={44} r={10} />
      </div>
      <Sk w="100%" h={44} r={10} style={{ marginTop: 20 }} />
      <Sk w="60%" h={9} r={4} style={{ margin: '16px auto 0' }} />
    </SkCard>
  </div>
);

/* Public pages */
const PublicSkeleton = () => (
  <div className="ss-sk-page">
    <div className="ss-sk-hero">
      <Sk w="65%" h={40} r={10} style={{ margin: '0 auto 16px' }} />
      <Sk w="50%" h={14} r={6} style={{ margin: '0 auto 10px' }} />
      <Sk w="40%" h={10} r={5} style={{ margin: '0 auto 28px' }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Sk w={130} h={44} r={10} />
        <Sk w={110} h={44} r={10} />
      </div>
    </div>
    <div className="ss-sk-stats-grid">
      {[0, 80, 160, 240].map(d => <SkStat key={d} delay={d} />)}
    </div>
    <SkChart height={180} bars={10} delay={120} />
  </div>
);

/* Generic fallback */
const GenericSkeleton = () => (
  <div className="ss-sk-page">
    <SkPageHeader />
    <div className="ss-sk-stats-grid">
      {[0, 80, 160, 240].map(d => <SkStat key={d} delay={d} />)}
    </div>
    <div className="ss-sk-two-col">
      <SkChart height={150} bars={8} delay={100} />
      <SkCard>
        {[0, 60, 120, 180, 240].map(d => (
          <div key={d} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Sk w={32} h={32} r={50} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Sk w="65%" h={10} r={5} />
              <Sk w="45%" h={8} r={4} />
            </div>
          </div>
        ))}
      </SkCard>
    </div>
  </div>
);

/* ─── ROUTE → SKELETON MAP ──────────────────────────────────── */
const SKELETON_MAP = {
  '/home'            : HomeSkeleton,
  '/sensors'         : SensorsSkeleton,
  '/analytics'       : AnalyticsSkeleton,
  '/alerts'          : AlertsSkeleton,
  '/controls'        : ControlsSkeleton,
  '/ai'              : AIChatSkeleton,
  '/intelligence'    : AIChatSkeleton,
  '/esp32'           : ESP32Skeleton,
  '/settings'        : SettingsSkeleton,
  '/admin/panel'     : AdminSkeleton,
  '/admin'           : AdminSkeleton,
  '/login'           : AuthSkeleton,
  '/register'        : AuthSkeleton,
  '/forgot-password' : AuthSkeleton,
  '/reset-password'  : AuthSkeleton,
  '/'                : PublicSkeleton,
  '/about'           : PublicSkeleton,
  '/features'        : PublicSkeleton,
  '/demo'            : PublicSkeleton,
  '/contact'         : PublicSkeleton,
  '/plant-library'   : PublicSkeleton,
};

/* ─── EXPORTED COMPONENT ─────────────────────────────────────── */
export default function PageSkeleton() {
  const { pathname } = useLocation();

  // Find best match (exact first, then prefix)
  const Skeleton =
    SKELETON_MAP[pathname] ||
    Object.entries(SKELETON_MAP).find(([k]) => pathname.startsWith(k))?.[1] ||
    GenericSkeleton;

  return (
    <div className="ss-sk-root" role="status" aria-label="Loading page...">
      <Skeleton />
    </div>
  );
}
