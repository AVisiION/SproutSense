import SensorReading from '../models/SensorReading.js';
import WateringLog from '../models/WateringLog.js';
import SystemConfig from '../models/SystemConfig.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS, AI_ACTION, AI_PRIORITY } from '../config/constants.js';
import config from '../config/config.js';

// Get AI recommendation
export const getAIRecommendation = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-001' } = req.query;

    // Get latest sensor reading
    const latestReading = await SensorReading.getLatest(deviceId);
    
    if (!latestReading) {
      return errorResponse(res, 'No sensor data available for AI analysis', HTTP_STATUS.NOT_FOUND);
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
    message = `🌱 Watering recommended. ${reasons[0]}.`;
  } else if (action === AI_ACTION.MONITOR) {
    message = `👀 Keep monitoring. ${reasons[0]}.`;
  } else {
    message = `✅ Plant is healthy. ${reasons[0]}.`;
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

// Get historical AI insights
export const getAIInsights = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-001', days = 7 } = req.query;

    // Get sensor statistics
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const sensorStats = await SensorReading.aggregate([
      {
        $match: {
          deviceId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgSoilMoisture: { $avg: '$soilMoisture' },
          minSoilMoisture: { $min: '$soilMoisture' },
          maxSoilMoisture: { $max: '$soilMoisture' },
          avgTemperature: { $avg: '$temperature' }
        }
      }
    ]);

    // Get watering patterns
    const wateringHistory = await WateringLog.find({
      deviceId,
      startTime: { $gte: startDate }
    });

    const insights = [];

    // Analyze patterns
    if (sensorStats.length > 0) {
      const stats = sensorStats[0];
      
      if (stats.avgSoilMoisture < 30) {
        insights.push({
          type: 'warning',
          message: 'Average soil moisture has been low this week',
          suggestion: 'Consider increasing watering frequency or reducing threshold'
        });
      }

      if (stats.maxSoilMoisture - stats.minSoilMoisture > 40) {
        insights.push({
          type: 'info',
          message: 'Soil moisture shows high variability',
          suggestion: 'Check sensor placement and watering consistency'
        });
      }
    }

    // Analyze watering efficiency
    const successfulWaterings = wateringHistory.filter(log => 
      log.soilMoistureAfter && log.soilMoistureBefore &&
      log.soilMoistureAfter > log.soilMoistureBefore
    );

    if (successfulWaterings.length > 0) {
      const avgIncrease = successfulWaterings.reduce((sum, log) => 
        sum + (log.soilMoistureAfter - log.soilMoistureBefore), 0
      ) / successfulWaterings.length;

      insights.push({
        type: 'success',
        message: `Watering increases soil moisture by ${avgIncrease.toFixed(1)}% on average`,
        suggestion: avgIncrease < 10 ? 'Consider increasing watering duration' : 'Current watering is effective'
      });
    }

    successResponse(res, {
      insights,
      stats: sensorStats[0] || {},
      wateringCount: wateringHistory.length
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/chat — Gemini conversational AI with sensor context
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, sensorContext = '', history = [], apiKey = '' } = req.body;

    if (!message) {
      return errorResponse(res, 'Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    const key = apiKey || config.API_KEYS.GEMINI;
    if (!key) {
      return errorResponse(
        res,
        'No Gemini API key configured. Add it in Settings → AI API Keys or set GEMINI_API_KEY in backend/.env',
        400
      );
    }

    // Dynamic import — only loaded when actually needed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Gemini requires history to:
    //   1. Contain only 'user' and 'model' roles
    //   2. Start with a 'user' turn
    //   3. Strictly alternate user → model → user → …
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
      return res.status(429).json({ success: false, error: 'Gemini quota exceeded — try again in a moment.' });
    }
    // Always return JSON with the real error message so frontend can display it
    return res.status(500).json({ success: false, error: `AI error: ${msg}` });
  }
};
