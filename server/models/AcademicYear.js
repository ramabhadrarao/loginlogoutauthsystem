// server/models/AcademicYear.js
import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g., "2024-2025"
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true // e.g., "AY2024-25"
  },
  startYear: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100
  },
  endYear: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100,
    validate: {
      validator: function(value) {
        return value > this.startYear;
      },
      message: 'End year must be greater than start year'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'archived'],
    default: 'upcoming'
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

// Index for better query performance
academicYearSchema.index({ startYear: 1, endYear: 1 });
academicYearSchema.index({ isCurrent: 1 });
academicYearSchema.index({ status: 1 });

// Pre-save middleware to ensure only one current academic year
academicYearSchema.pre('save', async function(next) {
  if (this.isCurrent && this.isModified('isCurrent')) {
    // Remove isCurrent from all other academic years
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

// Virtual for display name
academicYearSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.startYear}-${this.endYear})`;
});

// Ensure virtual fields are serialized
academicYearSchema.set('toJSON', { virtuals: true });

export default mongoose.model('AcademicYear', academicYearSchema);