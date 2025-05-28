// server/models/Semester.js
import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g., "Semester 1", "Fall 2024"
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  regulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation',
    required: true
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12 // Allows for flexibility in different program structures
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
  registrationStartDate: {
    type: Date
  },
  registrationEndDate: {
    type: Date
  },
  examStartDate: {
    type: Date
  },
  examEndDate: {
    type: Date
  },
  resultPublishDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'registration_open', 'ongoing', 'exam_period', 'completed', 'archived'],
    default: 'upcoming'
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

// Compound index for better query performance
semesterSchema.index({ academicYearId: 1, regulationId: 1, semesterNumber: 1 });
semesterSchema.index({ status: 1 });
semesterSchema.index({ startDate: 1, endDate: 1 });

// Virtual for display name
semesterSchema.virtual('displayName').get(function() {
  return `${this.name} (Semester ${this.semesterNumber})`;
});

// Virtual to check if semester is currently active
semesterSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.status === 'ongoing';
});

// Ensure virtual fields are serialized
semesterSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Semester', semesterSchema);