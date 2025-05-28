// server/models/Program.js
import mongoose from 'mongoose';

const programSchema = new mongoose.Schema({
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Faculty coordinator
    default: null
  },
  duration: {
    type: String,
    trim: true // e.g., "4 years", "2 years"
  },
  degreeType: {
    type: String,
    enum: ["Bachelor's", "Master's", "Doctoral", "Diploma", "Certificate"],
    required: true
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
programSchema.index({ departmentId: 1, status: 1 });
programSchema.index({ code: 1 });
programSchema.index({ degreeType: 1, status: 1 });

// Virtual for full program name
programSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Ensure virtual fields are serialized
programSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Program', programSchema);