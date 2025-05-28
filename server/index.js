// server/index.js - Fixed static file serving
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import collegeRoutes from './routes/colleges.js';
import departmentRoutes from './routes/departments.js'; // ADD THIS

import attachmentRoutes from './routes/attachments.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import menuRoutes from './routes/menu.js';
import { verifyToken } from './middleware/auth.js';
import { seedDatabase } from './utils/seedData.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/permission_system')
  .then(() => {
    console.log('Connected to MongoDB');
    // Seed database on first run
    seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files BEFORE other routes - This is CRITICAL!
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Static file serving - should be accessible at /uploads/filename
app.use('/uploads', express.static(join(__dirname, '../uploads')));
console.log(`Static files served from: ${join(__dirname, '../uploads')}`);
console.log(`Upload files accessible at: http://localhost:${process.env.PORT || 5000}/uploads/`);

// API Routes (after static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/colleges', verifyToken, collegeRoutes);
app.use('/api/departments', verifyToken, departmentRoutes); // ADD THIS
app.use('/api/attachments', verifyToken, attachmentRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/menu', verifyToken, menuRoutes);

// Test endpoint to verify file serving
app.get('/test-upload/:filename', (req, res) => {
  const filePath = join(__dirname, '../uploads', req.params.filename);
  console.log(`Testing file access: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File serve error:', err);
      res.status(404).json({ error: 'File not found', path: filePath });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uploadsPath: join(__dirname, '../uploads')
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload files accessible at: http://localhost:${PORT}/uploads/`);
});

export default app;