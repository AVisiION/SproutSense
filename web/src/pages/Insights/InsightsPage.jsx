import { useState, useEffect } from 'react';
import { GlassIcon } from '../components/bits/GlassIcon';
import { formatDiseaseName } from '../utils/formatters';
import './InsightsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [selectedGraph, setSelectedGraph] = useState('soilMoisture');

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [days]);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/insights?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      setInsights(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ff3860',
      high: '#ff6b6b',
      medium: '#ffa94d',
      low: '#fab005',
      none: '#40c057'
    };
    return colors[severity] || '#94a3b8';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      soil_moisture: 'water',
      temperature: 'leaf',
      light: 'leaf',
      watering: 'water',
      disease: 'leaf',
      health: 'leaf'
    };
    return icons[category] || 'leaf';
  };

  const renderMiniGraph = (data, type) => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return null;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = data.slice(-20).map((point, index) => {
      const x = (index / 19) * 100;
      const y = 100 - (((point.value - min) / range) * 100);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 30" className="mini-graph">
        <polyline
          points={points}
          fill="none"
          stroke="rgba(74, 222, 128, 0.8)"
          strokeWidth="2"
        />
      </svg>
    );
  };

  const renderFullGraph = (data, type, label, unit) => {
    if (!data || data.length === 0) {
      return <div className="graph-empty">No data available</div>;
    }

    const displayData = data.slice(-50); // Show last 50 points
    const values = displayData.map(d => d.value).filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) {
      return <div className="graph-empty">No valid data</div>;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = displayData.map((point, index) => {
      const x = (index / (displayData.length - 1)) * 100;
      const y = 100 - (((point.value - min) / range) * 80);
      return `${x},${y + 10}`;
    }).join(' ');

    const areaPoints = `0,110 ${points} 100,110`;

    return (
      <div className="graph-container">
        <div className="graph-header">
          <h4>{label}</h4>
          <span className="graph-stats">
            Max: {max.toFixed(1)}{unit} | Min: {min.toFixed(1)}{unit} | Avg: {(values.reduce((a,b) => a+b, 0) / values.length).toFixed(1)}{unit}
          </span>
        </div>
        <svg viewBox="0 0 100 110" className="full-graph">
          {/* Grid lines */}
          <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <line x1="0" y1="55" x2="100" y2="55" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          
          {/* Area under curve */}
          <polygon
            points={areaPoints}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="rgba(74, 222, 128, 1)"
            strokeWidth="2"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(74, 222, 128, 0.8)" />
              <stop offset="100%" stopColor="rgba(74, 222, 128, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing plant data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-page">
        <div className="insights-error">
          <GlassIcon name="leaf" />
          <h3>Unable to load insights</h3>
          <p>{error}</p>
          <button onClick={fetchInsights} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-page">
      {/* Header */}
      <div className="insights-header">
        <div className="header-content">
          <GlassIcon name="insights" className="header-icon" />
          <div>
            <h1>Plant Insights</h1>
            <p>AI-powered analysis with Edge Impulse disease detection</p>
          </div>
        </div>
        <div className="time-selector">
          <button 
            className={days === 1 ? 'active' : ''} 
            onClick={() => setDays(1)}
          >
            24h
          </button>
          <button 
            className={days === 7 ? 'active' : ''} 
            onClick={() => setDays(7)}
          >
            7d
          </button>
          <button 
            className={days === 30 ? 'active' : ''} 
            onClick={() => setDays(30)}
          >
            30d
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      {insights?.overallHealth && (
        <div className="health-score-card glass-card">
          <div className="health-score-content">
            <div className="health-score-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={insights.overallHealth.score >= 80 ? '#40c057' : 
                         insights.overallHealth.score >= 60 ? '#fab005' : '#ff6b6b'}
                  strokeWidth="8"
                  strokeDasharray={`${insights.overallHealth.score * 2.827} 282.7`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="20" fill="white">
                  {insights.overallHealth.score}
                </text>
              </svg>
            </div>
            <div className="health-score-info">
              <h2>Overall Plant Health</h2>
              <p className={`health-status status-${insights.overallHealth.status}`}>
                {insights.overallHealth.status.toUpperCase()}
              </p>
              <div className="health-factors">
                {Object.entries(insights.overallHealth.factors).map(([key, value]) => (
                  <span key={key} className={`factor-badge factor-${value}`}>
                    {key.replace(/_/g, ' ')}: {value === 'good' ? '✓' : '⚠'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Grid */}
      <div className="insights-grid">
        {insights?.insights?.map((insight, index) => (
          <div key={index} className={`insight-card glass-card severity-${insight.severity}`}>
            <div className="insight-header">
              <GlassIcon name={getCategoryIcon(insight.category)} />
              <span className="insight-category">{insight.category.replace(/_/g, ' ')}</span>
              <span 
                className="insight-severity"
                style={{ color: getSeverityColor(insight.severity) }}
              >
                {insight.severity.toUpperCase()}
              </span>
            </div>
            <p className="insight-message">{insight.message}</p>
            <p className="insight-suggestion">💡 {insight.suggestion}</p>
            {insight.impact && (
              <p className="insight-impact">⚠ {insight.impact}</p>
            )}
            {insight.edgeImpulseConfidence && (
              <div className="insight-edge-impulse">
                <span className="ei-badge">Edge Impulse</span>
                <span className="ei-confidence">
                  {(insight.edgeImpulseConfidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Predictions */}
      {insights?.predictions && insights.predictions.length > 0 && (
        <div className="predictions-section">
          <h2>
            <GlassIcon name="insights" /> Predictions & Trends
          </h2>
          <div className="predictions-grid">
            {insights.predictions.map((prediction, index) => (
              <div key={index} className="prediction-card glass-card">
                <div className="prediction-type">{prediction.type.replace(/_/g, ' ')}</div>
                <p className="prediction-message">{prediction.message}</p>
                <p className="prediction-text">🔮 {prediction.prediction}</p>
                <div className="prediction-footer">
                  <span className="prediction-confidence">
                    {(prediction.confidence * 100).toFixed(0)}% confidence
                  </span>
                  <span className="prediction-recommendation">
                    {prediction.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disease Analysis */}
      {insights?.diseaseAnalysis && (
        <div className="disease-section">
          <h2>
            <GlassIcon name="leaf" /> Edge Impulse Disease Detection
          </h2>
          <div className="disease-stats">
            <div className="disease-stat glass-card">
              <span className="stat-value">{insights.diseaseAnalysis.totalScans}</span>
              <span className="stat-label">Total Scans</span>
            </div>
            <div className="disease-stat glass-card">
              <span className="stat-value">{insights.diseaseAnalysis.activeAlerts}</span>
              <span className="stat-label">Active Alerts</span>
            </div>
            <div className="disease-stat glass-card">
              <span className="stat-value">
                {insights.diseaseAnalysis.diseaseBreakdown?.length || 0}
              </span>
              <span className="stat-label">Conditions Detected</span>
            </div>
          </div>
          
          {insights.diseaseAnalysis.diseaseBreakdown && 
           insights.diseaseAnalysis.diseaseBreakdown.length > 0 && (
            <div className="disease-breakdown">
              {insights.diseaseAnalysis.diseaseBreakdown.map((disease, index) => (
                <div key={index} className="disease-item glass-card">
                  <div className="disease-name">
                    {formatDiseaseName(disease._id)}
                  </div>
                  <div className="disease-details">
                    <span>Count: {disease.count}</span>
                    <span>Confidence: {(disease.avgConfidence * 100).toFixed(0)}%</span>
                    {disease.avgHealthScore && (
                      <span>Health: {disease.avgHealthScore.toFixed(0)}/100</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Graphs */}
      {insights?.graphData && (
        <div className="graphs-section">
          <h2>
            <GlassIcon name="insights" /> Sensor Data Trends
          </h2>
          
          {/* Graph Selector */}
          <div className="graph-tabs">
            <button
              className={selectedGraph === 'soilMoisture' ? 'active' : ''}
              onClick={() => setSelectedGraph('soilMoisture')}
            >
              Soil Moisture
              {renderMiniGraph(insights.graphData.soilMoisture, 'soilMoisture')}
            </button>
            <button
              className={selectedGraph === 'temperature' ? 'active' : ''}
              onClick={() => setSelectedGraph('temperature')}
            >
              Temperature
              {renderMiniGraph(insights.graphData.temperature, 'temperature')}
            </button>
            <button
              className={selectedGraph === 'humidity' ? 'active' : ''}
              onClick={() => setSelectedGraph('humidity')}
            >
              Humidity
              {renderMiniGraph(insights.graphData.humidity, 'humidity')}
            </button>
            <button
              className={selectedGraph === 'lightLevel' ? 'active' : ''}
              onClick={() => setSelectedGraph('lightLevel')}
            >
              Light Level
              {renderMiniGraph(insights.graphData.lightLevel, 'lightLevel')}
            </button>
          </div>

          {/* Full Graph Display */}
          <div className="graph-display glass-card">
            {selectedGraph === 'soilMoisture' && 
              renderFullGraph(insights.graphData.soilMoisture, 'soilMoisture', 'Soil Moisture', '%')}
            {selectedGraph === 'temperature' && 
              renderFullGraph(insights.graphData.temperature, 'temperature', 'Temperature', '°C')}
            {selectedGraph === 'humidity' && 
              renderFullGraph(insights.graphData.humidity, 'humidity', 'Humidity', '%')}
            {selectedGraph === 'lightLevel' && 
              renderFullGraph(insights.graphData.lightLevel, 'lightLevel', 'Light Level', ' lux')}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {insights?.stats && (
        <div className="stats-summary">
          <h2>Summary Statistics ({days} days)</h2>
          <div className="stats-grid">
            <div className="stat-card glass-card">
              <GlassIcon name="water" />
              <div className="stat-info">
                <span className="stat-title">Avg Soil Moisture</span>
                <span className="stat-value">
                  {insights.stats.avgSoilMoisture?.toFixed(1) || 'N/A'}%
                </span>
              </div>
            </div>
            <div className="stat-card glass-card">
              <GlassIcon name="leaf" />
              <div className="stat-info">
                <span className="stat-title">Avg Temperature</span>
                <span className="stat-value">
                  {insights.stats.avgTemperature?.toFixed(1) || 'N/A'}°C
                </span>
              </div>
            </div>
            <div className="stat-card glass-card">
              <GlassIcon name="water" />
              <div className="stat-info">
                <span className="stat-title">Watering Events</span>
                <span className="stat-value">
                  {insights.wateringAnalysis?.totalEvents || 0}
                </span>
              </div>
            </div>
            <div className="stat-card glass-card">
              <GlassIcon name="leaf" />
              <div className="stat-info">
                <span className="stat-title">Watering Success Rate</span>
                <span className="stat-value">
                  {insights.wateringAnalysis?.successRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsightsPage;
