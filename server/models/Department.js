// server/models/Department.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
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
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to faculty/user table
    default: null
  },
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  establishedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' }
});

// Index for better query performance
departmentSchema.index({ collegeId: 1, status: 1 });
departmentSchema.index({ code: 1 });

export default mongoose.model('Department', departmentSchema);