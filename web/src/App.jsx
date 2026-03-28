/**
 * App.jsx — src/
 * Root application component for SproutSense.
 *
 * Responsibilities:
 *  - Global state: sensors, pumpActive, systemStatus, alerts, theme, sidebar
 *  - WebSocket connection via useWebSocket hook
 *  - Polling: sensor data every 5 s, disease detections every 60 s
 *  - Theme toggle with View Transitions API + CSS fallback
 *  - Route definitions via react-router-dom <Routes>
 *  - Renders <Layout> (sidebar + navbar + page content)
 *
 * Import order:
 *  1. React + hooks
 *  2. Router utilities
 *  3. Custom hooks
 *  4. API utilities
 *  5. Layout & shared components
 *  6. Pages (each page lives in its own pages/<Name>/ folder)
 *  7. Styles
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { useWebSocket } from './hooks/useWebSocket';

import { configAPI, sensorAPI, wateringAPI, aiAPI } from './utils/api';

// ── Admin auth ─────────────────────────────────────────────────────────────
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminPanelPage from './pages/Admin/AdminPanelPage';

// ── Shared components ──────────────────────────────────────────────────────
import { Navbar } from './components/layout/Navbar';
import { SensorCard } from './components/SensorCard';
import { ControlCard } from './components/ControlCard';
import { AIRecommendation } from './components/AIRecommendation';
import { ConfigCard } from './components/ConfigCard';
import { Notification } from './components/Notification';
import { GlassIcon } from './components/bits/GlassIcon';
import SproutSenseLogo from './components/SproutSenseLogo';

// ── Pages ────────────────────────────────────────────────────────────────
import HomePage from './pages/Home/HomePage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';
import AnalyticsPage from './pages/Analytics/AnalyticsPage.jsx';
import AlertsPage from './pages/Alerts/AlertsPage.jsx';
import AIChat from './pages/AIChat/AIChat.jsx';
import InsightsPage from './pages/Insights/InsightsPage.jsx';

// ── Styles ─────────────────────────────────────────────────────────────────
import './App.css';
import './components/layout/styles/Sidebar.css';
import './components/layout/styles/Layout.css';

// ───────────────────────────────────────────────────────────────────────────
// PROTECTED ADMIN ROUTE
// Wraps any admin-only route. Redirects to /admin/login if not authenticated.
// ───────────────────────────────────────────────────────────────────────────
function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated } = useAdminAuth();
  return isAdminAuthenticated
    ? children
    : <Navigate to="/admin/login" replace />;
}

// ───────────────────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION STRUCTURE
// ───────────────────────────────────────────────────────────────────────────
const sidebarCategories = [
  {
    label: 'Main',
    items: [
      { path: '/home', label: 'Overview', icon: 'home' },
    ]
  },
  {
    label: 'Monitor',
    items: [
      { path: '/sensors', label: 'Sensors', icon: 'sensors' },
      { path: '/analytics', label: 'Analytics', icon: 'analytics' },
      { path: '/alerts', label: 'Alerts', icon: 'bell' },
    ]
  },
  {
    label: 'Control',
    items: [
      { path: '/controls', label: 'Controls', icon: 'controls' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/ai', label: 'AI Assistant', icon: 'bot' },
      { path: '/insights', label: 'Insights', icon: 'insights' },
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/backend', label: 'Backend', icon: 'server' },
      { path: '/esp32', label: 'Device Connected', icon: 'esp32' },
      { path: '/config', label: 'Config', icon: 'config' },
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ]
  },
];

const allSidebarItems = sidebarCategories.flatMap(c => c.items);

// ───────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES & COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL environment variable is missing. API calls will default to /api.');
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

function normalizeSensorPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return {
    ...payload,
    pH: payload.pH ?? payload.ph,
    flowRate: payload.flowRate ?? payload.flowRateMlPerMin ?? payload.waterFlowRate,
    flowVolume: payload.flowVolume ?? payload.cycleVolumeML ?? payload.waterFlowVolume,
    leafCount: payload.leafCount ?? payload.leaf_count ?? payload.canopyLeafCount,
  };
}

function extractData(result) {
  if (!result || typeof result !== 'object') return result;
  return result.data || result;
}

function onlineToStatus(isOnline) {
  return isOnline ? 'online' : 'offline';
}

function statusLabel(status) {
  switch (status) {
    case 'online': return 'Online';
    case 'offline': return 'Offline';
    default: return 'Checking';
  }
}

function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function formatDiseaseName(name) {
  if (!name) return 'Unknown';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ───────────────────────────────────────────────────────────────────────────
// APP COMPONENT
// ───────────────────────────────────────────────────────────────────────────
function App() {
  const location = useLocation();

  // Determine if we're on a full-screen admin route (no sidebar/navbar)
  const isAdminRoute = location.pathname.startsWith('/admin');

  // ── State ──────────────────────────────────────────────────────────────
  const [sensors, setSensors] = useState(null);
  const [pumpActive, setPumpActive] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    esp32: 'checking',
    esp32Cam: 'checking',
    esp32LastSeen: null,
    esp32CamLastSeen: null,
    lastUpdated: null,
  });
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [plantGrowthEnabled, setPlantGrowthEnabled] = useState(true);
  const [plantGrowthStage, setPlantGrowthStage] = useState('vegetative');
  const [aiInsightsMode, setAiInsightsMode] = useState('snapshots');
  const [isAiControlSaving, setIsAiControlSaving] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const themeTransitionTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current) clearTimeout(themeTransitionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sensors) return;
    const newAlerts = [];
    const now = new Date();
    if (sensors.soilMoisture !== undefined && sensors.soilMoisture < 20)
      newAlerts.push({ id: 'low-moisture', type: 'warning', message: 'Soil moisture critically low', value: `${sensors.soilMoisture}%`, time: now });
    if (sensors.temperature !== undefined && sensors.temperature > 38)
      newAlerts.push({ id: 'high-temp', type: 'error', message: 'High temperature detected', value: `${sensors.temperature} °C`, time: now });
    if (sensors.pH !== undefined && (sensors.pH < 5.5 || sensors.pH > 7.5))
      newAlerts.push({ id: 'ph-out', type: 'warning', message: 'pH level out of optimal range', value: `pH ${sensors.pH}`, time: now });
    if (sensors.humidity !== undefined && sensors.humidity < 30)
      newAlerts.push({ id: 'low-humidity', type: 'info', message: 'Low ambient humidity', value: `${sensors.humidity}%`, time: now });
    if (pumpActive && sensors.flowRate !== undefined && sensors.flowRate < 1)
      newAlerts.push({ id: 'no-flow', type: 'error', message: 'Pump active but flow is near zero', value: `${sensors.flowRate} mL/min`, time: now });
    setAlerts(prev => [
      ...newAlerts,
      ...prev.filter(a => a.source === 'ESP32-CAM'),
    ]);
  }, [sensors, pumpActive]);

  const fetchDiseaseAlerts = useCallback(async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      const aiResp = await aiAPI.getDiseaseDetections({
        deviceId: 'ESP32-CAM',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 5,
      });
      const aiData = aiResp?.data || aiResp;
      const detections = Array.isArray(aiData?.detections) ? aiData.detections : [];
      if (!detections.length) return;
      const latest = detections[0];
      const isHealthy = !latest.detectedDisease ||
        ['healthy', 'unknown'].includes(latest.detectedDisease.toLowerCase());
      const newAlert = isHealthy
        ? { id: 'disease-healthy', type: 'info', message: 'ESP32-CAM: Plant appears healthy', value: latest.confidence !== undefined ? `Confidence: ${Math.round(latest.confidence * 100)}%` : 'No disease detected', source: 'ESP32-CAM', time: latest.timestamp ? new Date(latest.timestamp) : new Date() }
        : { id: `disease-${latest._id || latest.timestamp}`, type: 'error', message: `Plant disease detected: ${formatDiseaseName(latest.detectedDisease)}`, value: latest.confidence !== undefined ? `Confidence: ${Math.round(latest.confidence * 100)}%` : 'ESP32-CAM Detection', source: 'ESP32-CAM', time: latest.timestamp ? new Date(latest.timestamp) : new Date() };
      setAlerts(prev => [
        ...prev.filter(a => !(a.source === 'ESP32-CAM' && a.id.startsWith('disease-'))),
        newAlert,
      ]);
    } catch { /* Silently ignore */ }
  }, []);

  useEffect(() => {
    fetchDiseaseAlerts();
    const interval = setInterval(fetchDiseaseAlerts, 5 * 60_000);
    return () => clearInterval(interval);
  }, [fetchDiseaseAlerts]);

  // ── Theme toggle ───────────────────────────────────────────────────────
  const toggleTheme = () => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      return;
    }
    const directions = [
      { fromX: '-140%', fromY: '0%', toX: '140%', toY: '0%', angle: '90deg' },
      { fromX: '140%', fromY: '0%', toX: '-140%', toY: '0%', angle: '270deg' },
      { fromX: '0%', fromY: '-140%', toX: '0%', toY: '140%', angle: '180deg' },
      { fromX: '0%', fromY: '140%', toX: '0%', toY: '-140%', angle: '0deg' },
      { fromX: '-140%', fromY: '-140%', toX: '140%', toY: '140%', angle: '135deg' },
      { fromX: '140%', fromY: '-140%', toX: '-140%', toY: '140%', angle: '225deg' },
    ];
    const d = directions[Math.floor(Math.random() * directions.length)];
    const driftX = d.toX.startsWith('-') ? '-10px' : d.toX.startsWith('1') ? '10px' : '0px';
    const driftY = d.toY.startsWith('-') ? '-10px' : d.toY.startsWith('1') ? '10px' : '0px';
    root.style.setProperty('--theme-ease', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    root.style.setProperty('--theme-scale', '1.02');
    root.style.setProperty('--theme-blur', '1.5px');
    root.style.setProperty('--theme-drift-x', driftX);
    root.style.setProperty('--theme-drift-y', driftY);
    root.style.setProperty('--theme-sweep-from-x', d.fromX);
    root.style.setProperty('--theme-sweep-from-y', d.fromY);
    root.style.setProperty('--theme-sweep-to-x', d.toX);
    root.style.setProperty('--theme-sweep-to-y', d.toY);
    root.style.setProperty('--theme-sweep-angle', d.angle);
    root.classList.remove('theme-transitioning');
    void root.offsetWidth;
    root.classList.add('theme-transitioning');
    const applyTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
    if (themeTransitionTimeoutRef.current) clearTimeout(themeTransitionTimeoutRef.current);
    themeTransitionTimeoutRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      ['--theme-ease', '--theme-scale', '--theme-blur', '--theme-drift-x', '--theme-drift-y']
        .forEach(p => root.style.removeProperty(p));
    }, 1350);
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const closeSidebar  = () => { if (isMobile) setIsSidebarCollapsed(true); };
  const pageTitle = allSidebarItems.find(i => i.path === location.pathname)?.label || 'SproutSense';

  // ── WebSocket ──────────────────────────────────────────────────────────
  const handleWebSocketMessage = useCallback((data) => {
    const { type, data: payload } = data;
    switch (type) {
      case 'sensor_update':    setSensors(normalizeSensorPayload(payload)); break;
      case 'watering_started': setPumpActive(true);  showNotification('Watering started', 'success'); break;
      case 'watering_stopped': setPumpActive(false); showNotification('Watering stopped', 'info');    break;
      case 'config_updated':   showNotification('Configuration updated', 'success'); break;
      default: console.log('[WS] Unknown event:', type);
    }
  }, []);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    let offlineTimeout;
    if (isConnected) {
      setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(true) }));
    } else {
      offlineTimeout = setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(false) }));
      }, 5000);
    }
    return () => { if (offlineTimeout) clearTimeout(offlineTimeout); };
  }, [isConnected]);

  useEffect(() => {
    let esp32OfflineTimeout, esp32CamOfflineTimeout;
    let lastEsp32Online = true, lastEsp32CamOnline = true;

    const fetchData = async () => {
      try {
        const [sensorData, wateringStatus, configResponse, esp32StatusResponse, esp32CamStatusResponse, healthResponse] =
          await Promise.all([
            sensorAPI.getLatest(),
            wateringAPI.getStatus(),
            configAPI.get(),
            configAPI.getStatus('ESP32-SENSOR'),
            configAPI.getStatus('ESP32-CAM'),
            configAPI.getHealth('ESP32-SENSOR'),
          ]);

        const configData         = extractData(configResponse);
        const latestSensorData   = extractData(sensorData);
        const latestWatering     = extractData(wateringStatus);
        const esp32Status        = extractData(esp32StatusResponse);
        const esp32CamStatus     = extractData(esp32CamStatusResponse);
        const healthData         = extractData(healthResponse);

        setSensors(normalizeSensorPayload(latestSensorData));
        setPumpActive(latestWatering?.pumpActive || false);
        setMoistureThreshold(configData?.soilMoistureThreshold ?? 30);
        setPlantGrowthEnabled(configData?.plantGrowthEnabled ?? true);
        setPlantGrowthStage(configData?.plantGrowthStage || 'vegetative');
        setAiInsightsMode(configData?.aiInsightsMode || 'snapshots');

        const isDeviceOnline = (s) => {
          if (!s?.online || !s?.lastSeen) return false;
          return new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
        };

        const esp32IsOnline    = isDeviceOnline(esp32Status);
        const esp32CamIsOnline = isDeviceOnline(esp32CamStatus);

        if (esp32IsOnline) {
          if (esp32OfflineTimeout) clearTimeout(esp32OfflineTimeout);
          lastEsp32Online = true;
        } else if (lastEsp32Online) {
          esp32OfflineTimeout = setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, esp32: onlineToStatus(false), esp32LastSeen: esp32Status?.lastSeen || null }));
          }, 5000);
          lastEsp32Online = false;
        }

        if (esp32CamIsOnline) {
          if (esp32CamOfflineTimeout) clearTimeout(esp32CamOfflineTimeout);
          lastEsp32CamOnline = true;
        } else if (lastEsp32CamOnline) {
          esp32CamOfflineTimeout = setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, esp32Cam: onlineToStatus(false), esp32CamLastSeen: esp32CamStatus?.lastSeen || null }));
          }, 5000);
          lastEsp32CamOnline = false;
        }

        setSystemStatus(prev => ({
          ...prev,
          backend:          healthData?.backend === 'healthy' ? 'online' : onlineToStatus(isConnected),
          database:         healthData?.database === 'connected' ? 'online' : 'offline',
          esp32:            esp32IsOnline ? onlineToStatus(true) : prev.esp32,
          esp32Cam:         esp32CamIsOnline ? onlineToStatus(true) : prev.esp32Cam,
          esp32LastSeen:    esp32Status?.lastSeen || null,
          esp32CamLastSeen: esp32CamStatus?.lastSeen || null,
          lastUpdated:      new Date().toISOString(),
        }));
      } catch (error) {
        console.error('[App] Failed to fetch initial data:', error);
        setSystemStatus(prev => ({ ...prev, backend: onlineToStatus(isConnected), database: 'offline', esp32: 'offline', esp32Cam: 'offline', esp32LastSeen: null, esp32CamLastSeen: null, lastUpdated: new Date().toISOString() }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 11_000);
    return () => {
      clearInterval(interval);
      if (esp32OfflineTimeout)    clearTimeout(esp32OfflineTimeout);
      if (esp32CamOfflineTimeout) clearTimeout(esp32CamOfflineTimeout);
    };
  }, []);

  // ── Watering & Config handlers ─────────────────────────────────────────
  const handleStartWatering = async () => {
    try { await wateringAPI.start(); showNotification('Watering command sent', 'success'); }
    catch { showNotification('Failed to start watering', 'error'); }
  };
  const handleStopWatering = async () => {
    try { await wateringAPI.stop(); showNotification('Stop command sent', 'success'); }
    catch { showNotification('Failed to stop watering', 'error'); }
  };
  const handleSaveMoistureThreshold = async () => {
    setIsThresholdSaving(true);
    try { await configAPI.update('ESP32-SENSOR', { soilMoistureThreshold: moistureThreshold }); showNotification('Moisture threshold saved', 'success'); }
    catch { showNotification('Failed to save moisture threshold', 'error'); }
    finally { setIsThresholdSaving(false); }
  };
  const handleSaveAiControls = async () => {
    setIsAiControlSaving(true);
    try { await configAPI.update('ESP32-SENSOR', { plantGrowthEnabled, plantGrowthStage, aiInsightsMode }); showNotification('Growth and AI insight settings saved', 'success'); }
    catch { showNotification('Failed to save growth and AI settings', 'error'); }
    finally { setIsAiControlSaving(false); }
  };

  const showNotification = (message, type = 'info') => setNotification({ message, type });
  const closeNotification = () => setNotification({ message: '', type: 'info' });
  const handleClearAlert    = useCallback((id) => setAlerts(prev => prev.filter(a => a.id !== id)), []);
  const handleClearAllAlerts = useCallback(() => setAlerts([]), []);

  // ── Render ─────────────────────────────────────────────────────────────

  // Admin routes render WITHOUT sidebar/navbar (full-screen standalone)
  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/panel" element={
            <ProtectedAdminRoute>
              <AdminPanelPage />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </AdminAuthProvider>
    );
  }

  return (
    <AdminAuthProvider>
      <div className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

        {!isSidebarCollapsed && isMobile && (
          <div className="sidebar-overlay" onClick={closeSidebar} />
        )}

        {/* ── Fixed sidebar ───────────────────────────────────────────── */}
        <aside className="sidebar" role="navigation" aria-label="Main navigation">
          <div className="sidebar-brand">
            <img src="/assets/icon.svg" className="sidebar-brand-icon" alt="SproutSense logo" />
            <span className="sidebar-brand-text">SproutSense</span>
          </div>

          <nav className="sidebar-nav">
            {sidebarCategories.map((category) => (
              <div key={category.label} className="sidebar-category">
                <span className="sidebar-cat-label">{category.label}</span>
                {category.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    title={isSidebarCollapsed ? item.label : ''}
                    onClick={closeSidebar}
                  >
                    <span className="sidebar-icon-wrap">
                      <GlassIcon name={item.icon} className="sidebar-icon" />
                      {item.path === '/alerts' && alerts.length > 0 && (
                        <span className="sidebar-badge">{alerts.length}</span>
                      )}
                      {item.path === '/backend' && (
                        <span className={`sidebar-status-dot ${systemStatus.backend}`} />
                      )}
                      {item.path === '/esp32' && (
                        <span className={`sidebar-status-dot ${
                          systemStatus.esp32Cam === 'online' || systemStatus.esp32 === 'online' ? 'online' : 'offline'
                        }`} />
                      )}
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-system-status">
            {[['Backend', systemStatus.backend], ['ESP32', systemStatus.esp32], ['ESP32-CAM', systemStatus.esp32Cam]]
              .map(([label, status]) => (
                <div key={label} className="sidebar-system-row">
                  <span className="sidebar-system-label">{label}</span>
                  <span className={`sidebar-system-pill ${status}`}>{statusLabel(status)}</span>
                </div>
              ))}
          </div>
        </aside>

        {/* ── Main content area ─────────────────────────────────────── */}
        <div className="container">
          <Navbar
            currentPage={pageTitle}
            isMobile={isMobile}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            theme={theme}
            toggleTheme={toggleTheme}
            alertCount={alerts.length}
            isConnected={isConnected}
          />

          {notification.message && (
            <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
          )}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)', color: '#f0fdf4', border: '1px solid rgba(255,255,255,0.1)' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#050d14' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#050d14' } },
            }}
          />

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/home" replace />} />

              <Route path="/home" element={
                <PageWrapper><HomePage theme={theme} sensors={sensors} isConnected={isConnected} /></PageWrapper>
              } />

              <Route path="/backend" element={
                <PageWrapper>
                  <section className="dashboard-section">
                    <div className="dashboard dashboard-single">
                      <div className="card">
                        <h2 className="card-title"><GlassIcon name="server" className="card-title-icon" /> Backend Status</h2>
                        <div className="status-grid">
                          {[['server', 'API Server', systemStatus.backend], ['database', 'Database', systemStatus.database]]
                            .map(([icon, label, status]) => (
                              <div key={label} className="status-item">
                                <div className="status-item-header"><GlassIcon name={icon} /><span className="status-item-label">{label}</span></div>
                                <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </PageWrapper>
              } />

              <Route path="/esp32" element={
                <PageWrapper>
                  <section className="dashboard-section">
                    <div className="dashboard dashboard-single">
                      <div className="card">
                        <h2 className="card-title"><GlassIcon name="esp32" className="card-title-icon" /> ESP32 Device Status</h2>
                        <div className="status-grid">
                          <div className="status-item">
                            <div className="status-item-header"><GlassIcon name="esp32" /><span className="status-item-label">ESP32 Sensor Board</span></div>
                            <div><span className={`status-badge status-${systemStatus.esp32}`}>{statusLabel(systemStatus.esp32)}</span><div className="status-subtext">Last seen: {formatLastSeen(systemStatus.esp32LastSeen)}</div></div>
                          </div>
                          <div className="status-item">
                            <div className="status-item-header"><GlassIcon name="image" /><span className="status-item-label">ESP32-CAM</span></div>
                            <div><span className={`status-badge status-${systemStatus.esp32Cam}`}>{statusLabel(systemStatus.esp32Cam)}</span><div className="status-subtext">Last seen: {formatLastSeen(systemStatus.esp32CamLastSeen)}</div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </PageWrapper>
              } />

              <Route path="/sensors" element={
                <PageWrapper>
                  <section className="dashboard-section dashboard-section-wide">
                    <div className="dashboard dashboard-single dashboard-wide">
                      <SensorCard sensors={sensors} isConnected={isConnected} />
                    </div>
                  </section>
                </PageWrapper>
              } />

              <Route path="/analytics" element={
                <PageWrapper><section className="dashboard-section"><AnalyticsPage /></section></PageWrapper>
              } />

              <Route path="/alerts" element={
                <PageWrapper>
                  <section className="dashboard-section">
                    <AlertsPage alerts={alerts} sensors={sensors} onClearAlert={handleClearAlert} onClearAllAlerts={handleClearAllAlerts} />
                  </section>
                </PageWrapper>
              } />

              <Route path="/controls" element={
                <PageWrapper>
                  <section className="dashboard-section dashboard-section-wide">
                    <div className="dashboard dashboard-single dashboard-wide">
                      <ControlCard
                        pumpActive={pumpActive} onStartWatering={handleStartWatering} onStopWatering={handleStopWatering}
                        moistureThreshold={moistureThreshold} onMoistureThresholdChange={setMoistureThreshold}
                        onSaveMoistureThreshold={handleSaveMoistureThreshold} isThresholdSaving={isThresholdSaving}
                        plantGrowthEnabled={plantGrowthEnabled} onPlantGrowthEnabledChange={setPlantGrowthEnabled}
                        plantGrowthStage={plantGrowthStage} onPlantGrowthStageChange={setPlantGrowthStage}
                        aiInsightsMode={aiInsightsMode} onAiInsightsModeChange={setAiInsightsMode}
                        onSaveAiControls={handleSaveAiControls} isAiControlSaving={isAiControlSaving}
                        sensors={sensors} onNotification={showNotification}
                      />
                    </div>
                  </section>
                </PageWrapper>
              } />

              <Route path="/ai" element={
                <PageWrapper><section className="dashboard-section"><AIChat sensors={sensors} /></section></PageWrapper>
              } />

              <Route path="/insights" element={
                <PageWrapper><section className="dashboard-section"><InsightsPage /></section></PageWrapper>
              } />

              <Route path="/config" element={
                <PageWrapper>
                  <section className="dashboard-section">
                    <div className="dashboard dashboard-single">
                      <ConfigCard onNotification={showNotification} systemStatus={systemStatus} />
                    </div>
                  </section>
                </PageWrapper>
              } />

              <Route path="/settings" element={
                <PageWrapper>
                  <section className="dashboard-section">
                    <SettingsPage theme={theme} toggleTheme={toggleTheme} onNotification={showNotification} />
                  </section>
                </PageWrapper>
              } />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </AdminAuthProvider>
  );
}

export default App;
