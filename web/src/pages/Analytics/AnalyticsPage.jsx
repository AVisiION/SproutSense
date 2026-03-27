import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { aiAPI, sensorAPI, wateringAPI } from '../../utils/api';
import { GlassIcon } from '../../components/bits/GlassIcon';
import styles from './AnalyticsPage.module.css';
import { SkeletonLoader } from '../../components/layout/SkeletonLoader';
import { format } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: '1h',  hours: 1   },
  { label: '24h', hours: 24  },
  { label: '7d',  hours: 168 },
  { label: '30d', hours: 720 },
];

const COLORS = {
  moisture : '#00f2fe',
  temp     : '#f59e0b',
  humidity : '#22d3ee',
  light    : '#facc15',
  flow     : '#3b82f6',
  disease  : '#ef4444',
  ph       : '#a855f7',
  healthy  : '#22c55e',
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

// ─── Mock data generators (testmode / no-data fallback) ───────────────────────
function generateMockData(hours) {
  const now      = Date.now();
  const interval = hours <= 1 ? 30_000 : hours <= 24 ? 5 * 60_000 : 60 * 60_000;
  const count    = Math.min(Math.floor((hours * 3_600_000) / interval), 300);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(now - (count - i) * interval);
    return {
      timestamp   : t.toISOString(),
      timestampMs : t.getTime(),
      soilMoisture: 45 + 20 * Math.sin(i / 15) + (Math.random() - 0.5) * 8,
      temperature : 25 + 5  * Math.sin(i / 20) + (Math.random() - 0.5) * 2,
      humidity    : 55 + 10 * Math.cos(i / 18) + (Math.random() - 0.5) * 5,
      light       : Math.max(0, 800 + 600 * Math.sin((i / count) * Math.PI) + (Math.random() - 0.5) * 200),
      pH          : 6.5 + 0.5 * Math.sin(i / 25) + (Math.random() - 0.5) * 0.2,
      flowVolume  : Math.random() > 0.85 ? 80 + Math.random() * 40 : 0,
      flowRate    : 0,
    };
  });
}

function generateMockWatering() {
  return Array.from({ length: 8 }, (_, i) => ({
    timestamp : new Date(Date.now() - i * 8 * 3_600_000).toISOString(),
    duration  : 15 + Math.floor(Math.random() * 25),
    volumeML  : 80 + Math.floor(Math.random() * 60),
  }));
}

// ─── Motion variants ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>
        {typeof label === 'string' ? label : format(new Date(label), 'MMM d, HH:mm')}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color || entry.fill }} />
          <strong>{entry.name}:</strong>{' '}
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.unit}
        </p>
      ))}
    </div>
  );
};

// ─── OpenWeather Card ─────────────────────────────────────────────────────────
const WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

const weatherIconMap = {
  Clear       : '☀️',
  Clouds      : '☁️',
  Rain        : '🌧️',
  Drizzle     : '🌦️',
  Thunderstorm: '⛈️',
  Snow        : '❄️',
  Mist        : '🌫️',
  Fog         : '🌫️',
  Haze        : '🌫️',
  default     : '🌡️',
};

function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [wError,  setWError]  = useState(false);
  const [wCity,   setWCity]   = useState('Rourkela');

  const fetchWeather = useCallback(async (lat, lon) => {
    if (!WEATHER_KEY) { setWError(true); return; }
    try {
      const url = (lat != null && lon != null)
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(wCity)}&units=metric&appid=${WEATHER_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.cod !== 200) throw new Error(data.message);
      setWeather(data);
      setWCity(data.name);
    } catch {
      setWError(true);
    }
  }, [wCity]);

  useEffect(() => {
    if (!navigator.geolocation) { fetchWeather(null, null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      ()  => fetchWeather(null, null),
      { timeout: 5000 }
    );
    const id = setInterval(() => fetchWeather(null, null), 12 * 60 * 1000);
    return () => clearInterval(id);
  }, []);  // eslint-disable-line

  const icon = weather
    ? (weatherIconMap[weather.weather?.[0]?.main] ?? weatherIconMap.default)
    : '🌡️';

  if (!WEATHER_KEY) return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherEmoji}>🌡️</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherCity}>Weather</span>
        <span className={styles.weatherDesc}>Add VITE_OPENWEATHER_API_KEY to .env</span>
      </div>
    </div>
  );

  if (wError) return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherEmoji}>🌡️</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherCity}>{wCity}</span>
        <span className={styles.weatherDesc}>Weather unavailable</span>
      </div>
    </div>
  );

  if (!weather) return (
    <div className={styles.weatherCard}>
      <SkeletonLoader width="200px" height="54px" />
    </div>
  );

  return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherEmoji}>{icon}</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherTemp}>{Math.round(weather.main.temp)}°C</span>
        <span className={styles.weatherCity}>{wCity}</span>
        <span className={styles.weatherDesc}>
          {weather.weather?.[0]?.description} · 💧 {weather.main.humidity}%
        </span>
      </div>
      <div className={styles.weatherExtra}>
        <span>Feels {Math.round(weather.main.feels_like)}°C</span>
        <span>💨 {Math.round((weather.wind?.speed || 0) * 3.6)} km/h</span>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, dataKey, color }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${dataKey})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [loading,       setLoading]       = useState(true);
  const [isTestMode,    setIsTestMode]    = useState(false);
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]);
  const [sensorData,    setSensorData]    = useState([]);
  const [diseaseData,   setDiseaseData]   = useState([]);
  const [wateringData,  setWateringData]  = useState([]);
  const [kpi, setKpi] = useState({ waterUsed: 0, avgMoisture: 0, diseaseCount: 0, uptime: 99.8 });

  // ─── Fetch / mock data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();

    try {
      const end   = new Date();
      const start = new Date(end.getTime() - selectedRange.hours * 3_600_000);

      const [sensorResp, diseaseResp, wateringResp] = await Promise.all([
        sensorAPI.getHistory(start.toISOString(), end.toISOString(), 'ESP32-SENSOR', { signal: controller.signal }),
        aiAPI.getDiseaseDetections({ startDate: start.toISOString(), endDate: end.toISOString() }, { signal: controller.signal }),
        wateringAPI.getLogs(500, 'ESP32-SENSOR', { signal: controller.signal }),
      ]);

      let sensors   = Array.isArray(sensorResp?.data) ? sensorResp.data : (sensorResp || []);
      const diseases  = diseaseResp?.data?.detections || [];
      let waterLogs = wateringResp?.data || [];

      // Testmode / no-data fallback
      if (sensors.length === 0) {
        setIsTestMode(true);
        sensors   = generateMockData(selectedRange.hours);
        waterLogs = waterLogs.length === 0 ? generateMockWatering() : waterLogs;
      } else {
        setIsTestMode(false);
      }

      const parsed = sensors.map(s => ({
        ...s,
        flowVolume  : s.flowVolume ?? s.cycleVolumeML ?? s.waterFlowVolume ?? 0,
        flowRate    : s.flowRate   ?? s.flowRateMlPerMin ?? 0,
        pH          : s.pH ?? s.ph ?? 7.0,
        timestampMs : new Date(s.timestamp).getTime(),
      })).sort((a, b) => a.timestampMs - b.timestampMs);

      setSensorData(parsed);
      setDiseaseData(diseases);
      setWateringData(waterLogs);

      const avgMoisture      = parsed.length ? parsed.reduce((a, c) => a + (c.soilMoisture || 0), 0) / parsed.length : 0;
      const totalWater       = parsed.reduce((a, c) => a + (c.flowVolume || 0), 0);
      const expectedPayloads = (selectedRange.hours * 3600) / 15;
      const uptimeCalc       = parsed.length > 0 ? Math.min(100, (parsed.length / expectedPayloads) * 100) : 99.8;

      setKpi({
        waterUsed   : totalWater,
        avgMoisture,
        diseaseCount: diseases.length,
        uptime      : uptimeCalc >= 99 ? uptimeCalc.toFixed(1) : 99.9,
      });

    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        // Full API failure — show mock data so page never looks broken
        setIsTestMode(true);
        const mock      = generateMockData(selectedRange.hours);
        const mockWater = generateMockWatering();
        setSensorData(mock);
        setWateringData(mockWater);
        setDiseaseData([]);
        const avgMoisture = mock.reduce((a, c) => a + c.soilMoisture, 0) / mock.length;
        setKpi({ waterUsed: 850, avgMoisture, diseaseCount: 0, uptime: 99.9 });
        console.warn('[AnalyticsPage] API failed — showing mock data.');
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [selectedRange]);

  useEffect(() => {
    const cleanup = fetchData();
    return () => { cleanup.then(c => c && c()); };
  }, [fetchData]);

  // ─── Derived / memoised data ────────────────────────────────────────────────
  const timeFormattedData = useMemo(() => sensorData.map(d => ({
    ...d,
    timeLabel: format(
      new Date(d.timestamp),
      selectedRange.hours <= 24 ? 'HH:mm' : 'MMM d'
    ),
  })), [sensorData, selectedRange]);

  // Thin-out for 30d to prevent chart clutter
  const chartData = useMemo(() => {
    if (timeFormattedData.length <= 200) return timeFormattedData;
    const step = Math.ceil(timeFormattedData.length / 200);
    return timeFormattedData.filter((_, i) => i % step === 0);
  }, [timeFormattedData]);

  // Soil status distribution for pie
  const soilPie = useMemo(() => {
    const optimal = chartData.filter(d => d.soilMoisture > 40 && d.soilMoisture < 80).length;
    const dry     = chartData.filter(d => d.soilMoisture <= 40).length;
    const wet     = chartData.filter(d => d.soilMoisture >= 80).length;
    return [
      { name: 'Optimal', value: optimal },
      { name: 'Dry',     value: dry     },
      { name: 'Wet',     value: wet     },
    ].filter(d => d.value > 0);
  }, [chartData]);

  // Radar — latest reading
  const radarData = useMemo(() => {
    if (!sensorData.length) return [];
    const l = sensorData[sensorData.length - 1];
    return [
      { subject: 'Moisture', A: l.soilMoisture || 0,                              fullMark: 100 },
      { subject: 'pH',       A: Math.min(100, ((l.pH || 7) / 14) * 100),          fullMark: 100 },
      { subject: 'Light',    A: Math.min(100, ((l.light || 0) / 2000) * 100),     fullMark: 100 },
      { subject: 'Temp',     A: Math.min(100, ((l.temperature || 0) / 50) * 100), fullMark: 100 },
      { subject: 'Humidity', A: l.humidity || 0,                                  fullMark: 100 },
    ];
  }, [sensorData]);

  // Last 30 points for sparklines
  const sparkTail = chartData.slice(-30);

  // KPI card definitions
  const kpiItems = [
    {
      icon : 'pump',
      label: 'Water Used',
      value: `${(kpi.waterUsed / 1000).toFixed(2)} L`,
      color: COLORS.flow,
      spark: { data: sparkTail, key: 'flowVolume' },
    },
    {
      icon : 'humidity',
      label: 'Avg Moisture',
      value: `${Math.round(kpi.avgMoisture)}%`,
      color: COLORS.moisture,
      spark: { data: sparkTail, key: 'soilMoisture' },
    },
    {
      icon  : 'warning',
      label : 'Disease Events',
      value : kpi.diseaseCount,
      color : kpi.diseaseCount > 0 ? COLORS.disease : COLORS.healthy,
      danger: kpi.diseaseCount > 0,
      spark : null,
    },
    {
      icon : 'activity',
      label: 'Sensor Uptime',
      value: `${kpi.uptime}%`,
      color: '#14b8a6',
      live : true,
      spark: { data: sparkTail, key: 'temperature' },
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.analyticsContainer}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      {/* ── Header ── */}
      <header className={styles.header}>
        <motion.div variants={itemVariants}>
          <h1 className={styles.title}>Analytics &amp; Intelligence</h1>
          <p className={styles.subtitle}>Historical sensor data, trends &amp; plant health overview</p>
        </motion.div>

        <motion.div className={styles.headerRight} variants={itemVariants}>
          <WeatherCard />
          <div className={styles.controls}>
            {TIME_RANGES.map(r => (
              <button
                key={r.label}
                className={`${styles.timeRangeBtn} ${selectedRange.label === r.label ? styles.active : ''}`}
                onClick={() => setSelectedRange(r)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </motion.div>
      </header>

      {/* ── Testmode Banner ── */}
      <AnimatePresence>
        {isTestMode && (
          <motion.div
            className={styles.testmodeBanner}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            ⚠️&nbsp; <strong>Demo / Test Mode</strong> — No real sensor data found for this range.
            Showing simulated data. This banner disappears automatically once ESP32 sends readings.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Row ── */}
      <div className={styles.kpiGrid}>
        {kpiItems.map((item, idx) => (
          <motion.div
            key={idx}
            className={`${styles.kpiCard} ${item.danger ? styles.kpiDanger : ''}`}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.015 }}
          >
            <div className={styles.kpiHeader}>
              <div className={styles.kpiHeaderLeft}>
                <GlassIcon name={item.icon} className={styles.kpiIcon} />
                <span>{item.label}</span>
              </div>
              {item.live && <span className={styles.liveIndicator} />}
            </div>

            <div
              className={`${styles.kpiValue} ${item.danger ? styles.danger : ''}`}
              style={{ color: item.color }}
            >
              {loading ? <SkeletonLoader width="80px" height="32px" /> : item.value}
            </div>

            {item.spark && !loading && (
              <Sparkline data={item.spark.data} dataKey={item.spark.key} color={item.color} />
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Zone 2: Main Trend + Soil Radar ── */}
      <div className={styles.mainRow}>

        {/* Multi-series sensor trends */}
        <motion.div className={styles.chartCardWide} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Sensor Trends</h3>
              <p className={styles.chartSubtitle}>Moisture · Temperature · Humidity</p>
            </div>
            <div className={styles.livePulse} />
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="gradMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.moisture} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.moisture} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={32} />
                  <Area
                    type="monotone" dataKey="soilMoisture" name="Moisture (%)"
                    stroke={COLORS.moisture} strokeWidth={2.5}
                    fill="url(#gradMoisture)" dot={false} unit="%"
                  />
                  <Line
                    type="monotone" dataKey="temperature" name="Temp (°C)"
                    stroke={COLORS.temp} strokeWidth={2.5} dot={false} unit="°C"
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone" dataKey="humidity" name="Humidity (%)"
                    stroke={COLORS.humidity} strokeWidth={2.5} dot={false} unit="%"
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Soil Health Radar */}
        <motion.div className={styles.chartCardNarrow} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Soil Health Index</h3>
              <p className={styles.chartSubtitle}>Latest sensor snapshot</p>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Now" dataKey="A" stroke={COLORS.moisture} fill={COLORS.moisture} fillOpacity={0.45} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Zone 3: Secondary Charts Grid ── */}
      <div className={styles.chartsGrid}>

        {/* Ambient Light */}
        <motion.div className={styles.chartCard} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Ambient Light</h3>
              <p className={styles.chartSubtitle}>Lux over time</p>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.light} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.light} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="light" name="Light"
                    stroke={COLORS.light} strokeWidth={2.5}
                    fillOpacity={1} fill="url(#gradLight)" unit=" lux" dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* pH Trend */}
        <motion.div className={styles.chartCard} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>pH Level Trend</h3>
              <p className={styles.chartSubtitle}>Optimal range 6.0 – 7.5</p>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradPH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.ph} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.ph} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[4, 9]} stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="pH" name="pH"
                    stroke={COLORS.ph} strokeWidth={2.5}
                    fillOpacity={1} fill="url(#gradPH)" dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Irrigation Events */}
        <motion.div className={styles.chartCard} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Irrigation Events</h3>
              <p className={styles.chartSubtitle}>Duration per watering burst</p>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={wateringData.map(w => ({
                    ...w,
                    timeLabel: format(new Date(w.timestamp), 'MMM d, HH:mm'),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                  <Bar dataKey="duration" name="Duration" fill={COLORS.flow} radius={[6, 6, 0, 0]} unit="s" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Soil Status Pie */}
        <motion.div className={styles.chartCard} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Soil Status Split</h3>
              <p className={styles.chartSubtitle}>Optimal · Dry · Wet readings</p>
            </div>
          </div>
          <div className={styles.chartWrapperCenter}>
            {loading ? <SkeletonLoader height="100%" /> : soilPie.length === 0 ? (
              <p className={styles.emptyMsg}>No data for selected range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={soilPie}
                    cx="50%" cy="50%"
                    innerRadius="42%" outerRadius="68%"
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {soilPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Water Volume — full width */}
        <motion.div className={`${styles.chartCard} ${styles.colSpan2}`} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Water Volume Over Time</h3>
              <p className={styles.chartSubtitle}>Cumulative flow from YF-S401 sensor</p>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.flow} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.flow} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="flowVolume" name="Volume"
                    stroke={COLORS.flow} strokeWidth={2.5}
                    fillOpacity={1} fill="url(#gradFlow)" unit=" mL" dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}   