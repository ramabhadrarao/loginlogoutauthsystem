// server/utils/seedData.js - Updated with academic structure models
import User from '../models/User.js';
import Model from '../models/Model.js';
import Permission from '../models/Permission.js';
import College from '../models/College.js';
import Department from '../models/Department.js';
import Program from '../models/Program.js';
import Branch from '../models/Branch.js';
import AcademicYear from '../models/AcademicYear.js';
import SystemSetting from '../models/SystemSetting.js';
import MenuItem from '../models/MenuItem.js';

// Upload settings array
const uploadSettings = [
  // File Upload Limits
  {
    settingKey: 'upload.max_file_size_mb',
    settingValue: '10',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Maximum file size in MB for uploads'
  },
  {
    settingKey: 'upload.max_files_per_upload',
    settingValue: '1',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Maximum number of files per upload request'
  },
  
  // Allowed MIME Types
  {
    settingKey: 'upload.allowed_image_types',
    settingValue: 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed image MIME types (comma-separated)'
  },
  {
    settingKey: 'upload.allowed_document_types',
    settingValue: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed document MIME types (comma-separated)'
  },
  {
    settingKey: 'upload.allowed_text_types',
    settingValue: 'text/plain',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed text MIME types (comma-separated)'
  },
  {
    settingKey: 'upload.allowed_archive_types',
    settingValue: 'application/zip,application/x-rar-compressed',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed archive MIME types (comma-separated)'
  },
  
  // Allowed File Extensions
  {
    settingKey: 'upload.allowed_image_extensions',
    settingValue: 'jpg,jpeg,png,gif,webp,svg',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed image file extensions (comma-separated, without dots)'
  },
  {
    settingKey: 'upload.allowed_document_extensions',
    settingValue: 'pdf,doc,docx,xls,xlsx',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed document file extensions (comma-separated, without dots)'
  },
  {
    settingKey: 'upload.allowed_text_extensions',
    settingValue: 'txt',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed text file extensions (comma-separated, without dots)'
  },
  {
    settingKey: 'upload.allowed_archive_extensions',
    settingValue: 'zip,rar',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Allowed archive file extensions (comma-separated, without dots)'
  },
  
  // Upload Behavior Settings
  {
    settingKey: 'upload.filename_method',
    settingValue: 'timestamp16bit',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Filename generation method: timestamp16bit, pure16bit, safe16bit, prefixed16bit, dateBased16bit'
  },
  {
    settingKey: 'upload.enable_images',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Enable image file uploads'
  },
  {
    settingKey: 'upload.enable_documents',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Enable document file uploads'
  },
  {
    settingKey: 'upload.enable_text',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Enable text file uploads'
  },
  {
    settingKey: 'upload.enable_archives',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Enable archive file uploads'
  },
  
  // Additional Upload Settings
  {
    settingKey: 'upload.uploads_directory',
    settingValue: 'uploads',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Directory for storing uploaded files'
  },
  {
    settingKey: 'upload.require_authentication',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Require user authentication for file uploads'
  },
  {
    settingKey: 'upload.log_all_uploads',
    settingValue: 'true',
    settingGroup: 'upload',
    isPublic: false,
    description: 'Log all file upload attempts for auditing'
  }
];

export const seedDatabase = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // 1. Create Models (including new academic structure models)
    const models = [
      {
        name: 'users',
        displayName: 'Users',
        description: 'User accounts and profiles'
      },
      {
        name: 'colleges',
        displayName: 'Colleges',
        description: 'Educational institutions'
      },
      {
        name: 'departments',
        displayName: 'Departments',
        description: 'Academic departments within colleges'
      },
      {
        name: 'programs',
        displayName: 'Programs',
        description: 'Academic programs leading to degrees'
      },
      {
        name: 'branches',
        displayName: 'Branches',
        description: 'Specialization branches within programs'
      },
      {
        name: 'academic_years',
        displayName: 'Academic Years',
        description: 'Academic year management'
      },
      {
        name: 'regulations',
        displayName: 'Regulations',
        description: 'Academic regulations and policies'
      },
      {
        name: 'semesters',
        displayName: 'Semesters',
        description: 'Semester management'
      },
      {
        name: 'batches',
        displayName: 'Batches',
        description: 'Student batch management'
      },
      {
        name: 'attachments',
        displayName: 'Attachments',
        description: 'File uploads and attachments'
      },
      {
        name: 'settings',
        displayName: 'Settings',
        description: 'System configuration settings'
      },
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Dashboard access and analytics'
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative functions'
      },
      {
        name: 'abac',
        displayName: 'ABAC',
        description: 'Attribute-Based Access Control'
      }
    ];

    const createdModels = await Model.insertMany(models);
    console.log('✓ Models created');

    // 2. Create Permissions
    const permissions = [];
    for (const model of createdModels) {
      if (model.name === 'admin') {
        // Special permissions for admin
        permissions.push({
          modelId: model._id,
          action: 'read',
          permissionKey: 'admin.access'
        });
        permissions.push({
          modelId: model._id,
          action: 'create',
          permissionKey: 'permissions.manage'
        });
        permissions.push({
          modelId: model._id,
          action: 'update',
          permissionKey: 'models.manage'
        });
        permissions.push({
          modelId: model._id,
          action: 'delete',
          permissionKey: 'audit.read'
        });
      } else if (model.name === 'abac') {
        // Special permissions for ABAC
        permissions.push({
          modelId: model._id,
          action: 'read',
          permissionKey: 'abac.read'
        });
        permissions.push({
          modelId: model._id,
          action: 'create',
          permissionKey: 'abac.manage'
        });
        permissions.push({
          modelId: model._id,
          action: 'update',
          permissionKey: 'abac.manage'
        });
        permissions.push({
          modelId: model._id,
          action: 'delete',
          permissionKey: 'abac.manage'
        });
      } else if (model.name === 'dashboard') {
        permissions.push({
          modelId: model._id,
          action: 'read',
          permissionKey: 'dashboard.read'
        });
      } else {
        // Standard CRUD permissions
        const actions = ['create', 'read', 'update', 'delete'];
        for (const action of actions) {
          permissions.push({
            modelId: model._id,
            action,
            permissionKey: `${model.name}.${action}`
          });
        }
      }
    }

    const createdPermissions = await Permission.insertMany(permissions);
    console.log('✓ Permissions created');

    // 3. Create Super Admin User
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      isSuperAdmin: true,
      isActive: true,
      permissions: createdPermissions.map(p => p._id)
    });

    await adminUser.save();
    console.log('✓ Super Admin user created');

    // 4. Create Regular Demo User
    const demoPermissions = createdPermissions.filter(p => 
      ['dashboard.read', 'colleges.read', 'departments.read', 'programs.read', 'branches.read', 'academic_years.read', 'regulations.read', 'semesters.read', 'batches.read', 'attachments.read', 'settings.read'].includes(p.permissionKey)
    );

    const demoUser = new User({
      username: 'demo',
      email: 'demo@example.com',
      password: 'password123',
      isSuperAdmin: false,
      isActive: true,
      permissions: demoPermissions.map(p => p._id)
    });

    await demoUser.save();
    console.log('✓ Demo user created');

    // 5. Create Sample Colleges
    const colleges = [
      {
        name: 'Stanford University',
        code: 'STAN',
        website: 'https://stanford.edu',
        address: '450 Serra Mall, Stanford, CA 94305',
        phone: '(650) 723-2300',
        email: 'admission@stanford.edu',
        status: 'active'
      },
      {
        name: 'Massachusetts Institute of Technology',
        code: 'MIT',
        website: 'https://mit.edu',
        address: '77 Massachusetts Ave, Cambridge, MA 02139',
        phone: '(617) 253-1000',
        email: 'admission@mit.edu',
        status: 'active'
      },
      {
        name: 'Harvard University',
        code: 'HARV',
        website: 'https://harvard.edu',
        address: 'Cambridge, MA 02138',
        phone: '(617) 495-1000',
        email: 'college@harvard.edu',
        status: 'active'
      }
    ];

    const createdColleges = await College.insertMany(colleges);
    console.log('✓ Sample colleges created');

    // 6. Create Sample Departments
    const departments = [
      {
        name: 'Computer Science',
        code: 'CS',
        collegeId: createdColleges[0]._id,
        email: 'cs@stanford.edu',
        description: 'Computer Science Department',
        status: 'active'
      },
      {
        name: 'Electrical Engineering',
        code: 'EE',
        collegeId: createdColleges[1]._id,
        email: 'ee@mit.edu',
        description: 'Electrical Engineering Department',
        status: 'active'
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        collegeId: createdColleges[2]._id,
        email: 'math@harvard.edu',
        description: 'Mathematics Department',
        status: 'active'
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('✓ Sample departments created');

    // 7. Create Sample Programs
    const programs = [
      {
        name: 'Bachelor of Computer Science',
        code: 'BCS',
        departmentId: createdDepartments[0]._id,
        duration: '4 years',
        degreeType: "Bachelor's",
        description: 'Undergraduate program in Computer Science',
        status: 'active'
      },
      {
        name: 'Master of Electrical Engineering',
        code: 'MEE',
        departmentId: createdDepartments[1]._id,
        duration: '2 years',
        degreeType: "Master's",
        description: 'Graduate program in Electrical Engineering',
        status: 'active'
      },
      {
        name: 'Doctor of Philosophy in Mathematics',
        code: 'PHD-MATH',
        departmentId: createdDepartments[2]._id,
        duration: '5 years',
        degreeType: 'Doctoral',
        description: 'Doctoral program in Mathematics',
        status: 'active'
      }
    ];

    const createdPrograms = await Program.insertMany(programs);
    console.log('✓ Sample programs created');

    // 8. Create Sample Branches
    const branches = [
      {
        name: 'Artificial Intelligence',
        code: 'AI',
        programId: createdPrograms[0]._id,
        description: 'AI specialization in Computer Science',
        status: 'active'
      },
      {
        name: 'Data Science',
        code: 'DS',
        programId: createdPrograms[0]._id,
        description: 'Data Science specialization in Computer Science',
        status: 'active'
      },
      {
        name: 'Power Systems',
        code: 'PS',
        programId: createdPrograms[1]._id,
        description: 'Power Systems specialization in Electrical Engineering',
        status: 'active'
      }
    ];

    const createdBranches = await Branch.insertMany(branches);
    console.log('✓ Sample branches created');

    // 9. Create Sample Academic Year
    const academicYears = [
      {
        name: '2024-2025',
        code: 'AY2024-25',
        startYear: 2024,
        endYear: 2025,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-07-31'),
        isCurrent: true,
        description: 'Academic Year 2024-2025',
        status: 'active'
      },
      {
        name: '2025-2026',
        code: 'AY2025-26',
        startYear: 2025,
        endYear: 2026,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-07-31'),
        isCurrent: false,
        description: 'Academic Year 2025-2026',
        status: 'upcoming'
      }
    ];

    await AcademicYear.insertMany(academicYears);
    console.log('✓ Sample academic years created');

    // 10. Create System Settings
    const settings = [
      {
        settingKey: 'site.name',
        settingValue: 'Academic Management System',
        settingGroup: 'general',
        isPublic: true,
        description: 'The name of the site'
      },
      {
        settingKey: 'site.description',
        settingValue: 'Comprehensive academic management and permission system',
        settingGroup: 'general',
        isPublic: true,
        description: 'The description of the site'
      },
      {
        settingKey: 'email.from_address',
        settingValue: 'noreply@example.com',
        settingGroup: 'email',
        isPublic: false,
        description: 'The email address that system emails are sent from'
      },
      {
        settingKey: 'email.smtp_host',
        settingValue: 'smtp.example.com',
        settingGroup: 'email',
        isPublic: false,
        description: 'SMTP server hostname'
      },
      {
        settingKey: 'security.password_expiry_days',
        settingValue: '90',
        settingGroup: 'security',
        isPublic: false,
        description: 'Number of days before passwords expire'
      },
      {
        settingKey: 'security.session_timeout_minutes',
        settingValue: '30',
        settingGroup: 'security',
        isPublic: false,
        description: 'Number of minutes before user sessions timeout'
      },
      // Add upload settings
      ...uploadSettings
    ];

    await SystemSetting.insertMany(settings);
    console.log('✓ System settings created');

    // 11. Create Menu Items
    const menuItems = [
      {
        name: 'Dashboard',
        route: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'dashboard.read',
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'Users',
        route: '/users',
        icon: 'Users',
        requiredPermission: 'users.read',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'Colleges',
        route: '/colleges',
        icon: 'Building',
        requiredPermission: 'colleges.read',
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'Departments',
        route: '/departments',
        icon: 'Building2',
        requiredPermission: 'departments.read',
        sortOrder: 4,
        isActive: true
      },
      {
        name: 'Programs',
        route: '/programs',
        icon: 'GraduationCap',
        requiredPermission: 'programs.read',
        sortOrder: 5,
        isActive: true
      },
      {
        name: 'Branches',
        route: '/branches',
        icon: 'GitBranch',
        requiredPermission: 'branches.read',
        sortOrder: 6,
        isActive: true
      },
      {
        name: 'Academic Years',
        route: '/academic-years',
        icon: 'Calendar',
        requiredPermission: 'academic_years.read',
        sortOrder: 7,
        isActive: true
      },
      {
        name: 'Regulations',
        route: '/regulations',
        icon: 'FileText',
        requiredPermission: 'regulations.read',
        sortOrder: 8,
        isActive: true
      },
      {
        name: 'Semesters',
        route: '/semesters',
        icon: 'Clock',
        requiredPermission: 'semesters.read',
        sortOrder: 9,
        isActive: true
      },
      {
        name: 'Batches',
        route: '/batches',
        icon: 'Users',
        requiredPermission: 'batches.read',
        sortOrder: 10,
        isActive: true
      },
      {
        name: 'Files',
        route: '/attachments',
        icon: 'File',
        requiredPermission: 'attachments.read',
        sortOrder: 11,
        isActive: true
      },
      {
        name: 'Settings',
        route: '/settings',
        icon: 'Settings',
        requiredPermission: 'settings.read',
        sortOrder: 12,
        isActive: true
      }
    ];

    const createdMenuItems = await MenuItem.insertMany(menuItems);

    // Create Admin menu with children
    const adminMenu = new MenuItem({
      name: 'Administration',
      route: '/admin',
      icon: 'Shield',
      requiredPermission: 'admin.access',
      sortOrder: 13,
      isActive: true
    });

    await adminMenu.save();

    const adminSubMenus = [
      {
        name: 'Permission Management',
        route: '/admin/permissions',
        icon: 'Lock',
        requiredPermission: 'permissions.manage',
        sortOrder: 1,
        isActive: true,
        parentId: adminMenu._id
      },
      {
        name: 'Models',
        route: '/admin/models',
        icon: 'Database',
        requiredPermission: 'models.manage',
        sortOrder: 2,
        isActive: true,
        parentId: adminMenu._id
      },
      {
        name: 'Audit Log',
        route: '/admin/audit-log',
        icon: 'History',
        requiredPermission: 'audit.read',
        sortOrder: 3,
        isActive: true,
        parentId: adminMenu._id
      },
      {
        name: 'ABAC Management',
        route: '/admin/abac',
        icon: 'ShieldCheck',
        requiredPermission: 'abac.read',
        sortOrder: 4,
        isActive: true,
        parentId: adminMenu._id
      }
    ];

    await MenuItem.insertMany(adminSubMenus);
    console.log('✓ Menu items created');

    console.log('Database seeded successfully!');
    console.log('Login credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('Demo: demo@example.com / password123');
    console.log('');
    console.log('Created sample data:');
    console.log('- 3 Colleges with departments');
    console.log('- 3 Programs with branches');
    console.log('- 2 Academic years');
    console.log('- Complete menu structure');
    console.log('- All permissions and models');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};