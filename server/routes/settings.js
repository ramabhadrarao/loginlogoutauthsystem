import express from 'express';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all settings
router.get('/', checkPermission('settings.read'), async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_group');

    if (error) throw error;

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings validation
const settingsValidation = [
  body('setting_key').trim().notEmpty(),
  body('setting_value').trim().notEmpty(),
  body('setting_group').optional().trim()
];

// Update settings
router.put('/:key', checkPermission('settings.update'), settingsValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { data: setting, error } = await supabase
      .from('system_settings')
      .update(req.body)
      .eq('setting_key', key)
      .select()
      .single();

    if (error) throw error;

    res.json(setting);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;