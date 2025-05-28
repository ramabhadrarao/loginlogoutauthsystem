// server/routes/abac.js - ABAC Management API
import express from 'express';
import PolicyRule from '../models/PolicyRule.js';
import AttributeDefinition from '../models/AttributeDefinition.js';
import UserAttribute from '../models/UserAttribute.js';
import PolicyEvaluation from '../models/PolicyEvaluation.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// ============ ATTRIBUTE DEFINITIONS ============
// Get all attribute definitions
router.get('/attributes', checkPermission('abac.read'), async (req, res) => {
  try {
    const attributes = await AttributeDefinition.find({ isActive: true })
      .sort({ category: 1, name: 1 });
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create attribute definition
router.post('/attributes', checkPermission('abac.manage'), async (req, res) => {
  try {
    const attribute = new AttributeDefinition(req.body);
    await attribute.save();
    res.status(201).json(attribute);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// Update attribute definition
router.put('/attributes/:id', checkPermission('abac.manage'), async (req, res) => {
  try {
    const attribute = await AttributeDefinition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found' });
    }
    res.json(attribute);
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// Delete attribute definition
router.delete('/attributes/:id', checkPermission('abac.manage'), async (req, res) => {
  try {
    await AttributeDefinition.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Attribute deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ POLICY RULES ============
// Get all policy rules
router.get('/policies', checkPermission('abac.read'), async (req, res) => {
  try {
    const { modelName, isActive } = req.query;
    const filter = {};
    
    if (modelName) filter['resource.modelName'] = modelName;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const policies = await PolicyRule.find(filter)
      .populate('createdBy', 'username email')
      .populate('lastModifiedBy', 'username email')
      .sort({ priority: 1, createdAt: -1 });
    
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create policy rule
router.post('/policies', checkPermission('abac.manage'), async (req, res) => {
  try {
    const policy = new PolicyRule({
      ...req.body,
      createdBy: req.user._id
    });
    await policy.save();
    
    await policy.populate('createdBy', 'username email');
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ message: 'Policy creation error', error: error.message });
  }
});

// Update policy rule
router.put('/policies/:id', checkPermission('abac.manage'), async (req, res) => {
  try {
    const policy = await PolicyRule.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastModifiedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy lastModifiedBy', 'username email');
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: 'Policy update error', error: error.message });
  }
});

// Delete policy rule
router.delete('/policies/:id', checkPermission('abac.manage'), async (req, res) => {
  try {
    const policy = await PolicyRule.findByIdAndUpdate(
      req.params.id,
      { isActive: false, lastModifiedBy: req.user._id },
      { new: true }
    );
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    
    res.json({ message: 'Policy deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test policy evaluation
router.post('/policies/test', checkPermission('abac.manage'), async (req, res) => {
  try {
    const { userId, resource, action, context } = req.body;
    
    const evaluation = await abacEngine.evaluate(userId, resource, action, context);
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: 'Policy test error', error: error.message });
  }
});

// ============ USER ATTRIBUTES ============
// Get user attributes
router.get('/users/:userId/attributes', checkPermission('abac.read'), async (req, res) => {
  try {
    const userAttributes = await UserAttribute.find({ 
      userId: req.params.userId,
      isActive: true 
    }).populate('setBy', 'username email');
    
    res.json(userAttributes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set user attribute
router.post('/users/:userId/attributes', checkPermission('abac.manage'), async (req, res) => {
  try {
    const { attributeName, attributeValue, validFrom, validUntil } = req.body;
    
    // Update or create attribute
    const attribute = await UserAttribute.findOneAndUpdate(
      { userId: req.params.userId, attributeName },
      {
        attributeValue,
        validFrom,
        validUntil,
        setBy: req.user._id,
        isActive: true
      },
      { upsert: true, new: true }
    ).populate('setBy', 'username email');
    
    res.json(attribute);
  } catch (error) {
    res.status(400).json({ message: 'Attribute set error', error: error.message });
  }
});

// Remove user attribute
router.delete('/users/:userId/attributes/:attributeName', checkPermission('abac.manage'), async (req, res) => {
  try {
    await UserAttribute.findOneAndUpdate(
      { userId: req.params.userId, attributeName: req.params.attributeName },
      { isActive: false }
    );
    
    res.json({ message: 'Attribute removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ POLICY EVALUATIONS (AUDIT) ============
// Get policy evaluation logs
router.get('/evaluations', checkPermission('abac.read'), async (req, res) => {
  try {
    const { userId, modelName, action, decision, limit = 50, page = 1 } = req.query;
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (modelName) filter['resource.modelName'] = modelName;
    if (action) filter.action = action;
    if (decision) filter.finalDecision = decision;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const evaluations = await PolicyEvaluation.find(filter)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalCount = await PolicyEvaluation.countDocuments(filter);
    
    res.json({
      evaluations,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ UTILITIES ============
// Get available models for policy creation
router.get('/models', checkPermission('abac.read'), async (req, res) => {
  try {
    const models = await Model.find({ isActive: true }).select('name displayName');
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get data scope for current user
router.get('/my-scope/:modelName', async (req, res) => {
  try {
    const dataScope = await abacEngine.getDataScope(req.user._id, req.params.modelName);
    res.json(dataScope);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;