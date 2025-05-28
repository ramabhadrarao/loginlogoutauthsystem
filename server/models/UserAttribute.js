// server/models/UserAttribute.js - Store dynamic user attributes
import mongoose from 'mongoose';

const userAttributeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attributeName: {
    type: String,
    required: true // From AttributeDefinition.name
  },
  attributeValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Metadata
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index
userAttributeSchema.index({ userId: 1, attributeName: 1 }, { unique: true });

export default mongoose.model('UserAttribute', userAttributeSchema);