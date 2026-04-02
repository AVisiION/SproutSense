import mongoose from 'mongoose';

const userDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
      unique: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    pairingCodeHash: {
      type: String,
      default: null,
      select: false,
    },
    pairingCodeExpiresAt: {
      type: Date,
      default: null,
    },
    tokenHash: {
      type: String,
      default: null,
      select: false,
    },
    tokenIssuedAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    lastSeenIp: {
      type: String,
      default: null,
    },
    firmwareVersion: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

userDeviceSchema.index({ userId: 1, createdAt: -1 });

const UserDevice = mongoose.model('UserDevice', userDeviceSchema);

export default UserDevice;
