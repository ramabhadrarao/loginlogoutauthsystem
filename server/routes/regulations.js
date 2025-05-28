// server/routes/regulations.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Regulation from '../models/Regulation.js';
import Program from '../models/Program.js';
import Branch from '../models/Branch.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all regulations
router.get('/', checkPermission('regulations.read'), async (req, res) => {
  try {
    const { search, status, programId, branchId, year, isCurrentlyEffective } = req.query;
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

    // Add branch filter
    if (branchId) {
      query.branchId = branchId;
    }

    // Add year filter
    if (year) {
      const yearNum = parseInt(year);
      query.$and = [
        { effectiveFromYear: { $lte: yearNum } },
        { $or: [
          { effectiveToYear: { $exists: false } },
          { effectiveToYear: { $gte: yearNum } }
        ]}
      ];
    }

    // Filter for currently effective regulations
    if (isCurrentlyEffective === 'true') {
      const currentYear = new Date().getFullYear();
      query.$and = [
        { effectiveFromYear: { $lte: currentYear } },
        { $or: [
          { effectiveToYear: { $exists: false } },
          { effectiveToYear: { $gte: currentYear } }
        ]}
      ];
    }

    const regulations = await Regulation.find(query)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('branchId', 'name code')
      .sort({ effectiveFromYear: -1, name: 1 });

    // Transform data to include program and branch names
    const transformedRegulations = regulations.map(regulation => ({
      ...regulation.toObject(),
      programName: regulation.programId?.name || 'Unknown Program',
      programCode: regulation.programId?.code || '',
      departmentName: regulation.programId?.departmentId?.name || 'Unknown Department',
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    }));

    res.json(transformedRegulations);
  } catch (error) {
    console.error('Get regulations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get regulation by ID
router.get('/:id', checkPermission('regulations.read'), async (req, res) => {
  try {
    const regulation = await Regulation.findById(req.params.id)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('branchId', 'name code');
    
    if (!regulation) {
      return res.status(404).json({ message: 'Regulation not found' });
    }

    const transformedRegulation = {
      ...regulation.toObject(),
      programName: regulation.programId?.name || 'Unknown Program',
      programCode: regulation.programId?.code || '',
      departmentName: regulation.programId?.departmentId?.name || 'Unknown Department',
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    };

    res.json(transformedRegulation);
  } catch (error) {
    console.error('Get regulation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regulation validation rules
const regulationValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Regulation name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Regulation code must be at least 2 characters'),
  body('programId').isMongoId().withMessage('Valid program ID is required'),
  body('branchId').optional().isMongoId().withMessage('Valid branch ID required'),
  body('effectiveFromYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid effective from year is required'),
  body('effectiveToYear').optional().isInt({ min: 1900, max: 2100 }).withMessage('Valid effective to year required'),
  body('description').optional().trim()
];

// Create regulation
router.post('/', checkPermission('regulations.create'), regulationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, programId, branchId, effectiveFromYear, effectiveToYear, description, status } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ message: 'Program not found' });
    }

    // Check if branch exists (if provided)
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(400).json({ message: 'Branch not found' });
      }
      
      // Verify branch belongs to the program
      if (branch.programId.toString() !== programId) {
        return res.status(400).json({ message: 'Branch does not belong to the specified program' });
      }
    }

    // Validate year sequence
    if (effectiveToYear && effectiveToYear <= effectiveFromYear) {
      return res.status(400).json({ message: 'Effective to year must be greater than effective from year' });
    }

    // Check if regulation code is unique
    const existingRegulation = await Regulation.findOne({ code: code.toUpperCase() });
    if (existingRegulation) {
      return res.status(400).json({ message: 'Regulation with this code already exists' });
    }

    const regulation = new Regulation({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      programId,
      branchId: branchId || null,
      effectiveFromYear,
      effectiveToYear: effectiveToYear || null,
      description: description?.trim(),
      status: status || 'active'
    });

    await regulation.save();
    
    // Populate the response
    await regulation.populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    });
    await regulation.populate('branchId', 'name code');

    const transformedRegulation = {
      ...regulation.toObject(),
      programName: regulation.programId?.name || 'Unknown Program',
      programCode: regulation.programId?.code || '',
      departmentName: regulation.programId?.departmentId?.name || 'Unknown Department',
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    };

    res.status(201).json(transformedRegulation);
  } catch (error) {
    console.error('Create regulation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Regulation with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update regulation
router.put('/:id', checkPermission('regulations.update'), regulationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, programId, branchId, effectiveFromYear, effectiveToYear, description, status } = req.body;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ message: 'Program not found' });
    }

    // Check if branch exists (if provided)
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(400).json({ message: 'Branch not found' });
      }
      
      // Verify branch belongs to the program
      if (branch.programId.toString() !== programId) {
        return res.status(400).json({ message: 'Branch does not belong to the specified program' });
      }
    }

    // Validate year sequence
    if (effectiveToYear && effectiveToYear <= effectiveFromYear) {
      return res.status(400).json({ message: 'Effective to year must be greater than effective from year' });
    }

    const updateData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      programId,
      branchId: branchId || null,
      effectiveFromYear,
      effectiveToYear: effectiveToYear || null,
      description: description?.trim(),
      status: status || 'active'
    };

    const regulation = await Regulation.findByIdAndUpdate(
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
    }).populate('branchId', 'name code');

    if (!regulation) {
      return res.status(404).json({ message: 'Regulation not found' });
    }

    const transformedRegulation = {
      ...regulation.toObject(),
      programName: regulation.programId?.name || 'Unknown Program',
      programCode: regulation.programId?.code || '',
      departmentName: regulation.programId?.departmentId?.name || 'Unknown Department',
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    };

    res.json(transformedRegulation);
  } catch (error) {
    console.error('Update regulation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Regulation with this code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete regulation
router.delete('/:id', checkPermission('regulations.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const regulation = await Regulation.findByIdAndDelete(id);
    if (!regulation) {
      return res.status(404).json({ message: 'Regulation not found' });
    }

    res.json({ message: 'Regulation deleted successfully' });
  } catch (error) {
    console.error('Delete regulation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get regulations by program
router.get('/program/:programId', checkPermission('regulations.read'), async (req, res) => {
  try {
    const { programId } = req.params;
    const { branchId, isCurrentlyEffective } = req.query;
    
    let query = { programId, status: 'active' };
    
    if (branchId) {
      query.branchId = branchId;
    }
    
    if (isCurrentlyEffective === 'true') {
      const currentYear = new Date().getFullYear();
      query.$and = [
        { effectiveFromYear: { $lte: currentYear } },
        { $or: [
          { effectiveToYear: { $exists: false } },
          { effectiveToYear: { $gte: currentYear } }
        ]}
      ];
    }
    
    const regulations = await Regulation.find(query)
      .populate('branchId', 'name code')
      .sort({ effectiveFromYear: -1, name: 1 });

    const transformedRegulations = regulations.map(regulation => ({
      ...regulation.toObject(),
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    }));

    res.json(transformedRegulations);
  } catch (error) {
    console.error('Get regulations by program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get currently effective regulations
router.get('/effective/current', checkPermission('regulations.read'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const regulations = await Regulation.find({
      status: 'active',
      effectiveFromYear: { $lte: currentYear },
      $or: [
        { effectiveToYear: { $exists: false } },
        { effectiveToYear: { $gte: currentYear } }
      ]
    })
    .populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    })
    .populate('branchId', 'name code')
    .sort({ name: 1 });

    const transformedRegulations = regulations.map(regulation => ({
      ...regulation.toObject(),
      programName: regulation.programId?.name || 'Unknown Program',
      programCode: regulation.programId?.code || '',
      departmentName: regulation.programId?.departmentId?.name || 'Unknown Department',
      branchName: regulation.branchId?.name || 'General',
      branchCode: regulation.branchId?.code || ''
    }));

    res.json(transformedRegulations);
  } catch (error) {
    console.error('Get currently effective regulations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;