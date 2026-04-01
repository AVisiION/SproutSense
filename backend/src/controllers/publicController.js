import SensorReading from '../models/SensorReading.js';
import WateringLog from '../models/WateringLog.js';
import DiseaseDetection from '../models/DiseaseDetection.js';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeReading(reading) {
  return {
    timestamp: reading.timestamp,
    soilMoisture: toNumber(reading.soilMoisture),
    temperature: toNumber(reading.temperature),
    humidity: toNumber(reading.humidity),
    light: toNumber(reading.light),
    pH: toNumber(reading.pH),
  };
}

export async function getPublicOverview(req, res, next) {
  try {
    const latest = await SensorReading.findOne({ deviceId: 'ESP32-SENSOR' })
      .sort({ timestamp: -1 })
      .select('soilMoisture temperature humidity light pH timestamp')
      .lean();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [wateringToday, diseaseStats] = await Promise.all([
      WateringLog.aggregate([
        { $match: { deviceId: 'ESP32-SENSOR', startTime: { $gte: todayStart } } },
        { $group: { _id: null, count: { $sum: 1 }, volumeML: { $sum: '$volumeML' } } },
      ]),
      DiseaseDetection.aggregate([
        {
          $match: {
            deviceId: 'ESP32-CAM',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: '$detectedDisease',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const wateringSummary = wateringToday[0] || { count: 0, volumeML: 0 };

    return res.json({
      success: true,
      data: {
        latest: latest ? normalizeReading(latest) : null,
        wateringToday: {
          count: toNumber(wateringSummary.count),
          volumeML: Math.round(toNumber(wateringSummary.volumeML)),
        },
        diseaseSignals24h: diseaseStats.map((item) => ({
          disease: item._id,
          count: toNumber(item.count),
        })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicAnalyticsPreview(req, res, next) {
  try {
    const hours = Math.min(Math.max(parseInt(req.query.hours || '24', 10), 6), 72);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({
      deviceId: 'ESP32-SENSOR',
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .select('soilMoisture temperature humidity light pH timestamp')
      .lean();

    const sampled = readings.filter((_, index) => index % 3 === 0).map(normalizeReading);

    const aggregates = readings.reduce(
      (acc, row) => {
        acc.count += 1;
        acc.soil += toNumber(row.soilMoisture);
        acc.temp += toNumber(row.temperature);
        acc.humidity += toNumber(row.humidity);
        acc.light += toNumber(row.light);
        return acc;
      },
      { count: 0, soil: 0, temp: 0, humidity: 0, light: 0 }
    );

    const count = aggregates.count || 1;

    return res.json({
      success: true,
      data: {
        points: sampled,
        summary: {
          avgSoilMoisture: Number((aggregates.soil / count).toFixed(1)),
          avgTemperature: Number((aggregates.temp / count).toFixed(1)),
          avgHumidity: Number((aggregates.humidity / count).toFixed(1)),
          avgLight: Number((aggregates.light / count).toFixed(0)),
          sourceCount: aggregates.count,
        },
        windowHours: hours,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicReportsPreview(req, res, next) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [watering, diseases] = await Promise.all([
      WateringLog.aggregate([
        { $match: { deviceId: 'ESP32-SENSOR', startTime: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
            },
            cycles: { $sum: 1 },
            volumeML: { $sum: '$volumeML' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      DiseaseDetection.aggregate([
        { $match: { deviceId: 'ESP32-CAM', timestamp: { $gte: since } } },
        { $group: { _id: '$detectedDisease', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        weeklyWatering: watering.map((item) => ({
          day: item._id,
          cycles: toNumber(item.cycles),
          volumeML: Math.round(toNumber(item.volumeML)),
        })),
        diseaseDistribution: diseases.map((item) => ({
          disease: item._id,
          count: toNumber(item.count),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
