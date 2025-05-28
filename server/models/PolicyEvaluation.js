// server/models/PolicyEvaluation.js - Log policy evaluations for debugging
import mongoose from 'mongoose';

const policyEvaluationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resource: {
    modelName: String,
    resourceId: String
  },
  action: String,
  requestContext: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Evaluation results
  evaluatedPolicies: [{
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicyRule'
    },
    matched: Boolean,
    effect: String,
    conditions: [{
      attribute: String,
      operator: String,
      expectedValue: mongoose.Schema.Types.Mixed,
      actualValue: mongoose.Schema.Types.Mixed,
      result: Boolean
    }]
  }],
  
  finalDecision: {
    type: String,
    enum: ['allow', 'deny', 'indeterminate'],
    required: true
  },
  
  // Performance metrics
  evaluationTimeMs: Number,
  
  // Context
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We have our own timestamp
});

// TTL index to auto-delete old logs after 30 days
policyEvaluationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('PolicyEvaluation', policyEvaluationSchema);