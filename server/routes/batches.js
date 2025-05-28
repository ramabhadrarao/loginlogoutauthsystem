// server/routes/batches.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Batch from '../models/Batch.js';
import Program from '../models/Program.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all batches
router.get('/', checkPermission('batches.read'), async (req, res) => {
  try {
    const { search, status, programId, branchId, year, isActive } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
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
      query.$or = [
        { startYear: yearNum },
        { endYear: yearNum }
      ];
    }

    // Filter for currently active batches
    if (isActive === 'true') {
      const currentYear = new Date().getFullYear();
      query.startYear = { $lte: currentYear };
      query.endYear = { $gt: currentYear };
      query.status = 'active';
    }

    const batches = await Batch.find(query)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('branchId', 'name code')
      .populate('mentorId', 'username email')
      .sort({ startYear: -1, name: 1 });

    // Transform data to include related names
    const transformedBatches = batches.map(batch => ({
      ...batch.toObject(),
      programName: batch.programId?.name || 'Unknown Program',
      programCode: batch.programId?.code || '',
      departmentName: batch.programId?.departmentId?.name || 'Unknown Department',
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    }));

    res.json(transformedBatches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active batches
router.get('/active', checkPermission('batches.read'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const activeBatches = await Batch.find({
      startYear: { $lte: currentYear },
      endYear: { $gt: currentYear },
      status: 'active'
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
    .populate('mentorId', 'username email')
    .sort({ name: 1 });

    const transformedBatches = activeBatches.map(batch => ({
      ...batch.toObject(),
      programName: batch.programId?.name || 'Unknown Program',
      programCode: batch.programId?.code || '',
      departmentName: batch.programId?.departmentId?.name || 'Unknown Department',
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    }));

    res.json(transformedBatches);
  } catch (error) {
    console.error('Get active batches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get batch by ID
router.get('/:id', checkPermission('batches.read'), async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate({
        path: 'programId',
        select: 'name code departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .populate('branchId', 'name code')
      .populate('mentorId', 'username email');
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const transformedBatch = {
      ...batch.toObject(),
      programName: batch.programId?.name || 'Unknown Program',
      programCode: batch.programId?.code || '',
      departmentName: batch.programId?.departmentId?.name || 'Unknown Department',
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    };

    res.json(transformedBatch);
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Batch validation rules
const batchValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Batch name must be at least 2 characters'),
  body('programId').isMongoId().withMessage('Valid program ID is required'),
  body('branchId').optional().isMongoId().withMessage('Valid branch ID required'),
  body('startYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid start year is required'),
  body('endYear').isInt({ min: 1900, max: 2100 }).withMessage('Valid end year is required'),
  body('mentorId').optional().isMongoId().withMessage('Valid mentor ID required'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be at least 1'),
  body('currentStudents').optional().isInt({ min: 0 }).withMessage('Current students must be 0 or greater'),
  body('description').optional().trim()
];

// Create batch
router.post('/', checkPermission('batches.create'), batchValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, programId, branchId, startYear, endYear, mentorId,
      maxStudents, currentStudents, description, status
    } = req.body;

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

    // Check if mentor exists (if provided)
    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor) {
        return res.status(400).json({ message: 'Mentor not found' });
      }
    }

    // Validate year sequence
    if (endYear <= startYear) {
      return res.status(400).json({ message: 'End year must be greater than start year' });
    }

    // Validate student counts
    const maxStudentsValue = maxStudents || 60;
    const currentStudentsValue = currentStudents || 0;

    if (currentStudentsValue > maxStudentsValue) {
      return res.status(400).json({ message: 'Current students cannot exceed maximum students' });
    }

    const batch = new Batch({
      name: name.trim(),
      programId,
      branchId: branchId || null,
      startYear,
      endYear,
      mentorId: mentorId || null,
      maxStudents: maxStudentsValue,
      currentStudents: currentStudentsValue,
      description: description?.trim(),
      status: status || 'planned'
    });

    await batch.save();
    
    // Populate the response
    await batch.populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    });
    await batch.populate('branchId', 'name code');
    await batch.populate('mentorId', 'username email');

    const transformedBatch = {
      ...batch.toObject(),
      programName: batch.programId?.name || 'Unknown Program',
      programCode: batch.programId?.code || '',
      departmentName: batch.programId?.departmentId?.name || 'Unknown Department',
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    };

    res.status(201).json(transformedBatch);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update batch
router.put('/:id', checkPermission('batches.update'), batchValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name, programId, branchId, startYear, endYear, mentorId,
      maxStudents, currentStudents, description, status
    } = req.body;

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

    // Check if mentor exists (if provided)
    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor) {
        return res.status(400).json({ message: 'Mentor not found' });
      }
    }

    // Validate year sequence
    if (endYear <= startYear) {
      return res.status(400).json({ message: 'End year must be greater than start year' });
    }

    // Validate student counts
    const maxStudentsValue = maxStudents || 60;
    const currentStudentsValue = currentStudents || 0;

    if (currentStudentsValue > maxStudentsValue) {
      return res.status(400).json({ message: 'Current students cannot exceed maximum students' });
    }

    const updateData = {
      name: name.trim(),
      programId,
      branchId: branchId || null,
      startYear,
      endYear,
      mentorId: mentorId || null,
      maxStudents: maxStudentsValue,
      currentStudents: currentStudentsValue,
      description: description?.trim(),
      status: status || 'planned'
    };

    const batch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate({
      path: 'programId',
      select: 'name code departmentId',
      populate: {
        path: 'departmentId',
        select: 'name code'
      }
    })
    .populate('branchId', 'name code')
    .populate('mentorId', 'username email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const transformedBatch = {
      ...batch.toObject(),
      programName: batch.programId?.name || 'Unknown Program',
      programCode: batch.programId?.code || '',
      departmentName: batch.programId?.departmentId?.name || 'Unknown Department',
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    };

    res.json(transformedBatch);
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete batch
router.delete('/:id', checkPermission('batches.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get batches by program
router.get('/program/:programId', checkPermission('batches.read'), async (req, res) => {
  try {
    const { programId } = req.params;
    const { branchId, status } = req.query;
    
    let query = { programId };
    
    if (branchId) {
      query.branchId = branchId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const batches = await Batch.find(query)
      .populate('branchId', 'name code')
      .populate('mentorId', 'username email')
      .sort({ startYear: -1, name: 1 });

    const transformedBatches = batches.map(batch => ({
      ...batch.toObject(),
      branchName: batch.branchId?.name || 'General',
      branchCode: batch.branchId?.code || '',
      mentorName: batch.mentorId?.username || null,
      mentorEmail: batch.mentorId?.email || null
    }));

    res.json(transformedBatches);
  } catch (error) {
    console.error('Get batches by program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update batch student count
router.put('/:id/student-count', checkPermission('batches.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStudents } = req.body;

    if (typeof currentStudents !== 'number' || currentStudents < 0) {
      return res.status(400).json({ message: 'Valid current students count is required' });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (currentStudents > batch.maxStudents) {
      return res.status(400).json({ message: 'Current students cannot exceed maximum students' });
    }

    batch.currentStudents = currentStudents;
    await batch.save();

    res.json({ 
      message: 'Student count updated successfully',
      currentStudents: batch.currentStudents,
      availableSeats: batch.maxStudents - batch.currentStudents
    });
  } catch (error) {
    console.error('Update batch student count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get batch statistics
router.get('/stats/overview', checkPermission('batches.read'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const stats = {
      totalBatches: await Batch.countDocuments(),
      activeBatches: await Batch.countDocuments({
        startYear: { $lte: currentYear },
        endYear: { $gt: currentYear },
        status: 'active'
      }),
      graduatedBatches: await Batch.countDocuments({ status: 'graduated' }),
      plannedBatches: await Batch.countDocuments({ status: 'planned' }),
      totalStudents: (await Batch.aggregate([
        { $group: { _id: null, total: { $sum: '$currentStudents' } } }
      ]))[0]?.total || 0,
      totalCapacity: (await Batch.aggregate([
        { $group: { _id: null, total: { $sum: '$maxStudents' } } }
      ]))[0]?.total || 0
    };

    // Calculate utilization rate
    stats.utilizationRate = stats.totalCapacity > 0 
      ? Math.round((stats.totalStudents / stats.totalCapacity) * 100) 
      : 0;

    // Status breakdown
    const statusBreakdown = await Batch.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    stats.statusBreakdown = statusBreakdown.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json(stats);
  } catch (error) {
    console.error('Get batch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;