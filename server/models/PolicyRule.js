// server/models/PolicyRule.js - Dynamic policy rules
import mongoose from 'mongoose';

const policyRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 100 // Lower number = higher priority
  },
  
  // SUBJECT: Who can access (user attributes)
  subject: {
    type: String,
    enum: ['user', 'role', 'group', 'any'],
    default: 'user'
  },
  subjectConditions: [{
    attribute: {
      type: String,
      required: true // e.g., 'department', 'role', 'designation'
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'in', 'not_in', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'between'],
      required: true
    },
    value: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
    logicalOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  
  // RESOURCE: What can be accessed (resource attributes)
  resource: {
    modelName: {
      type: String,
      required: true // e.g., 'Student', 'Course', 'Faculty'
    },
    resourceConditions: [{
      attribute: {
        type: String,
        required: true // e.g., 'departmentId', 'status', 'level'
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'in', 'not_in', 'contains', 'same_as_user', 'different_from_user'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed,
      referenceUserAttribute: String, // For 'same_as_user' operator
      logicalOperator: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND'
      }
    }]
  },
  
  // ACTION: What actions are allowed
  actions: [{
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import'],
    required: true
  }],
  
  // ENVIRONMENT: When/where access is allowed
  environmentConditions: [{
    attribute: {
      type: String // e.g., 'time', 'ip_address', 'location', 'day_of_week'
    },
    operator: String,
    value: mongoose.Schema.Types.Mixed
  }],
  
  // EFFECT: Allow or Deny
  effect: {
    type: String,
    enum: ['allow', 'deny'],
    default: 'allow'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Policy grouping
  policyGroup: {
    type: String,
    default: 'default'
  },
  
  // Advanced features
  timeBasedAccess: {
    validFrom: Date,
    validUntil: Date,
    allowedHours: [{
      start: String, // "09:00"
      end: String    // "17:00"
    }],
    allowedDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  }
}, {
  timestamps: true
});

// Compound indexes for efficient policy evaluation
policyRuleSchema.index({ 'resource.modelName': 1, isActive: 1, priority: 1 });
policyRuleSchema.index({ subject: 1, isActive: 1 });
policyRuleSchema.index({ effect: 1, isActive: 1 });

export default mongoose.model('PolicyRule', policyRuleSchema);