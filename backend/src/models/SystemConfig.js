import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    default: 'ESP32-001'
  },
  moistureThreshold: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  autoMode: {
    type: Boolean,
    default: false
  },
  espIp: {
    type: String,
    default: ''
  },
  wateringDurationMs: {
    type: Number,
    default: 5000 // 5 seconds default
  },
  maxWateringCyclesPerDay: {
    type: Number,
    default: 3
  },
  sensorReadInterval: {
    type: Number,
    default: 5000 // 5 seconds
  },
  pumpFlowRate: {
    type: Number,
    default: 20 // mL per second
  },
  notifications: {
    email: {
      enabled: { type: Boolean, default: false },
      address: String
    },
    push: {
      enabled: { type: Boolean, default: false }
    }
  },
  calibration: {
    moistureDry: { type: Number, default: 2800 },
    moistureWet: { type: Number, default: 1200 },
    phOffset: { type: Number, default: 0 }
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    times: [String] // e.g., ['08:00', '18:00']
  }
}, {
  timestamps: true
});

// Static method to get or create default config
systemConfigSchema.statics.getConfig = async function(deviceId = 'ESP32-001') {
  let config = await this.findOne({ deviceId });
  
  if (!config) {
    config = await this.create({ deviceId });
  }
  
  return config;
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
