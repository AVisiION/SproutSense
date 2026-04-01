import SensorReading from '../models/SensorReading.js';
import WateringLog from '../models/WateringLog.js';
import SystemConfig from '../models/SystemConfig.js';
import DiseaseDetection from '../models/DiseaseDetection.js';
import DeviceStatus from '../models/DeviceStatus.js';
import AIUsageQuota from '../models/AIUsageQuota.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS, AI_ACTION, AI_PRIORITY } from '../config/constants.js';
import config from '../config/config.js';
import websocketService from '../utils/websocketService.js';
import aiProviderService from '../utils/aiProviderService.js';
import weatherService from '../utils/weatherService.js';
import { SENSOR_THRESHOLDS } from '../config/sensorThresholds.js';

function resolveAIQuotaDeviceId(req, fallback = 'ESP32-SENSOR') {
  return req.query?.deviceId || req.body?.deviceId || fallback;
}

async function enforceDailyAIQuota(req, res, deviceId) {
  const systemConfig = await SystemConfig.getConfig(deviceId);
  const dailyLimit = systemConfig?.aiConfig?.dailyAnalysisLimit || 2;
  const quota = await AIUsageQuota.consumeTodayQuota(deviceId, dailyLimit);

  if (quota.consumed) {
    return null;
  }

  return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: `Daily AI analysis limit reached (${quota.usedCount}/${quota.dailyLimit}). Try again after reset.`,
    data: {
      deviceId: quota.deviceId,
      dateKey: quota.dateKey,
      usedCount: quota.usedCount,
      dailyLimit: quota.dailyLimit,
      remaining: quota.remaining,
      exhausted: quota.exhausted,
      resetAt: quota.resetAt
    }
  });
}

// Get AI recommendation
export const getAIRecommendation = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.query;

    // Get latest sensor reading
    const latestReading = await SensorReading.getLatest(deviceId);
    
    if (!latestReading) {
      return errorResponse(res, 'No sensor data available for AI analysis', HTTP_STATUS.NOT_FOUND);
    }

    const quotaBlocked = await enforceDailyAIQuota(req, res, deviceId);
    if (quotaBlocked) {
      return quotaBlocked;
    }

    // Get configuration
    const config = await SystemConfig.getConfig(deviceId);

    // Get today's watering stats
    const todayCount = await WateringLog.getTodayCount(deviceId);
    const volumeData = await WateringLog.getTodayVolume(deviceId);
    const todayVolume = volumeData.length > 0 ? volumeData[0].totalVolume : 0;

    // Simple AI logic (can be replaced with actual AI model)
    const recommendation = generateRecommendation(
      latestReading,
      config,
      todayCount,
      todayVolume
    );

    successResponse(res, recommendation);
  } catch (error) {
    next(error);
  }
};

// Generate watering recommendation
function generateRecommendation(reading, config, todayCount, todayVolume) {
  const { soilMoisture, temperature, humidity, light } = reading;
  const { moistureThreshold, maxWateringCyclesPerDay } = config;

  let shouldWater = false;
  let confidence = 0;
  let reasons = [];
  let suggestions = [];

  // Analyze soil moisture
  if (soilMoisture < moistureThreshold) {
    shouldWater = true;
    confidence += 40;
    reasons.push(`Soil moisture (${soilMoisture}%) is below threshold (${moistureThreshold}%)`);
  } else if (soilMoisture < moistureThreshold + 10) {
    confidence += 20;
    reasons.push(`Soil moisture is approaching threshold`);
    suggestions.push('Monitor closely - may need water soon');
  } else {
    reasons.push(`Soil moisture (${soilMoisture}%) is adequate`);
    suggestions.push('No watering needed at this time');
  }

  // Analyze temperature and humidity
  if (temperature > 30 && humidity < 40) {
    confidence += 20;
    reasons.push('Hot and dry conditions increase water needs');
    suggestions.push('Consider increasing watering frequency during heat waves');
  } else if (temperature < 20 && humidity > 70) {
    confidence -= 15;
    reasons.push('Cool and humid conditions reduce water needs');
    suggestions.push('Reduce watering frequency in these conditions');
  }

  // Analyze light levels
  if (light > 50000) {
    confidence += 10;
    reasons.push('High light levels increase evaporation');
  }

  // Check watering limits
  if (todayCount >= maxWateringCyclesPerDay) {
    shouldWater = false;
    confidence = 0;
    reasons.push(`Maximum daily watering cycles (${maxWateringCyclesPerDay}) reached`);
    suggestions.push('Wait until tomorrow or adjust max cycles in settings');
  }

  // Determine action
  let action = AI_ACTION.WAIT;
  let priority = AI_PRIORITY.LOW;
  
  if (shouldWater && confidence >= 50) {
    action = AI_ACTION.WATER_NOW;
    priority = confidence >= 70 ? AI_PRIORITY.HIGH : AI_PRIORITY.MEDIUM;
  } else if (confidence >= 30) {
    action = AI_ACTION.MONITOR;
    priority = AI_PRIORITY.MEDIUM;
  }

  // Generate message
  let message = '';
  if (action === AI_ACTION.WATER_NOW) {
    message = `Watering recommended. ${reasons[0]}.`;
  } else if (action === AI_ACTION.MONITOR) {
    message = `Keep monitoring. ${reasons[0]}.`;
  } else {
    message = `Plant is healthy. ${reasons[0]}.`;
  }

  return {
    action,
    shouldWater,
    priority,
    confidence: Math.min(100, Math.max(0, confidence)),
    message,
    reasons,
    suggestions,
    currentConditions: {
      soilMoisture,
      temperature,
      humidity,
      light,
      todayWateringCount: todayCount,
      todayWaterVolume: todayVolume
    },
    timestamp: new Date()
  };
}

// Get historical AI insights with Edge Impulse disease detection, graphs, and predictions
export const getAIInsights = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', days = 7 } = req.query;

    const quotaBlocked = await enforceDailyAIQuota(req, res, deviceId);
    if (quotaBlocked) {
      return quotaBlocked;
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const insights = [];
    const predictions = [];

    // ===== 1. SENSOR DATA ANALYSIS WITH TIME SERIES =====
    
    // Get detailed sensor readings for graphs
    const sensorReadings = await SensorReading.find({
      deviceId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).select('soilMoisture temperature humidity light timestamp');

    // Get sensor statistics
    const sensorStats = await SensorReading.aggregate([
      {
        $match: { deviceId, timestamp: { $gte: startDate } }
      },
      {
        $group: {
          _id: null,
          avgSoilMoisture: { $avg: '$soilMoisture' },
          minSoilMoisture: { $min: '$soilMoisture' },
          maxSoilMoisture: { $max: '$soilMoisture' },
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgLight: { $avg: '$light' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = sensorStats[0] || {};

    // Soil Moisture Analysis
    if (stats.avgSoilMoisture) {
      if (stats.avgSoilMoisture < 30) {
        insights.push({
          type: 'warning',
          category: 'soil_moisture',
          severity: 'high',
          message: `Average soil moisture critically low at ${stats.avgSoilMoisture.toFixed(1)}%`,
          suggestion: 'Increase watering frequency immediately or lower threshold to 35%',
          impact: 'Plant growth may be stunted, risk of wilting'
        });
      } else if (stats.avgSoilMoisture > 80) {
        insights.push({
          type: 'warning',
          category: 'soil_moisture',
          severity: 'medium',
          message: `Soil moisture very high at ${stats.avgSoilMoisture.toFixed(1)}%`,
          suggestion: 'Reduce watering to prevent root rot',
          impact: 'Risk of overwatering and fungal diseases'
        });
      }

      // Moisture variability check
      const moistureRange = stats.maxSoilMoisture - stats.minSoilMoisture;
      if (moistureRange > 40) {
        insights.push({
          type: 'info',
          category: 'soil_moisture',
          severity: 'low',
          message: `High moisture variability detected (${moistureRange.toFixed(1)}% range)`,
          suggestion: 'Check sensor placement and ensure consistent watering',
          impact: 'Inconsistent moisture can stress plants'
        });
      }
    }

    // Temperature Analysis
    if (stats.avgTemperature) {
      if (stats.avgTemperature > 32) {
        insights.push({
          type: 'warning',
          category: 'temperature',
          severity: 'high',
          message: `Temperature too high (avg ${stats.avgTemperature.toFixed(1)} °C)`,
          suggestion: 'Provide shade or move plant to cooler location',
          impact: 'Heat stress can damage leaves and reduce growth'
        });
      } else if (stats.avgTemperature < 15) {
        insights.push({
          type: 'warning',
          category: 'temperature',
          severity: 'medium',
          message: `Temperature too low (avg ${stats.avgTemperature.toFixed(1)} °C)`,
          suggestion: 'Move plant to warmer location or provide heating',
          impact: 'Cold stress can slow growth and cause leaf damage'
        });
      }
    }

    // Light Level Analysis
    if (stats.avgLight) {
      if (stats.avgLight < 200) {
        insights.push({
          type: 'info',
          category: 'light',
          severity: 'medium',
          message: `Light levels low (avg ${stats.avgLight.toFixed(0)} lux)`,
          suggestion: 'Move plant to brighter location or add grow lights',
          impact: 'Insufficient light can cause leggy growth and poor health'
        });
      }
    }

    // ===== 2. WATERING PATTERN ANALYSIS =====
    
    const wateringHistory = await WateringLog.find({
      deviceId,
      startTime: { $gte: startDate }
    }).sort({ startTime: 1 });

    const successfulWaterings = wateringHistory.filter(log => 
      log.soilMoistureAfter && log.soilMoistureBefore &&
      log.soilMoistureAfter > log.soilMoistureBefore
    );

    if (successfulWaterings.length > 0) {
      const avgIncrease = successfulWaterings.reduce((sum, log) => 
        sum + (log.soilMoistureAfter - log.soilMoistureBefore), 0
      ) / successfulWaterings.length;

      const avgDuration = wateringHistory.reduce((sum, log) => 
        sum + (log.duration || 0), 0
      ) / wateringHistory.length / 1000; // Convert to seconds

      if (avgIncrease < 10) {
        insights.push({
          type: 'warning',
          category: 'watering',
          severity: 'medium',
          message: `Watering efficiency low (only ${avgIncrease.toFixed(1)}% moisture increase)`,
          suggestion: `Increase watering duration from ${avgDuration.toFixed(0)}s to ${(avgDuration * 1.5).toFixed(0)}s`,
          impact: 'Insufficient water reaching roots'
        });
      } else {
        insights.push({
          type: 'success',
          category: 'watering',
          severity: 'none',
          message: `Watering system performing well (${avgIncrease.toFixed(1)}% avg increase)`,
          suggestion: 'Current watering duration is effective',
          impact: null
        });
      }

      // Watering frequency analysis
      const wateringsPerDay = wateringHistory.length / days;
      if (wateringsPerDay > 5) {
        insights.push({
          type: 'info',
          category: 'watering',
          severity: 'low',
          message: `High watering frequency (${wateringsPerDay.toFixed(1)} times/day)`,
          suggestion: 'Consider lowering the moisture threshold',
          impact: 'Frequent watering may indicate poor water retention'
        });
      }
    }

    // ===== 3. EDGE IMPULSE DISEASE DETECTION ANALYSIS =====
    
    const diseaseDeviceId = deviceId.replace('ESP32-SENSOR', 'ESP32-CAM');
    
    // Get recent disease detections
    const diseaseHistory = await DiseaseDetection.find({
      deviceId: diseaseDeviceId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).select('-imageBase64');

    // Get disease statistics
    const diseaseStats = await DiseaseDetection.aggregate([
      {
        $match: { deviceId: diseaseDeviceId, timestamp: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$detectedDisease',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          maxConfidence: { $max: '$confidence' },
          lastDetected: { $max: '$timestamp' },
          avgHealthScore: { $avg: '$plantHealth.overallScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get active disease alerts
    const activeAlerts = await DiseaseDetection.getActiveAlerts(diseaseDeviceId);

    // Analyze disease patterns
    const nonHealthyDetections = diseaseStats.filter(d => d._id !== 'healthy');
    
    if (nonHealthyDetections.length > 0) {
      const mostCommonDisease = nonHealthyDetections[0];
      const detectionRate = (mostCommonDisease.count / diseaseHistory.length * 100);

      if (mostCommonDisease.avgConfidence > 0.7) {
        insights.push({
          type: 'critical',
          category: 'disease',
          severity: 'critical',
          message: `${mostCommonDisease._id.replace(/_/g, ' ').toUpperCase()} detected (${detectionRate.toFixed(0)}% of scans)`,
          suggestion: getDiseaseRemediation(mostCommonDisease._id),
          impact: 'Disease can spread and cause significant plant damage',
          edgeImpulseConfidence: mostCommonDisease.avgConfidence,
          detectionCount: mostCommonDisease.count
        });
      } else if (mostCommonDisease.avgConfidence > 0.5) {
        insights.push({
          type: 'warning',
          category: 'disease',
          severity: 'medium',
          message: `Possible ${mostCommonDisease._id.replace(/_/g, ' ')} detected (${detectionRate.toFixed(0)}% of scans)`,
          suggestion: `Monitor closely and ${getDiseaseRemediation(mostCommonDisease._id).toLowerCase()}`,
          impact: 'Early intervention can prevent disease progression',
          edgeImpulseConfidence: mostCommonDisease.avgConfidence,
          detectionCount: mostCommonDisease.count
        });
      }
    }

    // Overall plant health trend
    const healthScores = diseaseHistory
      .filter(d => d.plantHealth?.overallScore)
      .map(d => ({ score: d.plantHealth.overallScore, timestamp: d.timestamp }));

    if (healthScores.length >= 2) {
      const recentScores = healthScores.slice(-3);
      const avgRecentHealth = recentScores.reduce((sum, h) => sum + h.score, 0) / recentScores.length;

      if (avgRecentHealth < 60) {
        insights.push({
          type: 'warning',
          category: 'health',
          severity: 'high',
          message: `Plant health declining (${avgRecentHealth.toFixed(0)}/100)`,
          suggestion: 'Review all environmental factors and check for diseases',
          impact: 'Poor health can lead to reduced growth and yield'
        });
      } else if (avgRecentHealth >= 80) {
        insights.push({
          type: 'success',
          category: 'health',
          severity: 'none',
          message: `Plant health excellent (${avgRecentHealth.toFixed(0)}/100)`,
          suggestion: 'Continue current care routine',
          impact: null
        });
      }
    }

    // ===== 4. PREDICTIONS & TRENDS =====
    
    // Predict soil moisture trend
    if (sensorReadings.length >= 10) {
      const recentReadings = sensorReadings.slice(-10);
      const moistureTrend = calculateTrend(recentReadings.map(r => r.soilMoisture));
      
      if (moistureTrend < -2) {
        const currentMoisture = recentReadings[recentReadings.length - 1].soilMoisture;
        const hoursUntilDry = estimateHoursUntilThreshold(currentMoisture, moistureTrend, 30);
        
        predictions.push({
          type: 'soil_moisture',
          message: `Soil moisture declining rapidly (${moistureTrend.toFixed(1)}%/hour)`,
          prediction: `Will reach watering threshold in ~${hoursUntilDry} hours`,
          confidence: 0.75,
          recommendation: 'Monitor closely or adjust threshold'
        });
      } else if (moistureTrend > 2) {
        predictions.push({
          type: 'soil_moisture',
          message: `Soil moisture increasing (${moistureTrend.toFixed(1)}%/hour)`,
          prediction: 'May indicate excessive watering or poor drainage',
          confidence: 0.70,
          recommendation: 'Check drainage and reduce watering if needed'
        });
      }

      // Temperature trend
      const tempTrend = calculateTrend(recentReadings.map(r => r.temperature));
      if (Math.abs(tempTrend) > 1) {
        predictions.push({
          type: 'temperature',
          message: `Temperature ${tempTrend > 0 ? 'rising' : 'falling'} (${Math.abs(tempTrend).toFixed(1)} °C/hour)`,
          prediction: tempTrend > 0 ? 'May reach stress levels soon' : 'Cooling trend detected',
          confidence: 0.65,
          recommendation: tempTrend > 0 ? 'Prepare cooling measures' : 'Monitor for cold stress'
        });
      }
    }

    // Predict disease risk based on conditions
    const diseaseRisk = calculateDiseaseRisk(stats, nonHealthyDetections.length > 0);
    if (diseaseRisk.level !== 'low') {
      predictions.push({
        type: 'disease_risk',
        message: `${diseaseRisk.level.toUpperCase()} disease risk detected`,
        prediction: diseaseRisk.reason,
        confidence: diseaseRisk.confidence,
        recommendation: diseaseRisk.recommendation
      });
    }

    // ===== 5. PREPARE GRAPH DATA =====
    
    const graphData = {
      soilMoisture: sensorReadings.map(r => ({
        timestamp: r.timestamp,
        value: r.soilMoisture
      })),
      temperature: sensorReadings.map(r => ({
        timestamp: r.timestamp,
        value: r.temperature
      })),
      humidity: sensorReadings.map(r => ({
        timestamp: r.timestamp,
        value: r.humidity
      })),
      lightLevel: sensorReadings.map(r => ({
        timestamp: r.timestamp,
        value: r.light
      })),
      wateringEvents: wateringHistory.map(w => ({
        timestamp: w.startTime,
        duration: w.duration,
        moistureBefore: w.soilMoistureBefore,
        moistureAfter: w.soilMoistureAfter
      })),
      diseaseDetections: diseaseHistory.map(d => ({
        timestamp: d.timestamp,
        disease: d.detectedDisease,
        confidence: d.confidence,
        healthScore: d.plantHealth?.overallScore
      })),
      healthTrend: healthScores
    };

    // ===== 6. OVERALL ASSESSMENT =====
    
    const overallHealth = {
      score: calculateOverallHealthScore(stats, nonHealthyDetections, wateringHistory.length),
      status: '',
      factors: {
        soilMoisture: stats.avgSoilMoisture >= 40 && stats.avgSoilMoisture <= 70 ? 'good' : 'needs_attention',
        temperature: stats.avgTemperature >= 18 && stats.avgTemperature <= 28 ? 'good' : 'needs_attention',
        watering: successfulWaterings.length > 0 ? 'good' : 'needs_attention',
        disease: nonHealthyDetections.length === 0 ? 'good' : 'needs_attention'
      }
    };

    overallHealth.status = overallHealth.score >= 80 ? 'excellent' : 
                          overallHealth.score >= 60 ? 'good' : 
                          overallHealth.score >= 40 ? 'fair' : 'poor';

    // Response
    successResponse(res, {
      insights: insights.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      predictions,
      stats: {
        ...stats,
        totalReadings: sensorReadings.length,
        dateRange: { start: startDate, end: new Date() }
      },
      graphData,
      diseaseAnalysis: {
        totalScans: diseaseHistory.length,
        diseaseBreakdown: diseaseStats,
        activeAlerts: activeAlerts.length,
        recentDetections: diseaseHistory.slice(-5)
      },
      wateringAnalysis: {
        totalEvents: wateringHistory.length,
        successRate: (successfulWaterings.length / wateringHistory.length * 100).toFixed(1),
        avgEfficiency: successfulWaterings.length > 0 ? 
          (successfulWaterings.reduce((sum, log) => 
            sum + (log.soilMoistureAfter - log.soilMoistureBefore), 0
          ) / successfulWaterings.length).toFixed(1) : 0
      },
      overallHealth
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getDiseaseRemediation(disease) {
  const remediation = {
    'leaf_spot': 'Remove affected leaves and apply fungicide. Improve air circulation.',
    'powdery_mildew': 'Spray with neem oil or fungicide. Reduce humidity and improve ventilation.',
    'rust': 'Remove infected leaves and apply copper-based fungicide. Avoid overhead watering.',
    'bacterial_blight': 'Remove infected parts immediately. Apply copper bactericide. Isolate plant.',
    'viral_mosaic': 'No cure - remove severely affected plants. Control aphids to prevent spread.',
    'nutrient_deficiency': 'Apply balanced fertilizer. Check soil pH and adjust if needed.',
    'pest_damage': 'Identify and treat specific pest. Use insecticidal soap or neem oil.',
    'unknown': 'Continue monitoring. Consider consulting plant disease expert.'
  };
  return remediation[disease] || 'Monitor plant and consult agricultural expert if condition worsens.';
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function estimateHoursUntilThreshold(current, trend, threshold) {
  if (trend >= 0) return Infinity;
  const diff = current - threshold;
  const hours = Math.abs(diff / trend);
  return Math.max(1, Math.round(hours));
}

function calculateDiseaseRisk(stats, hasActiveDiseases) {
  let riskScore = 0;
  let reasons = [];
  
  // High humidity increases fungal disease risk
  if (stats.avgHumidity > 80) {
    riskScore += 30;
    reasons.push('high humidity favors fungal growth');
  }
  
  // Temperature extremes
  if (stats.avgTemperature > 30 || stats.avgTemperature < 15) {
    riskScore += 20;
    reasons.push('temperature stress weakens plant immunity');
  }
  
  // Poor moisture management
  if (stats.avgSoilMoisture > 75 || stats.avgSoilMoisture < 25) {
    riskScore += 25;
    reasons.push('poor moisture levels stress plants');
  }
  
  // Active diseases
  if (hasActiveDiseases) {
    riskScore += 40;
    reasons.push('existing disease detected');
  }
  
  const level = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  
  return {
    level,
    score: riskScore,
    confidence: 0.70 + (reasons.length * 0.05),
    reason: reasons.join(', ') || 'environmental conditions favorable',
    recommendation: level === 'high' ? 
      'Apply preventive fungicide and improve ventilation' : 
      level === 'medium' ? 
      'Monitor closely and optimize environmental conditions' :
      'Continue current care practices'
  };
}

function calculateOverallHealthScore(stats, diseases, wateringCount) {
  let score = 100;
  
  // Soil moisture factor (max -25)
  if (stats.avgSoilMoisture < 30) score -= 25;
  else if (stats.avgSoilMoisture < 40) score -= 15;
  else if (stats.avgSoilMoisture > 80) score -= 20;
  else if (stats.avgSoilMoisture > 70) score -= 10;
  
  // Temperature factor (max -20)
  if (stats.avgTemperature < 15 || stats.avgTemperature > 32) score -= 20;
  else if (stats.avgTemperature < 18 || stats.avgTemperature > 28) score -= 10;
  
  // Disease factor (max -40)
  score -= diseases.length * 15;
  
  // Watering factor (max -15)
  if (wateringCount === 0) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

// POST /api/ai/chat - Gemini conversational AI with sensor context
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, sensorContext = '', history = [], apiKey = '' } = req.body;
    const deviceId = resolveAIQuotaDeviceId(req);

    if (!message) {
      return errorResponse(res, 'Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    const quotaBlocked = await enforceDailyAIQuota(req, res, deviceId);
    if (quotaBlocked) {
      return quotaBlocked;
    }

    const key = apiKey || config.API_KEYS.GEMINI;
    if (!key) {
      return errorResponse(
        res,
        'No Gemini API key configured. Add it in Settings > AI API Keys or set GEMINI_API_KEY in backend/.env',
        400
      );
    }

    // Dynamic import - only loaded when actually needed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Gemini requires history to:
    //   1. Contain only 'user' and 'model' roles
    //   2. Start with a 'user' turn
    //   3. Strictly alternate user -> model -> user -> ...
    const rawHistory = history
      .filter(h => h.role === 'user' || h.role === 'assistant')
      .map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] }));

    // Drop leading non-user turns and enforce alternation
    const geminiHistory = [];
    let expectedRole = 'user';
    for (const turn of rawHistory) {
      if (turn.role === expectedRole) {
        geminiHistory.push(turn);
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
      // Skip turns that break alternation (e.g. two consecutive assistant messages)
    }

    const chat = model.startChat({
      history: geminiHistory,
      // systemInstruction as first user turn for SDK compatibility
    });

    // Prepend system persona + sensor context to the outgoing message
    const sysPrefix = 'You are SproutSense AI, an expert IoT plant-care assistant. Interpret sensor readings and give concise, actionable plant-care guidance. ';
    const fullMessage = sensorContext
      ? `${sysPrefix}Current sensor readings:\n${sensorContext}\n\nUser question: ${message}`
      : `${sysPrefix}User question: ${message}`;

    const result = await chat.sendMessage(fullMessage);
    const reply = result.response.text();

    res.json({ success: true, reply });
  } catch (error) {
    const msg = error?.message || error?.toString() || 'Unknown error';
    console.error('[AI Chat] Gemini error:', msg);

    if (msg.includes('API_KEY_INVALID') || msg.includes('API key') || msg.includes('401')) {
      return res.status(401).json({ success: false, error: 'Invalid Gemini API key. Regenerate it at aistudio.google.com and update in Settings.' });
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      return res.status(429).json({ success: false, error: 'Gemini quota exceeded - try again in a moment.' });
    }
    // Always return JSON with the real error message so frontend can display it
    return res.status(500).json({ success: false, error: `AI error: ${msg}` });
  }
};

/**
 * GET /api/ai/usage
 * Return daily AI usage for admin visibility
 */
export const getAIUsageStats = async (req, res, next) => {
  try {
    const deviceId = resolveAIQuotaDeviceId(req);
    const systemConfig = await SystemConfig.getConfig(deviceId);
    const dailyLimit = systemConfig?.aiConfig?.dailyAnalysisLimit || 2;
    const usage = await AIUsageQuota.getTodayUsageWithLimit(deviceId, dailyLimit);

    successResponse(res, usage);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DISEASE DETECTION ENDPOINTS (ESP32-CAM)
// ============================================================================

/**
 * POST /api/ai/disease
 * Submit disease detection result from ESP32-CAM
 */
export const submitDiseaseDetection = async (req, res, next) => {
  try {
    const {
      deviceId = 'ESP32-CAM',
      detectedDisease,
      confidence,
      growthStage,
      imageBase64,
      edgeImpulseData,
      plantHealth
    } = req.body;

    // Validate required fields
    if (!detectedDisease || confidence === undefined) {
      return errorResponse(res, 'Missing required fields: detectedDisease, confidence', HTTP_STATUS.BAD_REQUEST);
    }

    // Create disease detection record
    const detection = await DiseaseDetection.create({
      deviceId,
      detectedDisease,
      confidence,
      growthStage: growthStage || 'unknown',
      imageBase64: imageBase64 || null,
      edgeImpulseData: edgeImpulseData || {},
      plantHealth: plantHealth || {},
      timestamp: new Date()
    });

    // Keep ESP32-CAM heartbeat accurate across the UI status surfaces.
    const camStatus = await DeviceStatus.getStatus(deviceId);
    await camStatus.markOnline();

    // Check if critical and send alert
    if (detection.isCritical()) {
      detection.alertSent = true;
      detection.actionTaken = 'notified';
      await detection.save();

      // Broadcast critical alert via WebSocket
      websocketService.broadcast('DISEASE_ALERT', {
        deviceId,
        disease: detectedDisease,
        confidence,
        severity: 'critical',
        timestamp: detection.timestamp
      });
    } else if (detectedDisease !== 'healthy' && confidence >= 0.6) {
      // Moderate alert
      websocketService.broadcast('DISEASE_ALERT', {
        deviceId,
        disease: detectedDisease,
        confidence,
        severity: 'warning',
        timestamp: detection.timestamp
      });
    }

    // Broadcast general update
    websocketService.broadcast('AI_UPDATE', { detection });

    successResponse(res, detection, 'Disease detection recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/disease/latest
 * Get latest disease detection
 */
export const getLatestDiseaseDetection = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-CAM' } = req.query;

    const detection = await DiseaseDetection.getLatest(deviceId);
    
    if (!detection) {
      return errorResponse(res, 'No disease detection data available', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, detection);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/disease/history
 * Get disease detection history
 */
export const getDiseaseHistory = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-CAM', days = 7 } = req.query;

    const history = await DiseaseDetection.getDiseaseHistory(parseInt(days), deviceId);

    successResponse(res, { history, days: parseInt(days) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/disease/alerts
 * Get active disease alerts
 */
export const getActiveAlerts = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-CAM' } = req.query;

    const alerts = await DiseaseDetection.getActiveAlerts(deviceId);

    successResponse(res, { alerts, count: alerts.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/disease/all
 * Get all disease detections with pagination
 */
export const getAllDiseaseDetections = async (req, res, next) => {
  try {
    const {
      deviceId = 'ESP32-CAM',
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const query = { deviceId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [detections, total] = await Promise.all([
      DiseaseDetection.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DiseaseDetection.countDocuments(query)
    ]);

    successResponse(res, {
      detections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// AI TIPS ENDPOINTS (Replaces "Insights")
// ============================================================================

/**
 * GET /api/ai/tips
 * Get AI-generated plant care tips based on current sensors and weather
 */
export const getAITips = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.query;

    // Get latest sensor data
    const latestReading = await SensorReading.getLatest(deviceId);
    if (!latestReading) {
      return errorResponse(res, 'No sensor data available', HTTP_STATUS.NOT_FOUND);
    }

    // Get system config
    const sysConfig = await SystemConfig.getConfig(deviceId);

    // Get weather data if enabled
    let weatherData = null;
    if (sysConfig.weather.enabled) {
      try {
        const latitude = sysConfig.weather.latitude || 0;
        const longitude = sysConfig.weather.longitude || 0;
        weatherData = await weatherService.getWeather(latitude, longitude, sysConfig.weather.provider);
      } catch (error) {
        console.warn('Weather service error:', error.message);
      }
    }

    // Get watering stats
    const todayCount = await WateringLog.getTodayCount(deviceId);

    // Build AI tips request
    const aiResponse = await aiProviderService.getPlantTips(
      {
        soilMoisture: latestReading.soilMoisture,
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
        light: latestReading.light,
        pH: latestReading.pH,
        wateringCyclesCount: todayCount,
        weather: weatherData
      },
      {
        plantGrowth: sysConfig.plantGrowth,
        autoMode: sysConfig.autoMode,
        moistureThreshold: sysConfig.moistureThreshold
      }
    );

    // Check for weather-related impacts
    let weatherImpacts = [];
    if (weatherData) {
      const impacts = weatherService.getWeatherImpact(weatherData, SENSOR_THRESHOLDS.SENSOR_THRESHOLDS);
      weatherImpacts = impacts.impacts;
    }

    // Determine plant status
    const plantStatus = determinePlantStatus(latestReading, SENSOR_THRESHOLDS.SENSOR_THRESHOLDS);

    // Update last refresh time
    sysConfig.aiConfig.lastTipsRefresh = new Date();
    await sysConfig.save();

    successResponse(res, {
      tips: {
        provider: aiResponse.provider,
        content: aiResponse.response,
        timestamp: new Date(),
        validFor: '1 hour'
      },
      plantStatus,
      weatherImpacts,
      sensorsSummary: {
        moisture: latestReading.soilMoisture,
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
        light: latestReading.light,
        pH: latestReading.pH
      },
      weather: weatherData,
      recommendations: generateTipsRecommendations(latestReading, SENSOR_THRESHOLDS.SENSOR_THRESHOLDS),
      nextRefresh: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/tips/refresh
 * Manually refresh AI tips
 */
export const refreshAITips = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR' } = req.body;

    const config = await SystemConfig.refreshAITips(deviceId);

    // Trigger tips generation
    const response = await getAITips({ query: { deviceId } }, res, next);
    return response;
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/disease/recommendations
 * Get AI-powered disease treatment recommendations based on detection and sensors
 */
export const getDiseaseRecommendations = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-CAM', sensorDeviceId = 'ESP32-SENSOR' } = req.query;

    // Get latest disease detection
    const latestDisease = await DiseaseDetection.getLatest(deviceId);
    if (!latestDisease) {
      return errorResponse(res, 'No disease detection available', HTTP_STATUS.NOT_FOUND);
    }

    // Get latest sensor data
    const latestSensors = await SensorReading.getLatest(sensorDeviceId);
    if (!latestSensors) {
      return errorResponse(res, 'No sensor data available', HTTP_STATUS.NOT_FOUND);
    }

    // Get AI recommendation
    const aiRecommendation = await aiProviderService.getDiseaseRecommendation(
      {
        detectedDisease: latestDisease.detectedDisease,
        confidence: latestDisease.confidence,
        growthStage: latestDisease.growthStage,
        plantHealth: latestDisease.plantHealth
      },
      {
        soilMoisture: latestSensors.soilMoisture,
        temperature: latestSensors.temperature,
        humidity: latestSensors.humidity,
        light: latestSensors.light,
        pH: latestSensors.pH
      }
    );

    // Get system config for thresholds
    const sysConfig = await SystemConfig.getConfig(sensorDeviceId);

    // Get weather data
    let weatherData = null;
    if (sysConfig.weather.enabled) {
      try {
        weatherData = await weatherService.getWeather(
          sysConfig.weather.latitude || 0,
          sysConfig.weather.longitude || 0
        );
      } catch (error) {
        console.warn('Weather service error:', error.message);
      }
    }

    // Generate action plan
    const actionPlan = generateDiseaseActionPlan(
      latestDisease,
      latestSensors,
      SENSOR_THRESHOLDS.SENSOR_THRESHOLDS,
      weatherData
    );

    // Update disease record with recommendations
    latestDisease.actionTaken = determineDiseaseAction(latestDisease.confidence);
    await latestDisease.save();

    successResponse(res, {
      disease: {
        type: latestDisease.detectedDisease,
        confidence: latestDisease.confidence,
        severity: latestDisease.confidence >= 0.85 ? 'critical' : 
                  latestDisease.confidence >= 0.7 ? 'high' : 'medium',
        detectedAt: latestDisease.timestamp
      },
      aiRecommendation: {
        provider: aiRecommendation.provider,
        treatment: aiRecommendation.response,
        timestamp: new Date()
      },
      actionPlan,
      environmentalFactors: {
        temperature: latestSensors.temperature,
        humidity: latestSensors.humidity,
        soilMoisture: latestSensors.soilMoisture,
        pH: latestSensors.pH,
        weather: weatherData
      },
      preventiveMeasures: getPreventiverMeasures(latestDisease.detectedDisease),
      nextCheckTime: new Date(Date.now() + 6 * 60 * 60 * 1000) // Check again in 6 hours
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine plant health status based on sensor readings
 */
function determinePlantStatus(sensors, thresholds) {
  let healthScore = 100;
  let issues = [];

  // Soil moisture
  if (sensors.soilMoisture < thresholds.SOIL_MOISTURE.ALERT_CONDITIONS.CRITICALLY_DRY) {
    healthScore -= 30;
    issues.push('Critically dry');
  } else if (sensors.soilMoisture > thresholds.SOIL_MOISTURE.ALERT_CONDITIONS.SATURATED) {
    healthScore -= 25;
    issues.push('Saturated soil');
  }

  // Temperature
  if (sensors.temperature < thresholds.TEMPERATURE.ALERT_CONDITIONS.FREEZING_RISK) {
    healthScore -= 25;
    issues.push('Freezing risk');
  } else if (sensors.temperature > thresholds.TEMPERATURE.ALERT_CONDITIONS.EXTREME_HEAT) {
    healthScore -= 30;
    issues.push('Extreme heat');
  }

  // Humidity
  if (sensors.humidity < thresholds.HUMIDITY.ALERT_CONDITIONS.TOO_DRY) {
    healthScore -= 15;
    issues.push('Too dry');
  } else if (sensors.humidity > thresholds.HUMIDITY.ALERT_CONDITIONS.MOLD_RISK) {
    healthScore -= 20;
    issues.push('Mold/fungal risk');
  }

  // Light
  if (sensors.light < thresholds.LIGHT.ALERT_CONDITIONS.INSUFFICIENT) {
    healthScore -= 15;
    issues.push('Insufficient light');
  }

  const status = healthScore >= 80 ? 'excellent' : 
                 healthScore >= 60 ? 'good' : 
                 healthScore >= 40 ? 'fair' : 'poor';

  return { status, score: Math.max(0, healthScore), issues };
}

/**
 * Generate personalized tips recommendations
 */
function generateTipsRecommendations(sensors, thresholds) {
  const tips = [];

  // Soil moisture tips
  if (sensors.soilMoisture < thresholds.SOIL_MOISTURE.ACTION_THRESHOLD) {
    tips.push({
      priority: 'high',
      category: 'watering',
      tip: 'Water your plant now - soil moisture is below threshold',
      rationale: `Current: ${sensors.soilMoisture}% | Threshold: ${thresholds.SOIL_MOISTURE.ACTION_THRESHOLD}%`
    });
  } else if (sensors.soilMoisture > thresholds.SOIL_MOISTURE.ALERT_CONDITIONS.SATURATED) {
    tips.push({
      priority: 'high',
      category: 'watering',
      tip: 'Hold off watering - soil is saturated',
      rationale: 'Risk of root rot. Improve drainage.'
    });
  }

  // Temperature tips
  if (sensors.temperature > thresholds.TEMPERATURE.ACTION_THRESHOLD) {
    tips.push({
      priority: 'medium',
      category: 'temperature',
      tip: 'Provide shade or extra water - temperature is high',
      rationale: `Current: ${sensors.temperature} °C | Alert threshold: ${thresholds.TEMPERATURE.ACTION_THRESHOLD} °C`
    });
  }

  // Humidity tips
  if (sensors.humidity < thresholds.HUMIDITY.ACTION_THRESHOLD) {
    tips.push({
      priority: 'medium',
      category: 'humidity',
      tip: 'Consider misting leaves - humidity is low',
      rationale: `Current: ${sensors.humidity}% | Ideal: 40-70%`
    });
  }

  // Light tips
  if (sensors.light < thresholds.LIGHT.ACTION_THRESHOLD) {
    tips.push({
      priority: 'medium',
      category: 'light',
      tip: 'Move plant to brighter location or add grow lights',
      rationale: `Current: ${sensors.light} lux | Optimal: 5,000-20,000 lux`
    });
  }

  // pH tips
  if (sensors.pH < thresholds.PH.OPTIMAL_RANGE.MIN) {
    tips.push({
      priority: 'medium',
      category: 'soil',
      tip: 'Soil is acidic - consider adding lime',
      rationale: `Current pH: ${sensors.pH} | Optimal: 5.5-7.0`
    });
  } else if (sensors.pH > thresholds.PH.OPTIMAL_RANGE.MAX) {
    tips.push({
      priority: 'medium',
      category: 'soil',
      tip: 'Soil is alkaline - consider adding sulfur',
      rationale: `Current pH: ${sensors.pH} | Optimal: 5.5-7.0`
    });
  }

  return tips;
}

/**
 * Generate detailed disease action plan
 */
function generateDiseaseActionPlan(disease, sensors, thresholds, weather) {
  const plan = {
    immediate: [],
    shortTerm: [],
    longTerm: [],
    environmental: [],
    monitoring: []
  };

  // Immediate actions based on disease severity
  if (disease.confidence >= 0.85) {
    plan.immediate.push('Isolate plant from others to prevent spread');
    plan.immediate.push('Remove and destroy heavily infected leaves');
    plan.immediate.push('Apply fungicide or bactericide immediately');
  } else if (disease.confidence >= 0.7) {
    plan.immediate.push('Inspect plant closely for disease progression');
    plan.immediate.push('Remove mildly infected leaves');
    plan.immediate.push('Prepare fungicide treatment');
  }

  // Environmental adjustments
  if (sensors.humidity > thresholds.HUMIDITY.ALERT_CONDITIONS.MOLD_RISK) {
    plan.environmental.push('Reduce humidity - improve air circulation');
    plan.environmental.push('Move plant away from other plants');
    plan.environmental.push('Avoid wetting leaves when watering');
  }

  if (sensors.temperature > thresholds.TEMPERATURE.ACTION_THRESHOLD) {
    plan.environmental.push('Provide shade during hottest hours');
  }

  // Monitoring
  plan.monitoring.push('Check daily for new symptoms');
  plan.monitoring.push('Take photos to track progression');
  plan.monitoring.push('Monitor humidity and temperature closely');

  // Long-term prevention
  plan.longTerm.push('Ensure good air circulation');
  plan.longTerm.push('Water at base, avoid wetting leaves');
  plan.longTerm.push('Apply preventive fungicide monthly during growing season');

  return plan;
}

/**
 * Determine disease action status
 */
function determineDiseaseAction(confidence) {
  if (confidence >= 0.85) {
    return 'adjusted_watering'; // May adjust for treatment timing
  } else if (confidence >= 0.7) {
    return 'notified';
  } else {
    return 'monitored';
  }
}

/**
 * Get preventive measures for specific disease
 */
function getPreventiverMeasures(disease) {
  const measures = {
    'healthy': [
      'Maintain optimal environmental conditions',
      'Regular but careful watering',
      'Proper air circulation',
      'Monitor for early signs'
    ],
    'leafspot': [
      'Avoid overhead watering',
      'Remove infected leaves promptly',
      'Improve air circulation',
      'Apply preventive fungicide'
    ],
    'bacterialblight': [
      'Sterilize pruning tools',
      'Remove infected branches immediately',
      'Avoid working with wet plants',
      'Apply copper bactericide'
    ],
    'viralmosaic': [
      'Control aphid vectors',
      'Remove severely infected plants',
      'Disinfect tools between plants',
      'No chemical cure - prevention is key'
    ],
    'pestdamage': [
      'Regular pest monitoring',
      'Isolate infested plants',
      'Use organic pest management',
      'Maintain plant vigor'
    ],
    'leafmold': [
      'Increase air circulation',
      'Reduce humidity below 80%',
      'Avoid overhead watering',
      'Apply preventive fungicide'
    ]
  };

  return measures[disease] || measures['healthy'];
}



