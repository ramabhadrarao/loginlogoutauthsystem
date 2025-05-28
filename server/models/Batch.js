// server/models/Batch.js
import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g., "CSE-2024", "Batch of 2024"
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
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Faculty mentor for the batch
    default: null
  },
  maxStudents: {
    type: Number,
    min: 1,
    default: 60
  },
  currentStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'graduated', 'archived'],
    default: 'planned'
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

// Index for better query performance
batchSchema.index({ programId: 1, branchId: 1, status: 1 });
batchSchema.index({ startYear: 1, endYear: 1 });
batchSchema.index({ status: 1 });

// Virtual for batch duration
batchSchema.virtual('duration').get(function() {
  return this.endYear - this.startYear;
});

// Virtual for current academic year (which year the batch is currently in)
batchSchema.virtual('currentAcademicYear').get(function() {
  const currentYear = new Date().getFullYear();
  if (currentYear < this.startYear) {
    return 0; // Not started yet
  } else if (currentYear >= this.endYear) {
    return this.duration; // Graduated
  } else {
    return currentYear - this.startYear + 1;
  }
});

// Virtual for display name
batchSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.startYear}-${this.endYear})`;
});

// Virtual to check if batch is currently active
batchSchema.virtual('isActive').get(function() {
  const currentYear = new Date().getFullYear();
  return currentYear >= this.startYear && currentYear < this.endYear && this.status === 'active';
});

// Virtual for available seats
batchSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.maxStudents - this.currentStudents);
});

// Pre-save middleware to validate current students
batchSchema.pre('save', function(next) {
  if (this.currentStudents > this.maxStudents) {
    next(new Error('Current students cannot exceed maximum students'));
  } else {
    next();
  }
});

// Ensure virtual fields are serialized
batchSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Batch', batchSchema);