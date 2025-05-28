# Individual Menu Item Seeders

This system provides fine-grained control over menu items with individual seeder functions and a CLI interface.

## 📁 File Structure

```
server/
├── utils/
│   └── menuSeeders.js          # Individual seeder functions
├── scripts/
│   └── menuManager.js          # CLI script
└── package.json                # Add script entry
```

## 🚀 Setup

### 1. Add to package.json

Add this script to your `server/package.json`:

```json
{
  "scripts": {
    "menu": "node scripts/menuManager.js"
  }
}
```

### 2. Make the script executable (optional)

```bash
chmod +x server/scripts/menuManager.js
```

## 🔧 CLI Usage

### Basic Commands

```bash
# Check all menu items
npm run menu list

# Show menu hierarchy
npm run menu hierarchy

# Get menu statistics
npm run menu stats

# Validate menu system
npm run menu validate

# Check if specific menu exists
npm run menu check /dashboard
```

### Seeding Commands

```bash
# Seed all menu items
npm run menu seed all

# Seed only base menu items (no admin submenu)
npm run menu seed base

# Seed administration menu with all submenus
npm run menu seed admin

# Seed individual menu item
npm run menu seed dashboard
npm run menu seed users
npm run menu seed colleges
```

### Management Commands

```bash
# Enable/disable menu items
npm run menu enable /admin/abac
npm run menu disable /admin/abac
npm run menu toggle /admin/abac

# Update menu item properties
npm run menu update /dashboard name "Main Dashboard"
npm run menu update /dashboard sortOrder 1
npm run menu update /dashboard isActive true

# Remove menu item
npm run menu remove /admin/abac

# Reset entire menu system (DANGER!)
npm run menu reset --confirm
```

## 🔍 Checking Sidebar & Dashboard

### Check Current Menu State

```bash
# See all menu items and their status
npm run menu list

# View hierarchical structure
npm run menu hierarchy

# Get detailed statistics
npm run menu stats
```

### Validate Menu System

```bash
# Check for issues like orphaned children, duplicate routes, etc.
npm run menu validate
```

### Example Output

```
📊 Menu Statistics:
Total Menu Items: 11
Active: 10
Inactive: 1
Root Level: 7
Sub-menu Items: 4

🌳 Menu Hierarchy:
✅ Dashboard -> /dashboard
✅ Users -> /users
✅ Colleges -> /colleges
✅ Departments -> /departments
✅ Files -> /attachments
✅ Settings -> /settings
✅ Administration -> /admin
  ✅ Permission Management -> /admin/permissions
  ✅ Models -> /admin/models
  ✅ Audit Log -> /admin/audit-log
  ❌ ABAC Management -> /admin/abac
```

## 📋 Available Menu Items

### Base Menu Items
- `dashboard` - Main dashboard
- `users` - User management
- `colleges` - College management
- `departments` - Department management  
- `files` - File attachments
- `settings` - System settings
- `administration` - Admin section parent

### Admin Sub-Menu Items
- `permissions` - Permission management
- `models` - Model management
- `auditLog` - Audit log viewer
- `abac` - ABAC management

## 🛠️ Programmatic Usage

You can also use the seeder functions directly in your code:

```javascript
import {
  seedMenuItem,
  seedAllMenuItems,
  checkMenuItemExists,
  getMenuHierarchy,
  validateMenuSystem
} from './utils/menuSeeders.js';

// Check if dashboard exists
const dashboardExists = await checkMenuItemExists('/dashboard');

// Seed individual item
await seedMenuItem('dashboard');

// Get menu hierarchy for frontend
const menuHierarchy = await getMenuHierarchy();

// Validate before serving menu
const validation = await validateMenuSystem();
if (!validation.valid) {
  console.warn('Menu system has issues:', validation.issues);
}
```

## 🔧 Integration with Existing System

### Update your current seedData.js

Replace the menu seeding section in `server/utils/seedData.js`:

```javascript
import { seedAllMenuItems } from './menuSeeders.js';

export const seedDatabase = async () => {
  try {
    // ... existing code ...

    // Replace the menu seeding section with:
    await seedAllMenuItems();
    console.log('✓ Menu items seeded');

    // ... rest of existing code ...
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
```

### Frontend Integration

The menu hierarchy function returns data in the exact format your React sidebar expects:

```javascript
// server/routes/menu.js
import { getMenuHierarchy } from '../utils/menuSeeders.js';

router.get('/', async (req, res) => {
  try {
    const menuItems = await getMenuHierarchy();
    
    // Filter based on user permissions (existing logic)
    const filteredMenuItems = menuItems.filter(item => {
      if (req.user.isSuperAdmin) return true;
      return req.user.permissions.some(
        permission => permission.permissionKey === item.requiredPermission
      );
    });

    res.json(filteredMenuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Menu not showing in sidebar**
   ```bash
   npm run menu check /your-route
   npm run menu validate
   ```

2. **ABAC menu missing**
   ```bash
   npm run menu seed abac  # Won't work alone
   npm run menu seed admin  # This will create parent + all children
   ```

3. **Duplicate or orphaned menus**
   ```bash
   npm run menu validate
   npm run menu reset --confirm  # Nuclear option
   ```

4. **Permission issues**
   - Check `requiredPermission` field matches your permission system
   - Verify user has the required permission
   - Check if permission exists in database

### Debug Menu Loading

Add this to your menu route for debugging:

```javascript
console.log('Raw menu items:', menuItems.length);
console.log('User permissions:', req.user.permissions.map(p => p.permissionKey));
console.log('Filtered menu items:', filteredMenuItems.length);
```

## 🎯 Best Practices

1. **Always validate after changes**
   ```bash
   npm run menu validate
   ```

2. **Use specific commands for specific needs**
   ```bash
   npm run menu seed dashboard  # Just dashboard
   npm run menu seed admin      # All admin items
   ```

3. **Check before seeding**
   ```bash
   npm run menu list  # See what exists
   npm run menu seed base  # Only add what's missing
   ```

4. **Keep backups of custom menus**
   - Export menu config before major changes
   - Test changes in development first

This system gives you complete control over individual menu items while maintaining the existing functionality!