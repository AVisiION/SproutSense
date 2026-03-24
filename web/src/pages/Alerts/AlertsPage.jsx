import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlassIcon } from '../../components/bits/GlassIcon';
import styles from './AlertsPage.module.css';
import { aiAPI } from '../../utils/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SkeletonLoader } from '../../components/layout/SkeletonLoader';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from 'react-hot-toast';

function formatDiseaseName(name) {
  if (!name || name === 'healthy') return 'Healthy';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AlertsPage({ alerts = [], sensors, onClearAlert, onClearAllAlerts }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [latestDetection, setLatestDetection] = useState(null);
  
  const fetchDetections = useCallback(async () => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000); // 7 days
      
      const resp = await aiAPI.getDiseaseDetections({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 100
      });

      const detections = resp?.data?.detections || [];
      setHistory(detections);
      if (detections.length > 0) {
        setLatestDetection(detections[0]);
      }
    } catch (e) {
      console.error('Failed to fetch disease detections', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

  // WebSocket for live disease alerts
  useWebSocket((message) => {
    if (message.type === 'disease_alert') {
      const payload = message.data;
      if (payload) {
        setLatestDetection(payload);
        setHistory(prev => [payload, ...prev].slice(0, 100)); // Keep latest 100
        
        const isHealthy = payload.detectedDisease === 'healthy';
        
        toast.custom((t) => (
          <div className={`${styles.toastNotification} ${t.visible ? styles.toastVisible : ''}`}>
             <GlassIcon name={isHealthy ? 'success' : 'warning'} className={isHealthy ? styles.textSuccess : styles.textDanger} />
             <div>
               <strong>{isHealthy ? 'Plant Healthy' : 'Disease Detected!'}</strong>
               <p>{formatDiseaseName(payload.detectedDisease)} ({(payload.confidence * 100).toFixed(0)}%)</p>
             </div>
          </div>
        ));
      }
    }
  });

  const chartData = useMemo(() => {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[format(d, 'MMM dd')] = 0;
    }

    history.forEach(h => {
      const dateLabel = format(new Date(h.timestamp), 'MMM dd');
      if (days[dateLabel] !== undefined && h.detectedDisease !== 'healthy') {
        days[dateLabel]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [history]);

  const isHealthy = latestDetection?.detectedDisease === 'healthy' || !latestDetection;
  const confidencePercent = latestDetection ? Math.round(latestDetection.confidence * 100) : 100;

  return (
    <div className={styles.container}>
      {/* Top Section: Left (Latest) + Right (History) */}
      <div className={styles.topGrid}>
        
        {/* Left Panel: Latest Detection */}
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div className={styles.liveBadge}>
              <span className={styles.pulseDot}></span> Live ESP32-CAM
            </div>
          </div>

          <div className={styles.latestContent}>
            {loading ? <SkeletonLoader height="300px" borderRadius="12px" /> : (
              <>
                <div className={styles.imageWrapper}>
                  {latestDetection?.imageUrl ? (
                    <img src={latestDetection.imageUrl} alt="Plant Snapshot" className={styles.camImage} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <GlassIcon name="camera" size={48} />
                      <p>No recent image available</p>
                    </div>
                  )}
                  
                  {/* Circular Confidence Indicator overlay */}
                  <div className={styles.confidenceOverlay}>
                    <svg viewBox="0 0 36 36" className={styles.circularChart}>
                      <path className={styles.circleBg}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className={`${styles.circle} ${isHealthy ? styles.strokeSuccess : styles.strokeDanger}`}
                        strokeDasharray={`${confidencePercent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" className={styles.percentage}>{confidencePercent}%</text>
                    </svg>
                  </div>
                </div>

                <div className={styles.detectionDetails}>
                  <div className={styles.titleRow}>
                    <h2 className={styles.diseaseTitle}>{formatDiseaseName(latestDetection?.detectedDisease)}</h2>
                    <span className={`${styles.statusBadge} ${isHealthy ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {isHealthy ? 'Healthy' : 'Action Required'}
                    </span>
                  </div>
                  <p className={styles.timestamp}>
                    {latestDetection ? format(new Date(latestDetection.timestamp), 'MMM d, yyyy - HH:mm:ss') : 'Waiting for data...'}
                  </p>
                  
                  {/* System Alerts fallback from previous alerts logic */}
                  {alerts.length > 0 && (
                    <div className={styles.systemAlertsBox}>
                      <h4 className={styles.systemAlertsTitle}>System Warnings ({alerts.length})</h4>
                      <ul className={styles.systemAlertsList}>
                        {alerts.slice(0,3).map(a => (
                          <li key={a.id} className={styles.systemAlertItem}>
                            <GlassIcon name="warning" size={14} /> {a.message} ({a.value})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel: History Timeline */}
        <div className={styles.historyCard}>
          <h3 className={styles.cardTitle}>Detection History</h3>
          <div className={styles.timelineList}>
            {loading ? <SkeletonLoader height="100%" /> : history.length === 0 ? (
               <div className={styles.emptyState}>No detections in the last 7 days.</div>
            ) : (
              history.slice(0, 10).map((item, idx) => (
                <div key={item._id || idx} className={styles.timelineItem}>
                  <div className={styles.timelineIconWrapper}>
                    <GlassIcon 
                      name={item.detectedDisease === 'healthy' ? 'success' : 'alert'} 
                      className={item.detectedDisease === 'healthy' ? styles.textSuccess : styles.textDanger} 
                      size={18} 
                    />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineDisease}>{formatDiseaseName(item.detectedDisease)}</span>
                      <span className={styles.timelineConfidence}>{Math.round(item.confidence * 100)}%</span>
                    </div>
                    <span className={styles.timelineDate}>{format(new Date(item.timestamp), 'MMM d, HH:mm')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: 7-Day Trend Chart */}
      <div className={styles.bottomCard}>
        <h3 className={styles.cardTitle}>7-Day Disease Occurrences</h3>
        <div className={styles.chartWrapper}>
          {loading ? <SkeletonLoader height="100%" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="Detections" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
