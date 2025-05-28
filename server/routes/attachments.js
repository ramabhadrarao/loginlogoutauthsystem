// server/routes/attachments.js (Improved Version)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Attachment from '../models/Attachment.js';
import User from '../models/User.js';
import { checkPermission } from '../middleware/auth.js';
import { 
  generateTimestamp16BitFilename,
  generateSafe16BitFilename,
  generatePrefixed16BitFilename,
  sanitizeExtension,
  getFilenameStats
} from '../utils/filenameGenerator.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration: Choose your preferred filename generation method
const FILENAME_METHOD = process.env.FILENAME_METHOD || 'timestamp16bit'; // Options: 'timestamp16bit', 'safe16bit', 'prefixed16bit'

// Generate filename based on configuration
const generateFilename = (originalFilename, mimeType) => {
  const extension = sanitizeExtension(originalFilename);
  
  switch (FILENAME_METHOD) {
    case 'safe16bit':
      return generateSafe16BitFilename(extension, uploadsDir);
    case 'prefixed16bit':
      return generatePrefixed16BitFilename(extension, mimeType);
    case 'timestamp16bit':
    default:
      return generateTimestamp16BitFilename(extension);
  }
};

// Configure multer for file uploads with 16-bit unique filenames
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    try {
      const uniqueName = generateFilename(file.originalname, file.mimetype);
      const stats = getFilenameStats(uniqueName);
      
      console.log(`Generated 16-bit filename:`, {
        original: file.originalname,
        generated: uniqueName,
        method: FILENAME_METHOD,
        stats
      });
      
      cb(null, uniqueName);
    } catch (error) {
      console.error('Error generating 16-bit filename:', error);
      
      // Emergency fallback
      const fallbackName = `emergency_${Date.now()}_${Math.random().toString(16).substr(2, 4)}${path.extname(file.originalname)}`;
      console.warn(`Using emergency fallback filename: ${fallbackName}`);
      cb(null, fallbackName);
    }
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Text
      'text/plain',
      // Archives
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i;
    
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.test(file.originalname);
    
    if (isValidMimeType && isValidExtension) {
      return cb(null, true);
    }
    
    const error = new Error(`Invalid file type. Received: ${file.mimetype} for file: ${file.originalname}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
});

// Get all attachments
router.get('/', checkPermission('attachments.read'), async (req, res) => {
  try {
    const { search, mimeType, type } = req.query;
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { mimeType: { $regex: search, $options: 'i' } }
      ];
    }

    // Add mime type filter
    if (mimeType) {
      query.mimeType = { $regex: mimeType, $options: 'i' };
    }
    
    // Add type filter (images, documents, etc.)
    if (type === 'images') {
      query.mimeType = { $regex: '^image/', $options: 'i' };
    } else if (type === 'documents') {
      query.mimeType = { $regex: '(pdf|document|word|excel|text)', $options: 'i' };
    }

    const attachments = await Attachment.find(query)
      .populate('uploaderUserId', 'username email')
      .sort({ createdAt: -1 });

    // Transform data and add file existence check
    const transformedAttachments = await Promise.all(
      attachments.map(async (attachment) => {
        const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
        const fileExists = fs.existsSync(filePath);
        
        return {
          ...attachment.toObject(),
          uploaderName: attachment.uploaderUserId?.username || 'Unknown User',
          fileExists,
          fileStats: getFilenameStats(attachment.fileName)
        };
      })
    );

    res.json(transformedAttachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    const fileExists = fs.existsSync(filePath);

    res.json({
      ...attachment.toObject(),
      uploaderName: attachment.uploaderUserId?.username || 'Unknown User',
      fileExists,
      fileStats: getFilenameStats(attachment.fileName)
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment with 16-bit filename
router.post('/upload', checkPermission('attachments.create'), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      
      let errorMessage = 'File upload failed';
      let statusCode = 400;
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size too large. Maximum size is 10MB.';
      } else if (err.code === 'INVALID_FILE_TYPE') {
        errorMessage = err.message;
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        errorMessage = 'Too many files. Upload one file at a time.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        errorMessage = 'Unexpected field name. Use "file" as the field name.';
      }
      
      return res.status(statusCode).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Log the 16-bit filename generation
      const fileStats = getFilenameStats(req.file.filename);
      console.log(`16-bit File Upload Success:`, {
        originalName: req.file.originalname,
        generatedName: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
        method: FILENAME_METHOD,
        stats: fileStats
      });

      // Create attachment record
      const attachment = new Attachment({
        uploaderUserId: req.user._id,
        fileName: req.file.filename, // 16-bit generated name
        originalFileName: req.file.originalname, // Keep original for user reference
        filePath: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storageLocation: 'local'
      });

      await attachment.save();
      await attachment.populate('uploaderUserId', 'username email');

      // Return the attachment with additional metadata
      const responseData = {
        ...attachment.toObject(),
        uploaderName: attachment.uploaderUserId?.username || 'Unknown User',
        fileExists: true,
        fileStats
      };

      console.log(`Attachment saved with 16-bit filename - ID: ${attachment._id}, Filename: ${req.file.filename}`);
      res.status(201).json(responseData);
      
    } catch (error) {
      console.error('Upload processing error:', error);
      
      // Clean up uploaded file if database save fails
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up failed upload: ${req.file.filename}`);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: 'Server error during file processing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });
});

// Download attachment (using original filename for download)
router.get('/:id/download', checkPermission('attachments.read'), async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found on disk: ${filePath} (16-bit filename: ${attachment.fileName})`);
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Use original filename for download, but serve the 16-bit filename from disk
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFileName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.fileSizeBytes);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log(`Download: ${attachment.originalFileName} (16-bit: ${attachment.fileName})`);
    
    // Handle stream errors
    fileStream.on('error', (streamError) => {
      console.error('File stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading file' });
      }
    });
    
  } catch (error) {
    console.error('Download attachment error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Serve file directly (for viewing in browser)
router.get('/:id/view', checkPermission('attachments.read'), async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Set content type for inline viewing
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.fileSizeBytes);
    
    // For images, allow inline viewing
    if (attachment.mimeType.startsWith('image/')) {
      res.setHeader('Content-Disposition', 'inline');
    }
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log(`View: ${attachment.originalFileName} (16-bit: ${attachment.fileName})`);
    
  } catch (error) {
    console.error('View attachment error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
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

    // Permission check
    const canDelete = req.user.isSuperAdmin || 
                     req.user.permissions.some(p => p.permissionKey === 'attachments.delete') ||
                     attachment.uploaderUserId.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({ message: 'Cannot delete attachments uploaded by other users' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted 16-bit file: ${attachment.fileName} (original: ${attachment.originalFileName})`);
      } catch (fileError) {
        console.error('Error deleting file from disk:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    } else {
      console.warn(`16-bit file not found for deletion: ${filePath}`);
    }

    // Delete from database
    await Attachment.findByIdAndDelete(id);
    console.log(`Attachment deleted from database: ${attachment.originalFileName} (16-bit: ${attachment.fileName})`);

    res.json({ 
      message: 'Attachment deleted successfully',
      deletedFile: {
        original: attachment.originalFileName,
        generated: attachment.fileName
      }
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint: List all files and their stats
router.get('/debug/files', checkPermission('attachments.read'), async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Debug endpoint only available in development' });
    }

    const attachments = await Attachment.find().populate('uploaderUserId', 'username');
    
    const fileStats = attachments.map(attachment => {
      const filePath = path.join(process.cwd(), attachment.filePath.replace('/', ''));
      const fileExists = fs.existsSync(filePath);
      const stats = getFilenameStats(attachment.fileName);
      
      return {
        id: attachment._id,
        originalName: attachment.originalFileName,
        generatedName: attachment.fileName,
        fileExists,
        uploader: attachment.uploaderUserId?.username || 'Unknown',
        createdAt: attachment.createdAt,
        filenameStats: stats
      };
    });

    res.json({
      method: FILENAME_METHOD,
      totalFiles: fileStats.length,
      files: fileStats
    });
  } catch (error) {
    console.error('Debug files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;