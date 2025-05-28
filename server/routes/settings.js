// server/routes/settings.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import SystemSetting from '../models/SystemSetting.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all settings
router.get('/', checkPermission('settings.read'), async (req, res) => {
  try {
    const { group } = req.query;
    let query = {};

    if (group) {
      query.settingGroup = group;
    }

    const settings = await SystemSetting.find(query).sort({ settingGroup: 1, settingKey: 1 });
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get setting by key
router.get('/:key', checkPermission('settings.read'), async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ settingKey: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings validation
const settingsValidation = [
  body('settingValue').trim().notEmpty(),
  body('settingGroup').optional().trim(),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
];

// Create or update setting
router.put('/:key', checkPermission('settings.update'), settingsValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { settingValue, settingGroup, description, isPublic } = req.body;

    const setting = await SystemSetting.findOneAndUpdate(
      { settingKey: key },
      {
        settingKey: key,
        settingValue,
        ...(settingGroup && { settingGroup }),
        ...(description && { description }),
        ...(typeof isPublic !== 'undefined' && { isPublic })
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json(setting);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update settings
router.patch('/', checkPermission('settings.update'), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }

    const updatePromises = settings.map(({ settingKey, settingValue, settingGroup, description, isPublic }) =>
      SystemSetting.findOneAndUpdate(
        { settingKey },
        {
          settingKey,
          settingValue,
          ...(settingGroup && { settingGroup }),
          ...(description && { description }),
          ...(typeof isPublic !== 'undefined' && { isPublic })
        },
        { 
          new: true, 
          upsert: true, 
          runValidators: true,
          setDefaultsOnInsert: true
        }
      )
    );

    const updatedSettings = await Promise.all(updatePromises);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete setting
router.delete('/:key', checkPermission('settings.update'), async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SystemSetting.findOneAndDelete({ settingKey: key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public settings (no authentication required)
router.get('/public/all', async (req, res) => {
  try {
    const settings = await SystemSetting.find({ isPublic: true })
      .select('settingKey settingValue settingGroup')
      .sort({ settingGroup: 1, settingKey: 1 });
    
    res.json(settings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;