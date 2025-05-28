// server/routes/menu.js
import express from 'express';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// Get menu items for the current user
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isActive: true })
      .populate('parentId')
      .sort({ sortOrder: 1 });

    // Filter menu items based on user permissions
    const filteredMenuItems = menuItems.filter(item => {
      // Super admin can see everything
      if (req.user.isSuperAdmin) return true;
      
      // Check if user has the required permission
      return req.user.permissions.some(
        permission => permission.permissionKey === item.requiredPermission
      );
    });

    // Build hierarchical menu structure
    const menuTree = buildMenuTree(filteredMenuItems);

    res.json(menuTree);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to build menu tree
function buildMenuTree(menuItems) {
  const menuMap = new Map();
  const rootItems = [];

  // First pass: create menu item objects and map them
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
}

export default router;