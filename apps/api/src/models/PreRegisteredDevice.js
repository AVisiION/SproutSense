import mongoose from 'mongoose';

const preRegisteredDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
      unique: true,
    },
    deviceSecret: {
      type: String,
      required: true,
      index: true,
      select: false,
      description: 'Hardcoded token pre-loaded in ESP32 firmware',
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const PreRegisteredDevice = mongoose.model('PreRegisteredDevice', preRegisteredDeviceSchema);

export default PreRegisteredDevice;
