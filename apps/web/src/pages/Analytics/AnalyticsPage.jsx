import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { aiAPI, sensorAPI, wateringAPI } from '../../utils/api';
import { getAnalyticsSensors, getSensorValue, getStatusForValue } from '../../utils/sensorRegistry';
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

const CHART_COLORS = ['#00f2fe', '#f59e0b', '#22d3ee', '#facc15', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];

function colorForSensor(sensorKey, index = 0) {
  if (sensorKey?.toLowerCase().includes('moisture')) return COLORS.moisture;
  if (sensorKey?.toLowerCase().includes('temp')) return COLORS.temp;
  if (sensorKey?.toLowerCase().includes('humid')) return COLORS.humidity;
  if (sensorKey?.toLowerCase().includes('light')) return COLORS.light;
  if (sensorKey?.toLowerCase().includes('flow')) return COLORS.flow;
  if (sensorKey?.toLowerCase().includes('ph')) return COLORS.ph;
  return CHART_COLORS[index % CHART_COLORS.length];
}



const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

function formatTooltipLabel(label) {
  if (typeof label === 'string') return label;
  if (label == null) return 'Unknown time';

  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return format(date, 'MMM d, HH:mm');
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.tooltipLabel}>
        {formatTooltipLabel(label)}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color || entry.fill }} />
          <strong>{entry.name}:</strong>&nbsp;
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.unit}
        </p>
      ))}
    </div>
  );
};

const WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

const weatherIconMap = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
  default: '🌡️',
};

function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [wError, setWError] = useState(false);
  const [wCity, setWCity] = useState('Rourkela');

  const fetchWeather = useCallback(async (lat, lon) => {
    if (!WEATHER_KEY) { setWError(true); return; }
    try {
      const url = (lat != null && lon != null)
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(wCity)}&units=metric&appid=${WEATHER_KEY}`;
      const res = await fetch(url);
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
      () => fetchWeather(null, null),
      { timeout: 5000 }
    );
    const id = setInterval(() => fetchWeather(null, null), 12 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = weather ? (weatherIconMap[weather.weather?.[0]?.main] ?? weatherIconMap.default) : '🌡️';

  if (!WEATHER_KEY) {
    return (
      <div className={styles.weatherCard}>
        <span className={styles.weatherEmoji}>🌡️</span>
        <div className={styles.weatherInfo}>
          <span className={styles.weatherCity}>Weather</span>
          <span className={styles.weatherDesc}>Add VITE_OPENWEATHER_API_KEY to .env</span>
        </div>
      </div>
    );
  }

  if (wError) {
    return (
      <div className={styles.weatherCard}>
        <span className={styles.weatherEmoji}>🌡️</span>
        <div className={styles.weatherInfo}>
          <span className={styles.weatherCity}>{wCity}</span>
          <span className={styles.weatherDesc}>Weather unavailable</span>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={styles.weatherCard}>
        <SkeletonLoader width="200px" height="54px" />
      </div>
    );
  }

  return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherEmoji}>{icon}</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherTemp}>{Math.round(weather.main.temp)}°C</span>
        <span className={styles.weatherCity}>{wCity}</span>
        <span className={styles.weatherDesc}>{weather.weather?.[0]?.description} · 💧 {weather.main.humidity}%</span>
      </div>
      <div className={styles.weatherExtra}>
        <span>Feels {Math.round(weather.main.feels_like)}°C</span>
        <span>💨 {Math.round((weather.wind?.speed || 0) * 3.6)} km/h</span>
      </div>
    </div>
  );
}

function Sparkline({ data, dataKey, color }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#spark-${dataKey})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [loading,       setLoading]       = useState(true);
  
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]);
  const [sensorData,    setSensorData]    = useState([]);
  const [diseaseData,   setDiseaseData]   = useState([]);
  const [wateringData,  setWateringData]  = useState([]);
  const [sensorConfigs, setSensorConfigs] = useState([]);
  const [activeSensorId, setActiveSensorId] = useState('');
  const [kpi, setKpi] = useState({ waterUsed: 0, avgMoisture: 0, diseaseCount: 0, uptime: 0 });

  useEffect(() => {
    const loadSensors = () => {
      const configured = getAnalyticsSensors();
      setSensorConfigs(configured);
      if (!configured.some(s => s.id === activeSensorId)) {
        setActiveSensorId(configured[0]?.id || '');
      }
    };

    loadSensors();
    window.addEventListener('storage', loadSensors);
    return () => window.removeEventListener('storage', loadSensors);
  }, [activeSensorId]);

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

      // No mock data generation fallback anymore
      setIsTestMode(false);

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
      const expectedPayloads = (selectedRange.hours * 3600) / 15; // Assuming payload every 15s
      const uptimeCalc       = parsed.length > 0 ? Math.min(100, (parsed.length / expectedPayloads) * 100) : 0;

      setKpi({
        waterUsed   : totalWater,
        avgMoisture,
        diseaseCount: diseases.length,
        uptime      : uptimeCalc.toFixed(1),
      });

    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        console.warn('[AnalyticsPage] API failed: ', e);
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

  const selectedSensor = useMemo(() => {
    if (!sensorConfigs.length) return null;
    return sensorConfigs.find(s => s.id === activeSensorId) || sensorConfigs[0];
  }, [sensorConfigs, activeSensorId]);

  const selectedSeries = useMemo(() => {
    if (!selectedSensor) {
      return { key: 'soilMoisture', label: 'Sensor', unit: '', color: COLORS.moisture, chartType: 'line' };
    }
    return {
      key: selectedSensor.key,
      label: selectedSensor.name,
      unit: selectedSensor.unit || '',
      color: colorForSensor(selectedSensor.key, sensorConfigs.findIndex(s => s.id === selectedSensor.id)),
      chartType: selectedSensor.chartType || 'line',
    };
  }, [selectedSensor, sensorConfigs]);

  const trendStats = useMemo(() => {
    const values = chartData
      .map(d => getSensorValue(d, selectedSensor))
      .filter(v => Number.isFinite(v));

    if (!values.length) {
      return { min: 0, max: 0, avg: 0, delta: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const delta = values[values.length - 1] - values[0];
    return { min, max, avg, delta };
  }, [chartData, selectedSensor]);

  const currentSensorValue = useMemo(() => {
    if (!selectedSensor || !sensorData.length) return null;
    return getSensorValue(sensorData[sensorData.length - 1], selectedSensor);
  }, [sensorData, selectedSensor]);

  const selectedSensorStatus = useMemo(
    () => getStatusForValue(selectedSensor, currentSensorValue),
    [selectedSensor, currentSensorValue]
  );

  const sensorAnomalyCount = useMemo(() => {
    if (!selectedSensor) return 0;
    return chartData.reduce((count, row) => {
      const value = getSensorValue(row, selectedSensor);
      if (value == null) return count;
      const outOfRange = value < Number(selectedSensor.minThreshold) || value > Number(selectedSensor.maxThreshold);
      return outOfRange ? count + 1 : count;
    }, 0);
  }, [chartData, selectedSensor]);

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

  const selectedSeriesData = useMemo(() => {
    if (!selectedSensor) return [];
    return chartData
      .map(item => ({ ...item, metricValue: getSensorValue(item, selectedSensor) }))
      .filter(item => item.metricValue != null);
  }, [chartData, selectedSensor]);

  const recommendation = useMemo(() => {
    if (!selectedSensor) return 'No configured sensor available for analytics.';
    if (selectedSensorStatus.level === 'critical') {
      return `Critical reading detected for ${selectedSensor.name}. Investigate irrigation, sensor calibration, or environment controls immediately.`;
    }
    if (selectedSensorStatus.level === 'warning') {
      return `${selectedSensor.name} is near threshold limits. Monitor closely and prepare a corrective action if the trend continues.`;
    }
    if (Math.abs(trendStats.delta) > (Number(selectedSensor.warningThreshold || 1) * 0.25)) {
      return `${selectedSensor.name} is trending ${trendStats.delta > 0 ? 'upward' : 'downward'} quickly. Consider adjusting schedules or setpoints.`;
    }
    return `${selectedSensor.name} is stable in the normal operating band. Continue standard monitoring cadence.`;
  }, [selectedSensor, selectedSensorStatus, trendStats]);

  const renderDynamicSensorChart = () => {
    if (!selectedSensor || selectedSeriesData.length === 0) {
      return <p className={styles.emptyMsg}>No readings available for selected sensor.</p>;
    }

    const unitSuffix = selectedSeries.unit ? ` ${selectedSeries.unit}` : '';

    if (selectedSeries.chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={selectedSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="metricValue" name={selectedSeries.label} fill={selectedSeries.color} radius={[6, 6, 0, 0]} unit={unitSuffix} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (selectedSeries.chartType === 'gauge' || selectedSeries.chartType === 'scorecard' || selectedSeries.chartType === 'status') {
      const min = Number(selectedSensor.minThreshold || 0);
      const max = Number(selectedSensor.maxThreshold || 100);
      const value = Number(currentSensorValue ?? 0);
      const normalized = Math.max(0, Math.min(100, ((value - min) / Math.max(1, max - min)) * 100));
      return (
        <div className={styles.statusPanel}>
          <div className={styles.statusValue} style={{ color: selectedSensorStatus.color }}>
            {value.toFixed(1)}{unitSuffix}
          </div>
          <div className={styles.statusBarTrack}>
            <div className={styles.statusBarFill} style={{ width: `${normalized}%`, background: selectedSensorStatus.color }} />
          </div>
          <div className={styles.statusMeta}>
            <span>Min {min}</span>
            <span>Status: {selectedSensorStatus.label}</span>
            <span>Max {max}</span>
          </div>
        </div>
      );
    }

    if (selectedSeries.chartType === 'table') {
      const tail = selectedSeriesData.slice(-10).reverse();
      return (
        <div className={styles.tableWrap}>
          <table className={styles.metricTable}>
            <thead>
              <tr><th>Time</th><th>{selectedSeries.label}</th></tr>
            </thead>
            <tbody>
              {tail.map((row) => (
                <tr key={row.timestamp}>
                  <td>{row.timeLabel}</td>
                  <td>{Number(row.metricValue).toFixed(2)}{unitSuffix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedSeries.chartType === 'sparkline') {
      return <Sparkline data={selectedSeriesData.slice(-50)} dataKey="metricValue" color={selectedSeries.color} />;
    }

    if (selectedSeries.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={selectedSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="metricValue" name={selectedSeries.label} stroke={selectedSeries.color} strokeWidth={2.7} dot={false} unit={unitSuffix} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={selectedSeriesData}>
          <defs>
            <linearGradient id="gradActiveSensor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={selectedSeries.color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={selectedSeries.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="metricValue" name={selectedSeries.label} stroke={selectedSeries.color} strokeWidth={2.7} fill="url(#gradActiveSensor)" dot={false} unit={unitSuffix} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.analyticsContainer}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      

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

      {/* ── Dynamic Sensor Analytics ── */}
      <div className={styles.mainRow}>
        <motion.div className={styles.chartCardWide} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Sensor Analysis</h3>
              <p className={styles.chartSubtitle}>Chart and thresholds are driven by Admin sensor configuration</p>
            </div>
            <div className={styles.sensorSwitcher}>
              {sensorConfigs.map((sensor, index) => {
                const color = colorForSensor(sensor.key, index);
                return (
                  <button
                    key={sensor.id}
                    className={`${styles.sensorSwitchBtn} ${activeSensorId === sensor.id ? styles.activeSensorBtn : ''}`}
                    onClick={() => setActiveSensorId(sensor.id)}
                    style={activeSensorId === sensor.id ? { borderColor: color, color } : undefined}
                  >
                    {sensor.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.chartWrapper}>
            {loading ? <SkeletonLoader height="100%" /> : renderDynamicSensorChart()}
          </div>

          {!loading && selectedSensor && (
            <>
              <div className={styles.sensorStatsRow}>
                <div className={styles.sensorStatTile}><span>Current</span><strong>{currentSensorValue != null ? `${currentSensorValue.toFixed(1)} ${selectedSeries.unit}` : '--'}</strong></div>
                <div className={styles.sensorStatTile}><span>Status</span><strong style={{ color: selectedSensorStatus.color }}>{selectedSensorStatus.label}</strong></div>
                <div className={styles.sensorStatTile}><span>Anomalies</span><strong>{sensorAnomalyCount}</strong></div>
                <div className={styles.sensorStatTile}><span>Net Trend</span><strong className={trendStats.delta >= 0 ? styles.positiveTrend : styles.negativeTrend}>{trendStats.delta >= 0 ? '+' : ''}{trendStats.delta.toFixed(1)} {selectedSeries.unit}</strong></div>
              </div>

              <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                  <h4>Thresholds</h4>
                  <p>Min {selectedSensor.minThreshold} · Warn {selectedSensor.warningThreshold} · Critical {selectedSensor.criticalThreshold} · Max {selectedSensor.maxThreshold}</p>
                </div>
                <div className={styles.insightCard}>
                  <h4>Recommendation</h4>
                  <p>{recommendation}</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <motion.div className={styles.chartCardNarrow} variants={itemVariants}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Sensor Coverage</h3>
              <p className={styles.chartSubtitle}>Enabled analytics sensors by status</p>
            </div>
          </div>
          <div className={styles.chartWrapperCenter}>
            {sensorConfigs.length === 0 ? (
              <p className={styles.emptyMsg}>No analytics sensors configured.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sensorConfigs.reduce((acc, sensor, idx) => {
                      const value = sensorData.length ? getSensorValue(sensorData[sensorData.length - 1], sensor) : null;
                      const level = getStatusForValue(sensor, value).level;
                      const existing = acc.find((item) => item.name === level);
                      if (existing) existing.value += 1;
                      else acc.push({ name: level, value: 1, color: level === 'critical' ? '#ef4444' : level === 'warning' ? '#f59e0b' : level === 'normal' ? '#22c55e' : '#94a3b8' });
                      return acc;
                    }, [])}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="66%"
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}
                    labelLine={false}
                  >
                    {sensorConfigs.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}   