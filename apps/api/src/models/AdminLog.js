import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  actor: {
    type: String,
    default: 'admin'
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  level: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  section: {
    type: String,
    default: 'admin-panel'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ level: 1, createdAt: -1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

export default AdminLog;
