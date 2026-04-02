import mongoose from 'mongoose';

const diseaseDetectionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    default: 'ESP32-CAM'
  },
  detectedDisease: {
    type: String,
    required: true,
    enum: [
      'healthy',
      'leafspot',
      'bacterialblight',
      'viralmosaic',
      'pestdamage',
      'leafmold',
      'unknown'
    ]
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  growthStage: {
    type: String,
    enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'unknown'],
    default: 'unknown'
  },
  imageUrl: {
    type: String,
    required: false
  },
  imageBase64: {
    type: String,
    required: false,
    select: false  // Don't include by default (large data)
  },
  edgeImpulseData: {
    projectId: String,
    inferenceTime: Number,  // milliseconds
    anomalyScore: Number,
    rawPredictions: mongoose.Schema.Types.Mixed
  },
  plantHealth: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    leafColor: String,
    leafSize: String,
    notes: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: String,
    enum: ['none', 'notified', 'adjusted_watering', 'requires_manual_intervention'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Indexes
diseaseDetectionSchema.index({ deviceId: 1, timestamp: -1 });
diseaseDetectionSchema.index({ detectedDisease: 1 });
diseaseDetectionSchema.index({ confidence: -1 });

// Static method to get latest detection
diseaseDetectionSchema.statics.getLatest = function(deviceId = 'ESP32-CAM') {
  return this.findOne({ deviceId }).sort({ timestamp: -1 });
};

// Static method to get detections within time range
diseaseDetectionSchema.statics.getRange = function(startDate, endDate, deviceId = 'ESP32-CAM') {
  return this.find({
    deviceId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

// Static method to get disease history
diseaseDetectionSchema.statics.getDiseaseHistory = function(days = 7, deviceId = 'ESP32-CAM') {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$detectedDisease',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        lastDetected: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get active alerts (diseases that need attention)
diseaseDetectionSchema.statics.getActiveAlerts = function(deviceId = 'ESP32-CAM') {
  return this.find({
    deviceId,
    detectedDisease: { $ne: 'healthy' },
    confidence: { $gte: 0.7 },
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ timestamp: -1 }).limit(10);
};

// Method to check if disease is critical
diseaseDetectionSchema.methods.isCritical = function() {
  const criticalDiseases = ['bacterialblight', 'viralmosaic', 'leafmold'];
  return criticalDiseases.includes(this.detectedDisease) && this.confidence >= 0.7;
};

const DiseaseDetection = mongoose.model('DiseaseDetection', diseaseDetectionSchema);

export default DiseaseDetection;

