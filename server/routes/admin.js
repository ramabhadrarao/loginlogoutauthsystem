// server/routes/admin.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Model from '../models/Model.js';
import Permission from '../models/Permission.js';
import AuditLog from '../models/AuditLog.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// ============ USERS MANAGEMENT ============
// Get all users (admin endpoint)
router.get('/users', checkPermission('users.read'), async (req, res) => {
  try {
    const users = await User.find().populate('permissions').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ MODELS MANAGEMENT ============
// Get all models
router.get('/models', checkPermission('models.manage'), async (req, res) => {
  try {
    const models = await Model.find().sort({ name: 1 });
    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create model validation
const createModelValidation = [
  body('name').trim().isLength({ min: 2 }).matches(/^[a-z_]+$/),
  body('displayName').trim().isLength({ min: 2 }),
  body('description').trim().isLength({ min: 5 })
];

// Create model
router.post('/models', checkPermission('models.manage'), createModelValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, displayName, description } = req.body;

    // Check if model already exists
    const existingModel = await Model.findOne({ name: name.toLowerCase() });
    if (existingModel) {
      return res.status(400).json({ message: 'Model with this name already exists' });
    }

    // Create the model
    const model = new Model({
      name: name.toLowerCase(),
      displayName,
      description
    });

    await model.save();

    // Auto-generate CRUD permissions for the model
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions = actions.map(action => ({
      modelId: model._id,
      action,
      permissionKey: `${model.name}.${action}`
    }));

    await Permission.insertMany(permissions);

    res.status(201).json(model);
  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update model
router.put('/models/:id', checkPermission('models.manage'), createModelValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { displayName, description } = req.body;

    const model = await Model.findByIdAndUpdate(
      id,
      { displayName, description },
      { new: true, runValidators: true }
    );

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    res.json(model);
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete model and its permissions
router.delete('/models/:id', checkPermission('models.manage'), async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model.findById(id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Don't allow deletion of core models
    const coreModels = ['users', 'colleges', 'attachments', 'settings'];
    if (coreModels.includes(model.name)) {
      return res.status(400).json({ message: 'Cannot delete core system models' });
    }

    // Delete associated permissions
    await Permission.deleteMany({ modelId: id });

    // Remove permissions from all users
    await User.updateMany(
      {},
      { $pull: { permissions: { $in: await Permission.find({ modelId: id }).distinct('_id') } } }
    );

    // Delete the model
    await Model.findByIdAndDelete(id);

    res.json({ message: 'Model and associated permissions deleted successfully' });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh model permissions (regenerate CRUD permissions)
router.post('/models/:id/refresh-permissions', checkPermission('models.manage'), async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model.findById(id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Delete existing permissions for this model
    await Permission.deleteMany({ modelId: id });

    // Create new CRUD permissions
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions = actions.map(action => ({
      modelId: model._id,
      action,
      permissionKey: `${model.name}.${action}`
    }));

    await Permission.insertMany(permissions);

    res.json({ message: 'Permissions refreshed successfully' });
  } catch (error) {
    console.error('Refresh permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PERMISSIONS MANAGEMENT ============
// Get all permissions
router.get('/permissions', checkPermission('permissions.manage'), async (req, res) => {
  try {
    const permissions = await Permission.find()
      .populate('modelId', 'name displayName')
      .sort({ permissionKey: 1 });
    
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user permissions (for permission management page)
router.get('/users/:id/permissions', checkPermission('permissions.manage'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('permissions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.permissions);
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign permissions to user (admin endpoint)
router.post('/users/:id/permissions', checkPermission('permissions.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate permissions exist
    const validPermissions = await Permission.find({ _id: { $in: permissions } });
    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({ message: 'Invalid permissions provided' });
    }

    const oldPermissions = user.permissions.map(p => p.toString());
    user.permissions = permissions;
    await user.save();

    // Log permission changes
    const addedPermissions = permissions.filter(p => !oldPermissions.includes(p));
    const removedPermissions = oldPermissions.filter(p => !permissions.includes(p));

    const auditEntries = [];
    
    for (const permissionId of addedPermissions) {
      const permission = validPermissions.find(p => p._id.toString() === permissionId);
      if (permission) {
        auditEntries.push({
          userId: user._id,
          action: 'granted',
          permissionKey: permission.permissionKey,
          changedBy: req.user._id,
          reason: 'Admin permission management'
        });
      }
    }

    for (const permissionId of removedPermissions) {
      const permission = await Permission.findById(permissionId);
      if (permission) {
        auditEntries.push({
          userId: user._id,
          action: 'revoked',
          permissionKey: permission.permissionKey,
          changedBy: req.user._id,
          reason: 'Admin permission management'
        });
      }
    }

    if (auditEntries.length > 0) {
      await AuditLog.insertMany(auditEntries);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ AUDIT LOG ============
// Get audit log
router.get('/audit-log', checkPermission('audit.read'), async (req, res) => {
  try {
    const { action, userId, limit = 50, page = 1 } = req.query;
    let query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (userId) {
      query.userId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'username email')
      .populate('changedBy', 'username email')
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Transform data to match frontend expectations
    const transformedLogs = auditLogs.map(log => ({
      _id: log._id,
      userId: log.userId?._id,
      userName: log.userId?.username || 'Unknown User',
      action: log.action,
      permissionKey: log.permissionKey,
      changedBy: log.changedBy?._id,
      changedByName: log.changedBy?.username || 'Unknown User',
      changedAt: log.changedAt,
      reason: log.reason
    }));

    const totalCount = await AuditLog.countDocuments(query);

    res.json({
      logs: transformedLogs,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;