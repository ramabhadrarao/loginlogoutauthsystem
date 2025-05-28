// server/index.js - Updated with academic structure routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import collegeRoutes from './routes/colleges.js';
import departmentRoutes from './routes/departments.js';
import programRoutes from './routes/programs.js';
import branchRoutes from './routes/branches.js';
import academicYearRoutes from './routes/academicYears.js';
import regulationRoutes from './routes/regulations.js';
import semesterRoutes from './routes/semesters.js';
import batchRoutes from './routes/batches.js';
import abacRoutes from './routes/abac.js';
import attachmentRoutes from './routes/attachments.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import menuRoutes from './routes/menu.js';

// Import middleware
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

// Protected routes (require authentication)
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/colleges', verifyToken, collegeRoutes);
app.use('/api/departments', verifyToken, departmentRoutes);
app.use('/api/programs', verifyToken, programRoutes);
app.use('/api/branches', verifyToken, branchRoutes);
app.use('/api/academic-years', verifyToken, academicYearRoutes);
app.use('/api/regulations', verifyToken, regulationRoutes);
app.use('/api/semesters', verifyToken, semesterRoutes);
app.use('/api/batches', verifyToken, batchRoutes);
app.use('/api/attachments', verifyToken, attachmentRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/abac', verifyToken, abacRoutes);
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
    uploadsPath: join(__dirname, '../uploads'),
    routes: [
      'auth', 'users', 'colleges', 'departments', 'programs', 
      'branches', 'academic-years', 'regulations', 'semesters', 
      'batches', 'attachments', 'settings', 'admin', 'abac', 'menu'
    ]
  });
});

// API endpoints overview
app.get('/api', (req, res) => {
  res.json({
    message: 'Permission System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      colleges: '/api/colleges',
      departments: '/api/departments',
      programs: '/api/programs',
      branches: '/api/branches',
      academicYears: '/api/academic-years',
      regulations: '/api/regulations',
      semesters: '/api/semesters',
      batches: '/api/batches',
      attachments: '/api/attachments',
      settings: '/api/settings',
      admin: '/api/admin',
      abac: '/api/abac',
      menu: '/api/menu'
    }
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload files accessible at: http://localhost:${PORT}/uploads/`);
  console.log(`API documentation available at: http://localhost:${PORT}/api`);
  console.log('Available routes:');
  console.log('  - Authentication: /api/auth');
  console.log('  - Users: /api/users');
  console.log('  - Colleges: /api/colleges');
  console.log('  - Departments: /api/departments');
  console.log('  - Programs: /api/programs');
  console.log('  - Branches: /api/branches');
  console.log('  - Academic Years: /api/academic-years');
  console.log('  - Regulations: /api/regulations');
  console.log('  - Semesters: /api/semesters');
  console.log('  - Batches: /api/batches');
  console.log('  - Attachments: /api/attachments');
  console.log('  - Settings: /api/settings');
  console.log('  - Administration: /api/admin');
  console.log('  - ABAC: /api/abac');
  console.log('  - Menu: /api/menu');
});

export default app;