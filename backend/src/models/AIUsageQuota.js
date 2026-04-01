import mongoose from 'mongoose';

const DAILY_AI_LIMIT = 2;

function normalizeLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DAILY_AI_LIMIT;
  }
  return parsed;
}

const aiUsageQuotaSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    default: 'ESP32-SENSOR'
  },
  dateKey: {
    type: String,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  dailyLimit: {
    type: Number,
    default: DAILY_AI_LIMIT,
    min: 1
  },
  lastUsedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

aiUsageQuotaSchema.index({ deviceId: 1, dateKey: 1 }, { unique: true });
aiUsageQuotaSchema.index({ updatedAt: -1 });

aiUsageQuotaSchema.statics.getDateKey = function(date = new Date()) {
  return date.toISOString().slice(0, 10);
};

aiUsageQuotaSchema.statics.getNextResetAt = function(now = new Date()) {
  const resetAt = new Date(now);
  resetAt.setUTCHours(24, 0, 0, 0);
  return resetAt;
};

aiUsageQuotaSchema.statics.formatSnapshot = function(doc, deviceId, dateKey, requestedLimit = DAILY_AI_LIMIT) {
  const dailyLimit = doc?.dailyLimit || normalizeLimit(requestedLimit);
  const usedCount = doc?.usedCount || 0;
  const remaining = Math.max(0, dailyLimit - usedCount);

  return {
    deviceId,
    dateKey,
    usedCount,
    dailyLimit,
    remaining,
    exhausted: usedCount >= dailyLimit,
    lastUsedAt: doc?.lastUsedAt || null,
    resetAt: this.getNextResetAt()
  };
};

aiUsageQuotaSchema.statics.getTodayUsage = async function(deviceId = 'ESP32-SENSOR') {
  const dateKey = this.getDateKey();
  const quotaDoc = await this.findOne({ deviceId, dateKey }).lean();
  return this.formatSnapshot(quotaDoc, deviceId, dateKey);
};

aiUsageQuotaSchema.statics.getTodayUsageWithLimit = async function(deviceId = 'ESP32-SENSOR', dailyLimit = DAILY_AI_LIMIT) {
  const dateKey = this.getDateKey();
  const quotaDoc = await this.findOne({ deviceId, dateKey }).lean();
  return this.formatSnapshot(quotaDoc, deviceId, dateKey, dailyLimit);
};

aiUsageQuotaSchema.statics.consumeTodayQuota = async function(deviceId = 'ESP32-SENSOR', dailyLimit = DAILY_AI_LIMIT) {
  const now = new Date();
  const dateKey = this.getDateKey(now);
  const effectiveLimit = normalizeLimit(dailyLimit);

  await this.updateOne(
    { deviceId, dateKey },
    {
      $setOnInsert: {
        usedCount: 0,
        dailyLimit: effectiveLimit,
        lastUsedAt: null
      }
    },
    { upsert: true }
  );

  await this.updateOne(
    { deviceId, dateKey },
    {
      $set: {
        dailyLimit: effectiveLimit
      }
    }
  );

  const quotaDoc = await this.findOneAndUpdate(
    {
      deviceId,
      dateKey,
      usedCount: { $lt: effectiveLimit }
    },
    {
      $inc: { usedCount: 1 },
      $set: { lastUsedAt: now }
    },
    { new: true }
  ).lean();

  if (!quotaDoc) {
    const snapshot = await this.getTodayUsageWithLimit(deviceId, effectiveLimit);
    return {
      consumed: false,
      ...snapshot
    };
  }

  const snapshot = this.formatSnapshot(quotaDoc, deviceId, dateKey, effectiveLimit);
  return {
    consumed: true,
    ...snapshot
  };
};

const AIUsageQuota = mongoose.model('AIUsageQuota', aiUsageQuotaSchema);

export default AIUsageQuota;
