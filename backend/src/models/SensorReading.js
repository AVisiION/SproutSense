import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  soilMoisture: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  pH: {
    type: Number,
    required: false,
    min: 0,
    max: 14
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  light: {
    type: Number,
    required: true,
    min: 0
  },
  flowRate: {
    type: Number,
    required: false,
    min: 0
  },
  flowVolume: {
    type: Number,
    required: false,
    min: 0
  },
  leafCount: {
    type: Number,
    required: false,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  deviceId: {
    type: String,
    default: 'ESP32-SENSOR'
  }
}, {
  timestamps: true
});

// Index for efficient time-based queries
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });

// Static method to get latest readings
sensorReadingSchema.statics.getLatest = function(deviceId = 'ESP32-SENSOR') {
  return this.findOne({ deviceId }).sort({ timestamp: -1 });
};

// Static method to get readings within time range
sensorReadingSchema.statics.getRange = function(startDate, endDate, deviceId = 'ESP32-SENSOR') {
  return this.find({
    deviceId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

// Static method to get aggregated data (hourly averages)
sensorReadingSchema.statics.getHourlyAverages = function(hours = 24, deviceId = 'ESP32-SENSOR') {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d %H:00',
            date: '$timestamp'
          }
        },
        avgSoilMoisture: { $avg: '$soilMoisture' },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgLight: { $avg: '$light' },
        avgPH: { $avg: '$pH' },
        avgFlowRate: { $avg: '$flowRate' },
        avgFlowVolume: { $avg: '$flowVolume' },
        avgLeafCount: { $avg: '$leafCount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);

export default SensorReading;

