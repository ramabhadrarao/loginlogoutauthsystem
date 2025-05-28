// server/models/Branch.js
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Branch coordinator
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

// Index for better query performance
branchSchema.index({ programId: 1, status: 1 });
branchSchema.index({ code: 1 });

// Virtual for full branch name
branchSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Ensure virtual fields are serialized
branchSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Branch', branchSchema);