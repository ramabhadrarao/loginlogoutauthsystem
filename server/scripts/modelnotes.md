# Model Management System - Quick Reference Guide

## 🚀 Quick Start - Add Missing Academic Models

Based on your existing database, you have **8 models** but are missing **6 academic structure models**.

### Step 1: Check What's Missing
```bash
npm run model missing
```

### Step 2: Add Missing Academic Models
```bash
npm run model seed academic
```
This adds: programs, branches, academic_years, regulations, semesters, batches

### Step 3: Verify Installation
```bash
npm run model list academic
npm run model stats
```

## 📊 Your Current Database Status

### ✅ **Existing Models (8)**
- users - Users
- colleges - Colleges  
- attachments - Attachments
- settings - Settings
- dashboard - Dashboard
- admin - Admin
- departments - Departments
- abac - ABAC Management

### ❌ **Missing Academic Models (6)**
- programs - Academic Programs
- branches - Specialization Branches
- academic_years - Academic Year Management
- regulations - Academic Regulations
- semesters - Semester Management
- batches - Student Batch Management

### 🎯 **Expected Total: 14 Models**

## 🛠️ CLI Commands Reference

### Setup Script in package.json
```json
{
  "scripts": {
    "model": "node scripts/modelManager.js"
  }
}
```

### Information Commands
```bash
npm run model check programs      # Check if specific model exists
npm run model list               # List all models (categorized)
npm run model list academic      # List only academic models
npm run model stats              # Show comprehensive statistics
npm run model missing           # Show missing models
npm run model validate          # Validate entire model system
```

### Seeding Commands
```bash
npm run model seed missing      # Add only missing models (RECOMMENDED)
npm run model seed academic     # Add academic structure models
npm run model seed core         # Add core system models
npm run model seed institutional # Add institutional models
npm run model seed all          # Add all models (careful with existing data)
npm run model seed programs     # Add specific model
```

### Management Commands
```bash
npm run model activate programs      # Activate a model
npm run model deactivate programs    # Deactivate a model
npm run model toggle programs        # Toggle model status
npm run model update programs displayName "Academic Programs"
npm run model permissions programs   # Show model permissions
npm run model refresh programs       # Regenerate model permissions
npm run model remove programs        # Remove model (dangerous!)
```

## 📋 Model Categories & Permissions

### Core System Models
| Model | Permissions | Description |
|-------|-------------|-------------|
| users | users.create, users.read, users.update, users.delete | User management |
| dashboard | dashboard.read | Dashboard access |
| attachments | attachments.* | File management |
| settings | settings.* | System configuration |
| admin | admin.access, permissions.manage, models.manage, audit.read | Admin functions |
| abac | abac.read, abac.manage | Access control |

### Institutional Models
| Model | Permissions | Description |
|-------|-------------|-------------|
| colleges | colleges.* | Educational institutions |
| departments | departments.* | Academic departments |

### Academic Structure Models ⭐ **MISSING FROM YOUR DB**
| Model | Permissions | Description |
|-------|-------------|-------------|
| programs | programs.* | Degree programs |
| branches | branches.* | Program specializations |
| academic_years | academic_years.* | Academic year management |
| regulations | regulations.* | Academic policies |
| semesters | semesters.* | Semester management |
| batches | batches.* | Student batch management |

## 🔧 Individual Model Seeding

### Academic Models Only (What You Need)
```bash
npm run model seed programs
npm run model seed branches
npm run model seed academicYears
npm run model seed regulations
npm run model seed semesters
npm run model seed batches
```

### Verify Each Model
```bash
npm run model check programs
npm run model check branches
npm run model check academic_years
npm run model check regulations
npm run model check semesters
npm run model check batches
```

## 🎯 Recommended Workflow for Your Database

Since you already have 8 models, here's the safest approach:

1. **Check what's missing:**
   ```bash
   npm run model missing
   ```

2. **Add only missing models:**
   ```bash
   npm run model seed missing
   ```

3. **Verify everything is working:**
   ```bash
   npm run model validate
   npm run model stats
   ```

4. **Check permissions were created correctly:**
   ```bash
   npm run model permissions programs
   npm run model permissions branches
   # ... for each new model
   ```

## 🚨 Important Notes

### Permission Generation
Each seeded model automatically gets:
- Standard CRUD permissions (create, read, update, delete)
- Special permissions for admin/abac models
- Proper permission keys (e.g., `programs.read`, `programs.create`)

### Database Safety
- ✅ `seed missing` - Safe, only adds what's not there
- ✅ `seed academic` - Safe, skips existing models
- ⚠️ `seed all` - May log warnings for existing models
- 🚨 `remove` - Dangerous, deletes model and permissions

### Integration with Your Routes
Your existing routes expect these models:
- `/api/programs` → needs `programs` model
- `/api/branches` → needs `branches` model
- `/api/academic-years` → needs `academic_years` model
- `/api/regulations` → needs `regulations` model
- `/api/semesters` → needs `semesters` model
- `/api/batches` → needs `batches` model

## 🎉 Success Verification

After running `npm run model seed academic`, you should see:

```
🎓 Seeding academic structure models...
✅ Created model: Programs (programs)
✅ Created 4 permissions for Programs
✅ Created model: Branches (branches)
✅ Created 4 permissions for Branches
✅ Created model: Academic Years (academic_years)
✅ Created 4 permissions for Academic Years
✅ Created model: Regulations (regulations)
✅ Created 4 permissions for Regulations
✅ Created model: Semesters (semesters)
✅ Created 4 permissions for Semesters
✅ Created model: Batches (batches)
✅ Created 4 permissions for Batches
✅ Academic structure models seeding completed - 6 models processed
```

Then your model stats should show:
```
📊 Model Statistics:
Total Models: 14
Active: 14
Inactive: 0

By Category:
  ✅ CORE: 6/6 (0 missing)
  ✅ INSTITUTIONAL: 2/2 (0 missing)
  ✅ ACADEMIC: 6/6 (0 missing)
```

Your academic management system will now have complete model coverage! 🎓