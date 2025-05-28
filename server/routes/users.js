import express from 'express';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all users
router.get('/', checkPermission('users.read'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*, user_permissions(permission_id)');

    if (error) throw error;

    // Remove sensitive data
    users.forEach(user => delete user.password_hash);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
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

    const { email, username, password, permissions } = req.body;

    // Create user in Supabase
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username }
    });

    if (error) throw error;

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      const permissionInserts = permissions.map(permissionId => ({
        user_id: user.id,
        permission_id: permissionId
      }));

      const { error: permError } = await supabase
        .from('user_permissions')
        .insert(permissionInserts);

      if (permError) throw permError;
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
    const { email, username, password, permissions } = req.body;

    // Update user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .update({ email, username })
      .eq('id', id)
      .single();

    if (error) throw error;

    // Update password if provided
    if (password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(
        id,
        { password }
      );

      if (pwError) throw pwError;
    }

    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', id);

      // Insert new permissions
      const permissionInserts = permissions.map(permissionId => ({
        user_id: id,
        permission_id: permissionId
      }));

      const { error: permError } = await supabase
        .from('user_permissions')
        .insert(permissionInserts);

      if (permError) throw permError;
    }

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

    // Delete user from Supabase
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;