// server/utils/menuSeeders.js - Individual menu item seeder functions
import MenuItem from '../models/MenuItem.js';

// Base menu items (main navigation)
export const BASE_MENU_ITEMS = {
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
    icon: 'Shield',
    requiredPermission: 'admin.access',
    sortOrder: 7,
    isActive: true
  }
};

// Admin sub-menu items (children of administration)
export const ADMIN_SUB_MENU_ITEMS = {
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
    icon: 'ShieldCheck',
    requiredPermission: 'abac.read',
    sortOrder: 4,
    isActive: true
  }
};

// Available menu items for CLI help
export const AVAILABLE_MENU_ITEMS = {
  base: Object.keys(BASE_MENU_ITEMS),
  adminSub: Object.keys(ADMIN_SUB_MENU_ITEMS)
};

/**
 * Check if a menu item exists by route
 */
export const checkMenuItemExists = async (route) => {
  try {
    const menuItem = await MenuItem.findOne({ route });
    return !!menuItem;
  } catch (error) {
    console.error('Error checking menu item:', error);
    return false;
  }
};

/**
 * Seed a single base menu item
 */
export const seedMenuItem = async (itemKey) => {
  try {
    const itemData = BASE_MENU_ITEMS[itemKey];
    if (!itemData) {
      throw new Error(`Unknown menu item: ${itemKey}`);
    }

    const exists = await checkMenuItemExists(itemData.route);
    if (exists) {
      console.log(`⚠️  Menu item '${itemData.name}' already exists`);
      return;
    }

    await MenuItem.create(itemData);
    console.log(`✅ Created menu item: ${itemData.name} -> ${itemData.route}`);
  } catch (error) {
    console.error(`❌ Error seeding menu item '${itemKey}':`, error.message);
    throw error;
  }
};

/**
 * Seed an admin sub-menu item (requires parent)
 */
export const seedAdminSubMenuItem = async (itemKey, parentId) => {
  try {
    const itemData = ADMIN_SUB_MENU_ITEMS[itemKey];
    if (!itemData) {
      throw new Error(`Unknown admin sub-menu item: ${itemKey}`);
    }

    const exists = await checkMenuItemExists(itemData.route);
    if (exists) {
      console.log(`⚠️  Admin sub-menu item '${itemData.name}' already exists`);
      return;
    }

    await MenuItem.create({
      ...itemData,
      parentId
    });
    console.log(`✅ Created admin sub-menu: ${itemData.name} -> ${itemData.route}`);
  } catch (error) {
    console.error(`❌ Error seeding admin sub-menu item '${itemKey}':`, error.message);
    throw error;
  }
};

/**
 * Seed all base menu items (no admin sub-menus)
 */
export const seedAllBaseMenuItems = async () => {
  console.log('🌱 Seeding base menu items...');
  
  for (const itemKey of Object.keys(BASE_MENU_ITEMS)) {
    await seedMenuItem(itemKey);
  }
  
  console.log('✅ Base menu items seeding completed');
};

/**
 * Seed administration menu with all sub-menus
 */
export const seedAdministrationMenu = async () => {
  console.log('🌱 Seeding administration menu...');
  
  // First ensure the administration parent exists
  let adminMenu = await MenuItem.findOne({ route: '/admin' });
  
  if (!adminMenu) {
    await seedMenuItem('administration');
    adminMenu = await MenuItem.findOne({ route: '/admin' });
  }
  
  if (!adminMenu) {
    throw new Error('Failed to create administration parent menu');
  }
  
  // Seed all admin sub-menus
  for (const itemKey of Object.keys(ADMIN_SUB_MENU_ITEMS)) {
    await seedAdminSubMenuItem(itemKey, adminMenu._id);
  }
  
  console.log('✅ Administration menu seeding completed');
};

/**
 * Seed all menu items (base + admin)
 */
export const seedAllMenuItems = async () => {
  console.log('🌱 Seeding all menu items...');
  
  await seedAllBaseMenuItems();
  await seedAdministrationMenu();
  
  console.log('✅ All menu items seeding completed');
};

/**
 * Get all menu items from database
 */
export const getAllMenuItems = async () => {
  try {
    return await MenuItem.find().sort({ sortOrder: 1, name: 1 });
  } catch (error) {
    console.error('Error getting all menu items:', error);
    return [];
  }
};

/**
 * Get menu hierarchy (for frontend use)
 */
export const getMenuHierarchy = async () => {
  try {
    const allMenuItems = await getAllMenuItems();
    
    // Separate parent and child items
    const parentItems = allMenuItems.filter(item => !item.parentId);
    const childItems = allMenuItems.filter(item => item.parentId);
    
    // Build hierarchy
    const hierarchy = parentItems.map(parent => {
      const children = childItems.filter(child => 
        child.parentId.toString() === parent._id.toString()
      ).sort((a, b) => a.sortOrder - b.sortOrder);
      
      return {
        _id: parent._id.toString(),
        name: parent.name,
        route: parent.route,
        icon: parent.icon,
        requiredPermission: parent.requiredPermission,
        sortOrder: parent.sortOrder,
        isActive: parent.isActive,
        children: children.map(child => ({
          _id: child._id.toString(),
          name: child.name,
          route: child.route,
          icon: child.icon,
          requiredPermission: child.requiredPermission,
          sortOrder: child.sortOrder,
          isActive: child.isActive,
          parentId: child.parentId.toString()
        }))
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
    
    return hierarchy;
  } catch (error) {
    console.error('Error getting menu hierarchy:', error);
    return [];
  }
};

/**
 * Get menu statistics
 */
export const getMenuStats = async () => {
  try {
    const allMenuItems = await getAllMenuItems();
    
    const stats = {
      total: allMenuItems.length,
      active: allMenuItems.filter(item => item.isActive).length,
      inactive: allMenuItems.filter(item => !item.isActive).length,
      rootLevel: allMenuItems.filter(item => !item.parentId).length,
      withParent: allMenuItems.filter(item => item.parentId).length
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting menu stats:', error);
    return null;
  }
};

/**
 * Validate menu system integrity
 */
export const validateMenuSystem = async () => {
  try {
    const allMenuItems = await getAllMenuItems();
    const issues = [];
    
    // Check for duplicate routes
    const routes = allMenuItems.map(item => item.route);
    const duplicateRoutes = routes.filter((route, index) => routes.indexOf(route) !== index);
    if (duplicateRoutes.length > 0) {
      issues.push(`Duplicate routes found: ${duplicateRoutes.join(', ')}`);
    }
    
    // Check for orphaned children
    const childItems = allMenuItems.filter(item => item.parentId);
    const parentIds = allMenuItems.filter(item => !item.parentId).map(item => item._id.toString());
    
    for (const child of childItems) {
      if (!parentIds.includes(child.parentId.toString())) {
        issues.push(`Orphaned child menu item: ${child.name} (${child.route})`);
      }
    }
    
    // Check for missing required permissions (basic validation)
    const itemsWithoutPermission = allMenuItems.filter(item => !item.requiredPermission);
    if (itemsWithoutPermission.length > 0) {
      issues.push(`Menu items without required permissions: ${itemsWithoutPermission.map(item => item.name).join(', ')}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('Error validating menu system:', error);
    return {
      valid: false,
      issues: ['Error during validation: ' + error.message]
    };
  }
};

/**
 * Toggle menu item active status
 */
export const toggleMenuItem = async (route, forceStatus = null) => {
  try {
    const menuItem = await MenuItem.findOne({ route });
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    const newStatus = forceStatus !== null ? forceStatus : !menuItem.isActive;
    
    await MenuItem.findByIdAndUpdate(menuItem._id, { isActive: newStatus });
    
    const action = newStatus ? 'enabled' : 'disabled';
    console.log(`✅ Menu item '${menuItem.name}' ${action}`);
  } catch (error) {
    console.error(`❌ Error toggling menu item:`, error.message);
    throw error;
  }
};

/**
 * Update menu item properties
 */
export const updateMenuItem = async (route, updateData) => {
  try {
    const menuItem = await MenuItem.findOne({ route });
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    await MenuItem.findByIdAndUpdate(menuItem._id, updateData);
    
    console.log(`✅ Menu item '${menuItem.name}' updated`);
    console.log(`   Updated fields: ${Object.keys(updateData).join(', ')}`);
  } catch (error) {
    console.error(`❌ Error updating menu item:`, error.message);
    throw error;
  }
};

/**
 * Remove menu item
 */
export const removeMenuItem = async (route) => {
  try {
    const menuItem = await MenuItem.findOne({ route });
    if (!menuItem) {
      throw new Error(`Menu item with route '${route}' not found`);
    }
    
    // Check if it has children
    const children = await MenuItem.find({ parentId: menuItem._id });
    if (children.length > 0) {
      console.log(`⚠️  Menu item '${menuItem.name}' has ${children.length} child items`);
      console.log(`   Children will also be removed: ${children.map(c => c.name).join(', ')}`);
      
      // Remove children first
      await MenuItem.deleteMany({ parentId: menuItem._id });
      console.log(`✅ Removed ${children.length} child menu items`);
    }
    
    // Remove the menu item
    await MenuItem.findByIdAndDelete(menuItem._id);
    console.log(`✅ Menu item '${menuItem.name}' removed`);
  } catch (error) {
    console.error(`❌ Error removing menu item:`, error.message);
    throw error;
  }
};

/**
 * Reset entire menu system (DANGEROUS!)
 */
export const resetMenuSystem = async () => {
  try {
    console.log('🗑️  Removing all existing menu items...');
    const deleteResult = await MenuItem.deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} menu items`);
    
    console.log('🌱 Recreating menu system...');
    await seedAllMenuItems();
    
    console.log('✅ Menu system reset completed');
  } catch (error) {
    console.error(`❌ Error resetting menu system:`, error.message);
    throw error;
  }
};

export default {
  seedMenuItem,
  seedAdminSubMenuItem,
  seedAllBaseMenuItems,
  seedAdministrationMenu,
  seedAllMenuItems,
  checkMenuItemExists,
  getAllMenuItems,
  getMenuHierarchy,
  getMenuStats,
  validateMenuSystem,
  toggleMenuItem,
  updateMenuItem,
  removeMenuItem,
  resetMenuSystem,
  BASE_MENU_ITEMS,
  ADMIN_SUB_MENU_ITEMS,
  AVAILABLE_MENU_ITEMS
};