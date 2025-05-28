import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { checkPermission } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Get all attachments
router.get('/', checkPermission('attachments.read'), async (req, res) => {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*');

    if (error) throw error;

    res.json(attachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload attachment
router.post('/upload', checkPermission('attachments.create'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attachment = {
      uploader_user_id: req.user.id,
      file_name: req.file.filename,
      original_file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      mime_type: req.file.mimetype,
      file_size_bytes: req.file.size,
      storage_location: 'local'
    };

    const { data, error } = await supabase
      .from('attachments')
      .insert([attachment])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete attachment
router.delete('/:id', checkPermission('attachments.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select()
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from database
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete file from storage (implement actual file deletion logic here)
    // fs.unlinkSync(path.join(__dirname, '..', attachment.file_path));

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;