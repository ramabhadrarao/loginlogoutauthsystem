// server/utils/menuSeeders.js - Individual Menu Item Seeders
import MenuItem from '../models/MenuItem.js';

/**
 * Individual menu item seeder utilities
 * These functions allow you to seed, check, and manage menu items individually
 */

// Base menu items configuration
const BASE_MENU_ITEMS = {
  dashboard: {
    name: 'Dashboard',
    route: '/dashboard',
    icon: 'LayoutDashboard',
    requiredPermission: 'dashboard.read',
    sortOrder: 1,
    isActive: true
  },
  users: {
    name: 'Users',
    route: '/users',
    icon: 'Users',
    requiredPermission: 'users.read',
    sortOrder: 2,
    isActive: true
  },
  colleges: {
    name: 'Colleges',
    route: '/colleges',
    icon: 'Building',
    requiredPermission: 'colleges.read',
    sortOrder: 3,
    isActive: true
  },
  departments: {
    name: 'Departments',
    route: '/departments',
    icon: 'Building2',
    requiredPermission: 'departments.read',
    sortOrder: 4,
    isActive: true
  },
  files: {
    name: 'Files',
    route: '/attachments',
    icon: 'File',
    requiredPermission: 'attachments.read',
    sortOrder: 5,
    isActive: true
  },
  settings: {
    name: 'Settings',
    route: '/settings',
    icon: 'Settings',
    requiredPermission: 'settings.read',
    sortOrder: 6,
    isActive: true
  },
  administration: {
    name: 'Administration',
    route: '/admin',
    icon: 'ShieldCheck',
    requiredPermission: 'admin.access',
    sortOrder: 7,
    isActive: true
  }
};

const ADMIN_SUB_MENU_ITEMS = {
  permissions: {
    name: 'Permission Management',
    route: '/admin/permissions',
    icon: 'Lock',
    requiredPermission: 'permissions.manage',
    sortOrder: 1,
    isActive: true
  },
  models: {
    name: 'Models',
    route: '/admin/models',
    icon: 'Database',
    requiredPermission: 'models.manage',
    sortOrder: 2,
    isActive: true
  },
  auditLog: {
    name: 'Audit Log',
    route: '/admin/audit-log',
    icon: 'History',
    requiredPermission: 'audit.read',
    sortOrder: 3,
    isActive: true
  },
  abac: {
    name: 'ABAC Management',
    route: '/admin/abac',
    icon: 'Shield',
    requiredPermission: 'abac.manage',
    sortOrder: 4,
    isActive: true
  }
};

/**
 * Check if a menu item exists
 */
export const checkMenuItemExists = async (route) => {
  try {
    const existing = await MenuItem.findOne({ route });
    return existing !== null;
  } catch (error) {
    console.error(`Error checking menu item ${route}:`, error);
    return false;
  }
};

/**
 * Get all menu items
 */
export const getAllMenuItems = async () => {
  try {
    const menuItems = await MenuItem.find({})
      .populate('parentId')
      .sort({ sortOrder: 1 });
    return menuItems;
  } catch (error) {
    console.error('Error getting menu items:', error);
    return [];
  }
};

/**
 * Get menu items with hierarchy
 */
export const getMenuHierarchy = async () => {
  try {
    const menuItems = await MenuItem.find({ isActive: true })
      .populate('parentId')
      .sort({ sortOrder: 1 });

    // Build hierarchical structure
    const menuMap = new Map();
    const rootItems = [];

    // First pass: create menu item objects
    menuItems.forEach(item => {
      const menuItem = {
        _id: item._id.toString(),
        name: item.name,
        route: item.route,
        icon: item.icon,
        requiredPermission: item.requiredPermission,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        children: []
      };

      menuMap.set(item._id.toString(), menuItem);

      if (!item.parentId) {
        rootItems.push(menuItem);
      }
    });

    // Second pass: build parent-child relationships
    menuItems.forEach(item => {
      if (item.parentId) {
        const parent = menuMap.get(item.parentId.toString());
        const child = menuMap.get(item._id.toString());
        
        if (parent && child) {
          child.parentId = item.parentId.toString();
          parent.children.push(child);
        }
      }
    });

    // Sort children by sortOrder
    menuMap.forEach(item => {
      item.children.sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return rootItems.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error('Error getting menu hierarchy:', error);
    return [];
  }
};

/**
 * Seed a single menu item
 */
export const seedMenuItem = async (key, customData = {}) => {
  try {
    const menuData = BASE_MENU_ITEMS[key];
    if (!menuData) {
      throw new Error(`Menu item '${key}' not found in base configuration`);
    }

    const existing = await MenuItem.findOne({ route: menuData.route });
    if (existing) {
      console.log(`✓ Menu item '${menuData.name}' already exists`);
      return existing;
    }

    const finalData = { ...menuData, ...customData };
    const menuItem = new MenuItem(finalData);
    await menuItem.save();
    
    console.log(`✓ Created menu item: ${menuItem.name}`);
    return menuItem;
  } catch (error) {
    console.error(`Error seeding menu item ${key}:`, error);
    throw error;
  }
};

/**
 * Seed admin submenu item
 */
export const seedAdminSubMenuItem = async (key, parentId, customData = {}) => {
  try {
    const menuData = ADMIN_SUB_MENU_ITEMS[key];
    if (!menuData) {
      throw new Error(`Admin submenu item '${key}' not found in base configuration`);
    }

    const existing = await MenuItem.findOne({ route: menuData.route });
    if (existing) {
      console.log(`✓ Admin submenu item '${menuData.name}' already exists`);
      return existing;
    }

    const finalData = { ...menuData, parentId, ...customData };
    const menuItem = new MenuItem(finalData);
    await menuItem.save();
    
    console.log(`✓ Created admin submenu item: ${menuItem.name}`);
    return menuItem;
  } catch (error) {
    console.error(`Error seeding admin submenu item ${key}:`, error);
    throw error;
  }
};

/**
 * Seed all base menu items
 */
export const seedAllBaseMenuItems = async () => {
  try {
    console.log('🌱 Seeding base menu items...');
    
    const results = {};
    
    // Seed main menu items (excluding administration for now)
    const mainMenuKeys = Object.keys(BASE_MENU_ITEMS).filter(key => key !== 'administration');
    
    for (const key of mainMenuKeys) {
      results[key] = await seedMenuItem(key);
    }
    
    console.log('✅ Base menu items seeded successfully');
    return results;
  } catch (error) {
    console.error('❌ Error seeding base menu items:', error);
    throw error;
  }
};

/**
 * Seed administration menu with submenus
 */
export const seedAdministrationMenu = async () => {
  try {
    console.log('🌱 Seeding administration menu...');
    
    // First create the parent administration menu
    const adminMenu = await seedMenuItem('administration');
    
    // Then create all submenu items
    const subMenuResults = {};
    for (const key of Object.keys(ADMIN_SUB_MENU_ITEMS)) {
      subMenuResults[key] = await seedAdminSubMenuItem(key, adminMenu._id);
    }
    
    console.log('✅ Administration menu seeded successfully');
    return { parent: adminMenu, children: subMenuResults };
  } catch (error) {
    console.error('❌ Error seeding administration menu:', error);
    throw error;
  }
};

/**
 * Seed all menu items (complete setup)
 */
export const seedAllMenuItems = async () => {
  try {
    console.log('🌱 Starting complete menu seeding...');
    
    const baseMenus = await seedAllBaseMenuItems();
    const adminMenus = await seedAdministrationMenu();
    
    console.log('✅ All menu items seeded successfully');
    return { baseMenus, adminMenus };
  } catch (error) {
    console.error('❌ Error seeding all menu items:', error);
    throw error;
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (route, updateData) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { route },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    console.log(`✓ Updated menu item: ${menuItem.name}`);
    return menuItem;
  } catch (error) {
    console.error(`Error updating menu item ${route}:`, error);
    throw error;
  }
};

/**
 * Remove menu item
 */
export const removeMenuItem = async (route) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({ route });
    
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    console.log(`✓ Removed menu item: ${menuItem.name}`);
    return menuItem;
  } catch (error) {
    console.error(`Error removing menu item ${route}:`, error);
    throw error;
  }
};

/**
 * Disable/Enable menu item
 */
export const toggleMenuItem = async (route, isActive = null) => {
  try {
    const menuItem = await MenuItem.findOne({ route });
    
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    const newActiveState = isActive !== null ? isActive : !menuItem.isActive;
    menuItem.isActive = newActiveState;
    await menuItem.save();
    
    console.log(`✓ ${newActiveState ? 'Enabled' : 'Disabled'} menu item: ${menuItem.name}`);
    return menuItem;
  } catch (error) {
    console.error(`Error toggling menu item ${route}:`, error);
    throw error;
  }
};

/**
 * Get menu statistics
 */
export const getMenuStats = async () => {
  try {
    const total = await MenuItem.countDocuments();
    const active = await MenuItem.countDocuments({ isActive: true });
    const inactive = await MenuItem.countDocuments({ isActive: false });
    const withParent = await MenuItem.countDocuments({ parentId: { $exists: true } });
    const rootLevel = await MenuItem.countDocuments({ parentId: { $exists: false } });
    
    return {
      total,
      active,
      inactive,
      withParent,
      rootLevel,
      hierarchy: await getMenuHierarchy()
    };
  } catch (error) {
    console.error('Error getting menu stats:', error);
    return null;
  }
};

/**
 * Validate menu system
 */
export const validateMenuSystem = async () => {
  try {
    console.log('🔍 Validating menu system...');
    
    const issues = [];
    const allMenus = await getAllMenuItems();
    
    // Check for duplicate routes
    const routes = allMenus.map(item => item.route);
    const duplicateRoutes = routes.filter((route, index) => routes.indexOf(route) !== index);
    if (duplicateRoutes.length > 0) {
      issues.push(`Duplicate routes found: ${duplicateRoutes.join(', ')}`);
    }
    
    // Check for orphaned child menus
    const childMenus = allMenus.filter(item => item.parentId);
    for (const child of childMenus) {
      const parentExists = allMenus.some(item => item._id.toString() === child.parentId.toString());
      if (!parentExists) {
        issues.push(`Orphaned child menu found: ${child.name} (${child.route})`);
      }
    }
    
    // Check for missing required permissions
    const missingPermissions = allMenus.filter(item => !item.requiredPermission);
    if (missingPermissions.length > 0) {
      issues.push(`Menus without required permissions: ${missingPermissions.map(m => m.name).join(', ')}`);
    }
    
    if (issues.length === 0) {
      console.log('✅ Menu system validation passed');
      return { valid: true, issues: [] };
    } else {
      console.log('⚠️  Menu system validation found issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      return { valid: false, issues };
    }
  } catch (error) {
    console.error('❌ Error validating menu system:', error);
    return { valid: false, issues: [`Validation error: ${error.message}`] };
  }
};

/**
 * Reset menu system (danger zone)
 */
export const resetMenuSystem = async () => {
  try {
    console.log('⚠️  Resetting menu system...');
    
    await MenuItem.deleteMany({});
    console.log('✓ Cleared all menu items');
    
    const result = await seedAllMenuItems();
    console.log('✅ Menu system reset complete');
    
    return result;
  } catch (error) {
    console.error('❌ Error resetting menu system:', error);
    throw error;
  }
};

// Export available menu configurations for reference
export const AVAILABLE_MENU_ITEMS = {
  base: Object.keys(BASE_MENU_ITEMS),
  adminSub: Object.keys(ADMIN_SUB_MENU_ITEMS)
};

// Export menu data for external use
export { BASE_MENU_ITEMS, ADMIN_SUB_MENU_ITEMS };