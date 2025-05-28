// server/models/AuditLog.js
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['granted', 'revoked'],
    required: true
  },
  permissionKey: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String
  }
}, {
  timestamps: { createdAt: 'changedAt', updatedAt: false }
});

export default mongoose.model('AuditLog', auditLogSchema);