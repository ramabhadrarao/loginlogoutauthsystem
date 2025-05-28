// server/routes/academicYears.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import AcademicYear from '../models/AcademicYear.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all academic years
router.get('/', checkPermission('academic_years.read'), async (req, res) => {
  try {
    const { search, status, year } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add year filter
    if (year) {
      const yearNum = parseInt(year);
      query.$or = [
        { startYear: yearNum },
        { endYear: yearNum }
      ];
    }

    const academicYears = await AcademicYear.find(query)
      .sort({ startYear: -1, startDate: -1 });

    res.json(academicYears);
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current academic year
router.get('/current', checkPermission('academic_years.read'), async (req, res) => {
  try {
    const currentAcademicYear = await AcademicYear.findOne({ isCurrent: true });
    
    if (!currentAcademicYear) {
      return res.status(404).json({ message: 'No current academic year found' });
    }

    res.json(currentAcademicYear);
  } catch (error) {
    console.error('Get current academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get academic year by ID
router.get('/:id', checkPermission('academic_years.read'), async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    res.json(academicYear);
  } catch (error) {
    console.error('Get academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Academic year validation rules
const academicYearValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Academic year name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Academic year code must be at least 2 characters'),
  body('startYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid start year is required'),
  body('endYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid end year is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('isCurrent').optional().isBoolean().withMessage('isCurrent must be a boolean'),
  body('description').optional().trim()
];

// Create academic year
router.post('/', checkPermission('academic_years.create'), academicYearValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, startYear, endYear, startDate, endDate, isCurrent, description, status } = req.body;

    // Validate year sequence
    if (endYear <= startYear) {
      return res.status(400).json({ message: 'End year must be greater than start year' });
    }

    // Validate date sequence
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check if academic year code is unique
    const existingAcademicYear = await AcademicYear.findOne({ code: code.toUpperCase() });
    if (existingAcademicYear) {
      return res.status(400).json({ message: 'Academic year with this code already exists' });
    }

    const academicYear = new AcademicYear({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      startYear,
      endYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent || false,
      description: description?.trim(),
      status: status || 'upcoming'
    });

    await academicYear.save();
    res.status(201).json(academicYear);
  } catch (error) {
    console.error('Create academic year error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Academic year with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update academic year
router.put('/:id', checkPermission('academic_years.update'), academicYearValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, startYear, endYear, startDate, endDate, isCurrent, description, status } = req.body;

    // Validate year sequence
    if (endYear <= startYear) {
      return res.status(400).json({ message: 'End year must be greater than start year' });
    }

    // Validate date sequence
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const updateData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      startYear,
      endYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent || false,
      description: description?.trim(),
      status: status || 'upcoming'
    };

    const academicYear = await AcademicYear.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    res.json(academicYear);
  } catch (error) {
    console.error('Update academic year error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Academic year with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Set current academic year
router.put('/:id/set-current', checkPermission('academic_years.update'), async (req, res) => {
  try {
    const { id } = req.params;

    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Set this academic year as current (middleware will handle removing current from others)
    academicYear.isCurrent = true;
    await academicYear.save();

    res.json({ message: `${academicYear.name} set as current academic year` });
  } catch (error) {
    console.error('Set current academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete academic year
router.delete('/:id', checkPermission('academic_years.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Prevent deletion of current academic year
    if (academicYear.isCurrent) {
      return res.status(400).json({ message: 'Cannot delete the current academic year' });
    }

    await AcademicYear.findByIdAndDelete(id);
    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get academic year statistics
router.get('/stats/overview', checkPermission('academic_years.read'), async (req, res) => {
  try {
    const stats = await AcademicYear.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    
    const overview = {
      totalAcademicYears: await AcademicYear.countDocuments(),
      currentAcademicYear: currentYear ? currentYear.name : 'None set',
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json(overview);
  } catch (error) {
    console.error('Get academic year stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;