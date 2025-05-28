// server/models/AttributeDefinition.js - Define what attributes exist in the system
import mongoose from 'mongoose';

const attributeDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // e.g., 'department', 'role', 'location', 'designation'
  },
  displayName: {
    type: String,
    required: true // e.g., 'Department', 'User Role', 'Office Location'
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'reference', 'array'],
    required: true
  },
  referenceModel: {
    type: String, // 'Department', 'College', 'User' - only for reference type
    required: false
  },
  possibleValues: [{
    value: String,
    label: String
  }], // For enum-like attributes
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['user', 'resource', 'environment', 'context'],
    required: true
  },
  description: String,
  validationRules: {
    min: Number,
    max: Number,
    pattern: String,
    customValidator: String
  }
}, {
  timestamps: true
});

export default mongoose.model('AttributeDefinition', attributeDefinitionSchema);