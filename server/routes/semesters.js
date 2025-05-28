// server/routes/semesters.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Semester from '../models/Semester.js';
import AcademicYear from '../models/AcademicYear.js';
import Regulation from '../models/Regulation.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all semesters
router.get('/', checkPermission('semesters.read'), async (req, res) => {
  try {
    const { search, status, academicYearId, regulationId, semesterNumber } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add academic year filter
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    // Add regulation filter
    if (regulationId) {
      query.regulationId = regulationId;
    }

    // Add semester number filter
    if (semesterNumber) {
      query.semesterNumber = parseInt(semesterNumber);
    }

    const semesters = await Semester.find(query)
      .populate('academicYearId', 'name code startYear endYear')
      .populate({
        path: 'regulationId',
        select: 'name code programId branchId',
        populate: [
          {
            path: 'programId',
            select: 'name code'
          },
          {
            path: 'branchId',
            select: 'name code'
          }
        ]
      })
      .sort({ startDate: -1, semesterNumber: 1 });

    // Transform data to include related names
    const transformedSemesters = semesters.map(semester => ({
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year',
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    }));

    res.json(transformedSemesters);
  } catch (error) {
    console.error('Get semesters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current/active semesters
router.get('/current', checkPermission('semesters.read'), async (req, res) => {
  try {
    const now = new Date();
    
    const currentSemesters = await Semester.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'ongoing'
    })
    .populate('academicYearId', 'name code')
    .populate({
      path: 'regulationId',
      select: 'name code programId branchId',
      populate: [
        {
          path: 'programId',
          select: 'name code'
        },
        {
          path: 'branchId',
          select: 'name code'
        }
      ]
    })
    .sort({ semesterNumber: 1 });

    const transformedSemesters = currentSemesters.map(semester => ({
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year',
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    }));

    res.json(transformedSemesters);
  } catch (error) {
    console.error('Get current semesters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get semester by ID
router.get('/:id', checkPermission('semesters.read'), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
      .populate('academicYearId', 'name code startYear endYear')
      .populate({
        path: 'regulationId',
        select: 'name code programId branchId',
        populate: [
          {
            path: 'programId',
            select: 'name code'
          },
          {
            path: 'branchId',
            select: 'name code'
          }
        ]
      });
    
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const transformedSemester = {
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year',
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    };

    res.json(transformedSemester);
  } catch (error) {
    console.error('Get semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Semester validation rules
const semesterValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Semester name must be at least 2 characters'),
  body('academicYearId').isMongoId().withMessage('Valid academic year ID is required'),
  body('regulationId').isMongoId().withMessage('Valid regulation ID is required'),
  body('semesterNumber').isInt({ min: 1, max: 12 }).withMessage('Valid semester number is required (1-12)'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('registrationStartDate').optional().isISO8601().withMessage('Valid registration start date required'),
  body('registrationEndDate').optional().isISO8601().withMessage('Valid registration end date required'),
  body('examStartDate').optional().isISO8601().withMessage('Valid exam start date required'),
  body('examEndDate').optional().isISO8601().withMessage('Valid exam end date required'),
  body('resultPublishDate').optional().isISO8601().withMessage('Valid result publish date required')
];

// Create semester
router.post('/', checkPermission('semesters.create'), semesterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, academicYearId, regulationId, semesterNumber, startDate, endDate,
      registrationStartDate, registrationEndDate, examStartDate, examEndDate,
      resultPublishDate, status
    } = req.body;

    // Check if academic year exists
    const academicYear = await AcademicYear.findById(academicYearId);
    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year not found' });
    }

    // Check if regulation exists
    const regulation = await Regulation.findById(regulationId);
    if (!regulation) {
      return res.status(400).json({ message: 'Regulation not found' });
    }

    // Validate date sequences
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate semester dates are within academic year
    if (startDateObj < academicYear.startDate || endDateObj > academicYear.endDate) {
      return res.status(400).json({ message: 'Semester dates must be within the academic year' });
    }

    // Check for duplicate semester numbers in the same academic year and regulation
    const existingSemester = await Semester.findOne({
      academicYearId,
      regulationId,
      semesterNumber
    });

    if (existingSemester) {
      return res.status(400).json({ 
        message: `Semester ${semesterNumber} already exists for this academic year and regulation` 
      });
    }

    const semester = new Semester({
      name: name.trim(),
      academicYearId,
      regulationId,
      semesterNumber,
      startDate: startDateObj,
      endDate: endDateObj,
      registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
      examStartDate: examStartDate ? new Date(examStartDate) : null,
      examEndDate: examEndDate ? new Date(examEndDate) : null,
      resultPublishDate: resultPublishDate ? new Date(resultPublishDate) : null,
      status: status || 'upcoming'
    });

    await semester.save();
    
    // Populate the response
    await semester.populate('academicYearId', 'name code startYear endYear');
    await semester.populate({
      path: 'regulationId',
      select: 'name code programId branchId',
      populate: [
        {
          path: 'programId',
          select: 'name code'
        },
        {
          path: 'branchId',
          select: 'name code'
        }
      ]
    });

    const transformedSemester = {
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year',
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    };

    res.status(201).json(transformedSemester);
  } catch (error) {
    console.error('Create semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update semester
router.put('/:id', checkPermission('semesters.update'), semesterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name, academicYearId, regulationId, semesterNumber, startDate, endDate,
      registrationStartDate, registrationEndDate, examStartDate, examEndDate,
      resultPublishDate, status
    } = req.body;

    // Check if academic year exists
    const academicYear = await AcademicYear.findById(academicYearId);
    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year not found' });
    }

    // Check if regulation exists
    const regulation = await Regulation.findById(regulationId);
    if (!regulation) {
      return res.status(400).json({ message: 'Regulation not found' });
    }

    // Validate date sequences
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate semester dates are within academic year
    if (startDateObj < academicYear.startDate || endDateObj > academicYear.endDate) {
      return res.status(400).json({ message: 'Semester dates must be within the academic year' });
    }

    const updateData = {
      name: name.trim(),
      academicYearId,
      regulationId,
      semesterNumber,
      startDate: startDateObj,
      endDate: endDateObj,
      registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
      examStartDate: examStartDate ? new Date(examStartDate) : null,
      examEndDate: examEndDate ? new Date(examEndDate) : null,
      resultPublishDate: resultPublishDate ? new Date(resultPublishDate) : null,
      status: status || 'upcoming'
    };

    const semester = await Semester.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('academicYearId', 'name code startYear endYear')
    .populate({
      path: 'regulationId',
      select: 'name code programId branchId',
      populate: [
        {
          path: 'programId',
          select: 'name code'
        },
        {
          path: 'branchId',
          select: 'name code'
        }
      ]
    });

    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const transformedSemester = {
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year',
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    };

    res.json(transformedSemester);
  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete semester
router.delete('/:id', checkPermission('semesters.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const semester = await Semester.findByIdAndDelete(id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Delete semester error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get semesters by academic year
router.get('/academic-year/:academicYearId', checkPermission('semesters.read'), async (req, res) => {
  try {
    const { academicYearId } = req.params;
    const { regulationId } = req.query;
    
    let query = { academicYearId };
    if (regulationId) {
      query.regulationId = regulationId;
    }
    
    const semesters = await Semester.find(query)
      .populate({
        path: 'regulationId',
        select: 'name code programId branchId',
        populate: [
          {
            path: 'programId',
            select: 'name code'
          },
          {
            path: 'branchId',
            select: 'name code'
          }
        ]
      })
      .sort({ semesterNumber: 1 });

    const transformedSemesters = semesters.map(semester => ({
      ...semester.toObject(),
      regulationName: semester.regulationId?.name || 'Unknown Regulation',
      programName: semester.regulationId?.programId?.name || 'Unknown Program',
      branchName: semester.regulationId?.branchId?.name || 'General'
    }));

    res.json(transformedSemesters);
  } catch (error) {
    console.error('Get semesters by academic year error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get semesters by regulation
router.get('/regulation/:regulationId', checkPermission('semesters.read'), async (req, res) => {
  try {
    const { regulationId } = req.params;
    const { academicYearId } = req.query;
    
    let query = { regulationId };
    if (academicYearId) {
      query.academicYearId = academicYearId;
    }
    
    const semesters = await Semester.find(query)
      .populate('academicYearId', 'name code')
      .sort({ semesterNumber: 1 });

    const transformedSemesters = semesters.map(semester => ({
      ...semester.toObject(),
      academicYearName: semester.academicYearId?.name || 'Unknown Academic Year'
    }));

    res.json(transformedSemesters);
  } catch (error) {
    console.error('Get semesters by regulation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update semester status
router.put('/:id/status', checkPermission('semesters.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['upcoming', 'registration_open', 'ongoing', 'exam_period', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const semester = await Semester.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('academicYearId', 'name code');

    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    res.json({ message: `Semester status updated to ${status}`, semester });
  } catch (error) {
    console.error('Update semester status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;