// server/routes/colleges.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import College from '../models/College.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all colleges
router.get('/', checkPermission('colleges.read'), async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const colleges = await College.find(query).sort({ name: 1 });
    res.json(colleges);
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get college by ID
router.get('/:id', checkPermission('colleges.read'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create college validation
const collegeValidation = [
  body('name').trim().isLength({ min: 2 }),
  body('code').trim().isLength({ min: 2 }),
  body('website').optional().isURL(),
  body('email').optional().isEmail(),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/)
];

// Create college
router.post('/', checkPermission('colleges.create'), collegeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if college with same code exists
    const existingCollege = await College.findOne({ code: req.body.code.toUpperCase() });
    if (existingCollege) {
      return res.status(400).json({ message: 'College with this code already exists' });
    }

    const college = new College({
      ...req.body,
      code: req.body.code.toUpperCase()
    });

    await college.save();
    res.status(201).json(college);
  } catch (error) {
    console.error('Create college error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'College with this code already exists' });
    }
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
    const updateData = { ...req.body };
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const college = await College.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json(college);
  } catch (error) {
    console.error('Update college error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'College with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete college
router.delete('/:id', checkPermission('colleges.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const college = await College.findByIdAndDelete(id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error('Delete college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;