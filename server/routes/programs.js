// server/routes/programs.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all programs
router.get('/', checkPermission('programs.read'), async (req, res) => {
  try {
    const { search, status, departmentId, degreeType } = req.query;
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

    // Add department filter
    if (departmentId) {
      query.departmentId = departmentId;
    }

    // Add degree type filter
    if (degreeType) {
      query.degreeType = degreeType;
    }

    const programs = await Program.find(query)
      .populate('departmentId', 'name code collegeName')
      .populate('coordinatorId', 'username email')
      .sort({ name: 1 });

    // Transform data to include department and coordinator names
    const transformedPrograms = programs.map(program => ({
      ...program.toObject(),
      departmentName: program.departmentId?.name || 'Unknown Department',
      departmentCode: program.departmentId?.code || '',
      coordinatorName: program.coordinatorId?.username || null,
      coordinatorEmail: program.coordinatorId?.email || null
    }));

    res.json(transformedPrograms);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get program by ID
router.get('/:id', checkPermission('programs.read'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('departmentId', 'name code collegeName')
      .populate('coordinatorId', 'username email');
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const transformedProgram = {
      ...program.toObject(),
      departmentName: program.departmentId?.name || 'Unknown Department',
      departmentCode: program.departmentId?.code || '',
      coordinatorName: program.coordinatorId?.username || null,
      coordinatorEmail: program.coordinatorId?.email || null
    };

    res.json(transformedProgram);
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Program validation rules
const programValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Program name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Program code must be at least 2 characters'),
  body('departmentId').isMongoId().withMessage('Valid department ID is required'),
  body('degreeType').isIn(["Bachelor's", "Master's", "Doctoral", "Diploma", "Certificate"]).withMessage('Valid degree type is required'),
  body('duration').optional().trim(),
  body('coordinatorId').optional().isMongoId().withMessage('Valid coordinator ID required'),
  body('description').optional().trim()
];

// Create program
router.post('/', checkPermission('programs.create'), programValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, departmentId, coordinatorId, duration, degreeType, description, status } = req.body;

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Check if coordinator exists (if provided)
    if (coordinatorId) {
      const coordinator = await User.findById(coordinatorId);
      if (!coordinator) {
        return res.status(400).json({ message: 'Coordinator not found' });
      }
    }

    // Check if program code is unique
    const existingProgram = await Program.findOne({ code: code.toUpperCase() });
    if (existingProgram) {
      return res.status(400).json({ message: 'Program with this code already exists' });
    }

    const program = new Program({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      departmentId,
      coordinatorId: coordinatorId || null,
      duration: duration?.trim(),
      degreeType,
      description: description?.trim(),
      status: status || 'active'
    });

    await program.save();
    
    // Populate the response
    await program.populate('departmentId', 'name code');
    await program.populate('coordinatorId', 'username email');

    const transformedProgram = {
      ...program.toObject(),
      departmentName: program.departmentId?.name || 'Unknown Department',
      departmentCode: program.departmentId?.code || '',
      coordinatorName: program.coordinatorId?.username || null,
      coordinatorEmail: program.coordinatorId?.email || null
    };

    res.status(201).json(transformedProgram);
  } catch (error) {
    console.error('Create program error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Program with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update program
router.put('/:id', checkPermission('programs.update'), programValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, departmentId, coordinatorId, duration, degreeType, description, status } = req.body;

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Check if coordinator exists (if provided)
    if (coordinatorId) {
      const coordinator = await User.findById(coordinatorId);
      if (!coordinator) {
        return res.status(400).json({ message: 'Coordinator not found' });
      }
    }

    const updateData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      departmentId,
      coordinatorId: coordinatorId || null,
      duration: duration?.trim(),
      degreeType,
      description: description?.trim(),
      status: status || 'active'
    };

    const program = await Program.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('departmentId', 'name code')
     .populate('coordinatorId', 'username email');

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const transformedProgram = {
      ...program.toObject(),
      departmentName: program.departmentId?.name || 'Unknown Department',
      departmentCode: program.departmentId?.code || '',
      coordinatorName: program.coordinatorId?.username || null,
      coordinatorEmail: program.coordinatorId?.email || null
    };

    res.json(transformedProgram);
  } catch (error) {
    console.error('Update program error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Program with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete program
router.delete('/:id', checkPermission('programs.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await Program.findByIdAndDelete(id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get programs by department
router.get('/department/:departmentId', checkPermission('programs.read'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const programs = await Program.find({ departmentId, status: 'active' })
      .populate('coordinatorId', 'username email')
      .sort({ name: 1 });

    const transformedPrograms = programs.map(program => ({
      ...program.toObject(),
      coordinatorName: program.coordinatorId?.username || null,
      coordinatorEmail: program.coordinatorId?.email || null
    }));

    res.json(transformedPrograms);
  } catch (error) {
    console.error('Get programs by department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get degree types (utility endpoint)
router.get('/meta/degree-types', checkPermission('programs.read'), async (req, res) => {
  try {
    const degreeTypes = ["Bachelor's", "Master's", "Doctoral", "Diploma", "Certificate"];
    res.json(degreeTypes);
  } catch (error) {
    console.error('Get degree types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;