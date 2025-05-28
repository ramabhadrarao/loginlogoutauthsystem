// server/routes/users.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import AuditLog from '../models/AuditLog.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', checkPermission('users.read'), async (req, res) => {
  try {
    const users = await User.find().populate('permissions');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', checkPermission('users.read'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('permissions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user validation
const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').trim().isLength({ min: 3 }),
  body('password').isLength({ min: 6 })
];

// Create user
router.post('/', checkPermission('users.create'), createUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, permissions, isSuperAdmin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create user
    const user = new User({
      email,
      username,
      password,
      isSuperAdmin: isSuperAdmin || false,
      permissions: permissions || []
    });

    await user.save();
    await user.populate('permissions');

    // Log permission assignments
    if (permissions && permissions.length > 0) {
      const auditEntries = permissions.map(permissionId => ({
        userId: user._id,
        action: 'granted',
        permissionKey: 'bulk_assignment',
        changedBy: req.user._id,
        reason: 'Initial user creation'
      }));
      await AuditLog.insertMany(auditEntries);
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user validation
const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('username').optional().trim().isLength({ min: 3 }),
  body('password').optional().isLength({ min: 6 })
];

// Update user
router.put('/:id', checkPermission('users.update'), updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, username, password, permissions, isSuperAdmin } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    if (email) user.email = email;
    if (username) user.username = username;
    if (password) user.password = password;
    if (typeof isSuperAdmin !== 'undefined') user.isSuperAdmin = isSuperAdmin;

    // Update permissions if provided
    if (permissions) {
      const oldPermissions = user.permissions.map(p => p.toString());
      user.permissions = permissions;

      // Log permission changes
      const addedPermissions = permissions.filter(p => !oldPermissions.includes(p));
      const removedPermissions = oldPermissions.filter(p => !permissions.includes(p));

      const auditEntries = [
        ...addedPermissions.map(permissionId => ({
          userId: user._id,
          action: 'granted',
          permissionKey: 'permission_update',
          changedBy: req.user._id,
          reason: 'User permission update'
        })),
        ...removedPermissions.map(permissionId => ({
          userId: user._id,
          action: 'revoked',
          permissionKey: 'permission_update',
          changedBy: req.user._id,
          reason: 'User permission update'
        }))
      ];

      if (auditEntries.length > 0) {
        await AuditLog.insertMany(auditEntries);
      }
    }

    await user.save();
    await user.populate('permissions');

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', checkPermission('users.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user permissions
router.get('/:id/permissions', checkPermission('users.read'), async (req, res) => {
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

// Assign permissions to user
router.post('/:id/permissions', checkPermission('permissions.manage'), async (req, res) => {
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

    const auditEntries = [
      ...addedPermissions.map(permissionId => ({
        userId: user._id,
        action: 'granted',
        permissionKey: 'permission_assignment',
        changedBy: req.user._id,
        reason: 'Manual permission assignment'
      })),
      ...removedPermissions.map(permissionId => ({
        userId: user._id,
        action: 'revoked',
        permissionKey: 'permission_assignment',
        changedBy: req.user._id,
        reason: 'Manual permission revocation'
      }))
    ];

    if (auditEntries.length > 0) {
      await AuditLog.insertMany(auditEntries);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;