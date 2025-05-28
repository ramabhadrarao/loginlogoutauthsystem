// server/routes/departments.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Department from '../models/Department.js';
import College from '../models/College.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', checkPermission('departments.read'), async (req, res) => {
  try {
    const { search, status, collegeId } = req.query;
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

    // Add college filter
    if (collegeId) {
      query.collegeId = collegeId;
    }

    const departments = await Department.find(query)
      .populate('collegeId', 'name code')
      .populate('hodId', 'username email')
      .sort({ name: 1 });

    // Transform data to include college and HOD names
    const transformedDepartments = departments.map(dept => ({
      ...dept.toObject(),
      collegeName: dept.collegeId?.name || 'Unknown College',
      collegeCode: dept.collegeId?.code || '',
      hodName: dept.hodId?.username || null,
      hodEmail: dept.hodId?.email || null
    }));

    res.json(transformedDepartments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department by ID
router.get('/:id', checkPermission('departments.read'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('collegeId', 'name code logo')
      .populate('hodId', 'username email');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const transformedDepartment = {
      ...department.toObject(),
      collegeName: department.collegeId?.name || 'Unknown College',
      collegeCode: department.collegeId?.code || '',
      hodName: department.hodId?.username || null,
      hodEmail: department.hodId?.email || null
    };

    res.json(transformedDepartment);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Department validation rules
const departmentValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Department name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Department code must be at least 2 characters'),
  body('collegeId').isMongoId().withMessage('Valid college ID is required'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('phone').optional().matches(/^[\+]?[\d\s\-\(\)]+$/).withMessage('Phone number format is invalid'),
  body('establishedDate').optional().isISO8601().withMessage('Established date must be valid')
];

// Create department
router.post('/', checkPermission('departments.create'), departmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, collegeId, hodId, logo, description, email, phone, establishedDate, status } = req.body;

    // Check if college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(400).json({ message: 'College not found' });
    }

    // Check if HOD exists (if provided)
    if (hodId) {
      const hod = await User.findById(hodId);
      if (!hod) {
        return res.status(400).json({ message: 'Head of Department not found' });
      }
    }

    // Check if department code is unique
    const existingDepartment = await Department.findOne({ code: code.toUpperCase() });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department with this code already exists' });
    }

    const department = new Department({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      collegeId,
      hodId: hodId || null,
      logo: logo?.trim() || undefined,
      description: description?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      establishedDate: establishedDate ? new Date(establishedDate) : undefined,
      status: status || 'active'
    });

    await department.save();
    
    // Populate the response
    await department.populate('collegeId', 'name code');
    await department.populate('hodId', 'username email');

    const transformedDepartment = {
      ...department.toObject(),
      collegeName: department.collegeId?.name || 'Unknown College',
      collegeCode: department.collegeId?.code || '',
      hodName: department.hodId?.username || null,
      hodEmail: department.hodId?.email || null
    };

    res.status(201).json(transformedDepartment);
  } catch (error) {
    console.error('Create department error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update department
router.put('/:id', checkPermission('departments.update'), departmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, collegeId, hodId, logo, description, email, phone, establishedDate, status } = req.body;

    // Check if college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(400).json({ message: 'College not found' });
    }

    // Check if HOD exists (if provided)
    if (hodId) {
      const hod = await User.findById(hodId);
      if (!hod) {
        return res.status(400).json({ message: 'Head of Department not found' });
      }
    }

    const updateData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      collegeId,
      hodId: hodId || null,
      logo: logo?.trim() || undefined,
      description: description?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      establishedDate: establishedDate ? new Date(establishedDate) : undefined,
      status: status || 'active'
    };

    const department = await Department.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('collegeId', 'name code')
     .populate('hodId', 'username email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const transformedDepartment = {
      ...department.toObject(),
      collegeName: department.collegeId?.name || 'Unknown College',
      collegeCode: department.collegeId?.code || '',
      hodName: department.hodId?.username || null,
      hodEmail: department.hodId?.email || null
    };

    res.json(transformedDepartment);
  } catch (error) {
    console.error('Update department error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete department
router.delete('/:id', checkPermission('departments.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get departments by college
router.get('/college/:collegeId', checkPermission('departments.read'), async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    const departments = await Department.find({ collegeId, status: 'active' })
      .populate('hodId', 'username email')
      .sort({ name: 1 });

    const transformedDepartments = departments.map(dept => ({
      ...dept.toObject(),
      hodName: dept.hodId?.username || null,
      hodEmail: dept.hodId?.email || null
    }));

    res.json(transformedDepartments);
  } catch (error) {
    console.error('Get departments by college error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;