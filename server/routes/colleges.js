import express from 'express';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all colleges
router.get('/', checkPermission('colleges.read'), async (req, res) => {
  try {
    const { data: colleges, error } = await supabase
      .from('colleges')
      .select('*');

    if (error) throw error;

    res.json(colleges);
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create college validation
const collegeValidation = [
  body('name').trim().isLength({ min: 2 }),
  body('code').trim().isLength({ min: 2 }),
  body('website').optional().isURL(),
  body('email').optional().isEmail(),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/)
];

// Create college
router.post('/', checkPermission('colleges.create'), collegeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data: college, error } = await supabase
      .from('colleges')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(college);
  } catch (error) {
    console.error('Create college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update college
router.put('/:id', checkPermission('colleges.update'), collegeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { data: college, error } = await supabase
      .from('colleges')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(college);
  } catch (error) {
    console.error('Update college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete college
router.delete('/:id', checkPermission('colleges.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('colleges')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error('Delete college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;