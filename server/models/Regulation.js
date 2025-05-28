// server/models/Regulation.js
import mongoose from 'mongoose';

const regulationSchema = new mongoose.Schema({
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
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  effectiveFromYear: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100
  },
  effectiveToYear: {
    type: Number,
    min: 1900,
    max: 2100,
    validate: {
      validator: function(value) {
        return !value || value >= this.effectiveFromYear;
      },
      message: 'Effective to year must be greater than or equal to effective from year'
    }
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
regulationSchema.index({ programId: 1, branchId: 1, status: 1 });
regulationSchema.index({ code: 1 });
regulationSchema.index({ effectiveFromYear: 1, effectiveToYear: 1 });

// Virtual to check if regulation is currently effective
regulationSchema.virtual('isCurrentlyEffective').get(function() {
  const currentYear = new Date().getFullYear();
  return this.effectiveFromYear <= currentYear && 
         (!this.effectiveToYear || this.effectiveToYear >= currentYear);
});

// Virtual for full regulation name
regulationSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Ensure virtual fields are serialized
regulationSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Regulation', regulationSchema);