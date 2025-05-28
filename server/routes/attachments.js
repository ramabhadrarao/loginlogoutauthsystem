// server/routes/attachments.js
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import Attachment from '../models/Attachment.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Allowed types: images, PDFs, Office documents, text files, and archives.'));
  }
});

// Get all attachments
router.get('/', checkPermission('attachments.read'), async (req, res) => {
  try {
    const { search, mimeType } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { mimeType: { $regex: search, $options: 'i' } }
      ];
    }

    // Add mime type filter
    if (mimeType) {
      query.mimeType = { $regex: mimeType, $options: 'i' };
    }

    const attachments = await Attachment.find(query)
      .populate('uploaderUserId', 'username email')
      .sort({ createdAt: -1 });

    // Transform data to match frontend expectations
    const transformedAttachments = attachments.map(attachment => ({
      ...attachment.toObject(),
      uploaderName: attachment.uploaderUserId?.username || 'Unknown User'
    }));

    res.json(transformedAttachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attachment by ID
router.get('/:id', checkPermission('attachments.read'), async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id)
      .populate('uploaderUserId', 'username email');
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.json({
      ...attachment.toObject(),
      uploaderName: attachment.uploaderUserId?.username || 'Unknown User'
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment
router.post('/upload', checkPermission('attachments.create'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attachment = new Attachment({
      uploaderUserId: req.user._id,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
      storageLocation: 'local'
    });

    await attachment.save();
    await attachment.populate('uploaderUserId', 'username email');

    res.status(201).json({
      ...attachment.toObject(),
      uploaderName: attachment.uploaderUserId?.username || 'Unknown User'
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Download attachment
router.get('/:id/download', checkPermission('attachments.read'), async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFileName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete attachment
router.delete('/:id', checkPermission('attachments.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findById(id);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check if user can delete this attachment (owner or admin)
    if (!req.user.isSuperAdmin && 
        !req.user.permissions.some(p => p.permissionKey === 'attachments.delete') &&
        attachment.uploaderUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete attachments uploaded by other users' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Attachment.findByIdAndDelete(id);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;