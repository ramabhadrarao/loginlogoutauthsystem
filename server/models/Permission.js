// server/models/Permission.js
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete']
  },
  permissionKey: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Create permission key from model and action
permissionSchema.pre('save', async function(next) {
  if (!this.permissionKey) {
    const model = await mongoose.model('Model').findById(this.modelId);
    if (model) {
      this.permissionKey = `${model.name}.${this.action}`;
    }
  }
  next();
});

export default mongoose.model('Permission', permissionSchema);