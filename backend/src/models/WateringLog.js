import mongoose from 'mongoose';

const wateringLogSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // seconds
  },
  volumeML: {
    type: Number,
    default: 0
  },
  triggerType: {
    type: String,
    enum: ['auto', 'manual', 'scheduled', 'ai'],
    default: 'manual'
  },
  soilMoistureBefore: {
    type: Number,
    min: 0,
    max: 100
  },
  soilMoistureAfter: {
    type: Number,
    min: 0,
    max: 100
  },
  success: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  },
  deviceId: {
    type: String,
    default: 'ESP32-001'
  }
}, {
  timestamps: true
});

// Index for efficient queries
wateringLogSchema.index({ startTime: -1 });
wateringLogSchema.index({ deviceId: 1, startTime: -1 });

// Calculate duration before saving
wateringLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Static method to get today's watering count
wateringLogSchema.statics.getTodayCount = function(deviceId = 'ESP32-001') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.countDocuments({
    deviceId,
    startTime: { $gte: today }
  });
};

// Static method to get total water used today
wateringLogSchema.statics.getTodayVolume = function(deviceId = 'ESP32-001') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    {
      $match: {
        deviceId,
        startTime: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: '$volumeML' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get watering history
wateringLogSchema.statics.getHistory = function(days = 7, deviceId = 'ESP32-001') {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    deviceId,
    startTime: { $gte: startDate }
  }).sort({ startTime: -1 });
};

const WateringLog = mongoose.model('WateringLog', wateringLogSchema);

export default WateringLog;
