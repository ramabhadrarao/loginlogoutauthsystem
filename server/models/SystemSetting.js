// server/models/SystemSetting.js
import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: String,
    required: true
  },
  settingGroup: {
    type: String,
    default: 'general'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

export default mongoose.model('SystemSetting', systemSettingSchema);