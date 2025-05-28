// server/routes/branches.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Branch from '../models/Branch.js';
import Program from '../models/Program.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all branches
router.get('/', checkPermission('branches.read'), async (req, res) => {
  try {
    const { search, status, programId } = req.query;
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

    // Add program filter
    if (programId) {
      query.programId = programId;
    }

    const branches = await Branch.find(query)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('coordinatorId', 'username email')
      .sort({ name: 1 });

    // Transform data to include program and coordinator names
    const transformedBranches = branches.map(branch => ({
      ...branch.toObject(),
      programName: branch.programId?.name || 'Unknown Program',
      programCode: branch.programId?.code || '',
      departmentName: branch.programId?.departmentId?.name || 'Unknown Department',
      coordinatorName: branch.coordinatorId?.username || null,
      coordinatorEmail: branch.coordinatorId?.email || null
    }));

    res.json(transformedBranches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branch by ID
router.get('/:id', checkPermission('branches.read'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('coordinatorId', 'username email');
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const transformedBranch = {
      ...branch.toObject(),
      programName: branch.programId?.name || 'Unknown Program',
      programCode: branch.programId?.code || '',
      departmentName: branch.programId?.departmentId?.name || 'Unknown Department',
      coordinatorName: branch.coordinatorId?.username || null,
      coordinatorEmail: branch.coordinatorId?.email || null
    };

    res.json(transformedBranch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Branch validation rules
const branchValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Branch name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Branch code must be at least 2 characters'),
  body('programId').isMongoId().withMessage('Valid program ID is required'),
  body('coordinatorId').optional().isMongoId().withMessage('Valid coordinator ID required'),
  body('description').optional().trim()
];

// Create branch
router.post('/', checkPermission('branches.create'), branchValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, programId, coordinatorId, description, status } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ message: 'Program not found' });
    }

    // Check if coordinator exists (if provided)
    if (coordinatorId) {
      const coordinator = await User.findById(coordinatorId);
      if (!coordinator) {
        return res.status(400).json({ message: 'Coordinator not found' });
      }
    }

    // Check if branch code is unique
    const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch with this code already exists' });
    }

    const branch = new Branch({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      programId,
      coordinatorId: coordinatorId || null,
      description: description?.trim(),
      status: status || 'active'
    });

    await branch.save();
    
    // Populate the response
    await branch.populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    });
    await branch.populate('coordinatorId', 'username email');

    const transformedBranch = {
      ...branch.toObject(),
      programName: branch.programId?.name || 'Unknown Program',
      programCode: branch.programId?.code || '',
      departmentName: branch.programId?.departmentId?.name || 'Unknown Department',
      coordinatorName: branch.coordinatorId?.username || null,
      coordinatorEmail: branch.coordinatorId?.email || null
    };

    res.status(201).json(transformedBranch);
  } catch (error) {
    console.error('Create branch error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Branch with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update branch
router.put('/:id', checkPermission('branches.update'), branchValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, programId, coordinatorId, description, status } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ message: 'Program not found' });
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
      programId,
      coordinatorId: coordinatorId || null,
      description: description?.trim(),
      status: status || 'active'
    };

    const branch = await Branch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    }).populate('coordinatorId', 'username email');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const transformedBranch = {
      ...branch.toObject(),
      programName: branch.programId?.name || 'Unknown Program',
      programCode: branch.programId?.code || '',
      departmentName: branch.programId?.departmentId?.name || 'Unknown Department',
      coordinatorName: branch.coordinatorId?.username || null,
      coordinatorEmail: branch.coordinatorId?.email || null
    };

    res.json(transformedBranch);
  } catch (error) {
    console.error('Update branch error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Branch with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete branch
router.delete('/:id', checkPermission('branches.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branches by program
router.get('/program/:programId', checkPermission('branches.read'), async (req, res) => {
  try {
    const { programId } = req.params;
    
    const branches = await Branch.find({ programId, status: 'active' })
      .populate('coordinatorId', 'username email')
      .sort({ name: 1 });

    const transformedBranches = branches.map(branch => ({
      ...branch.toObject(),
      coordinatorName: branch.coordinatorId?.username || null,
      coordinatorEmail: branch.coordinatorId?.email || null
    }));

    res.json(transformedBranches);
  } catch (error) {
    console.error('Get branches by program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;