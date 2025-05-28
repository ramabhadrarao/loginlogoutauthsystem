// src/components/layout/Sidebar.tsx - Updated with Academic menu items
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { useSettings } from '../../hooks/useSettings';
import { MenuItem } from '../../types';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { menuApi } from '../../utils/api';

// Dynamically get icon component
const getIcon = (iconName: string) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return <Icon className="h-5 w-5" />;
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { hasPermission, hasAnyPermission, user, getEffectivePermissions } = useAuth();
  const { getSetting } = useSettings();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get dynamic settings
  const siteName = getSetting('site.name', 'PermSys');

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        
        // Try to load from API first
        try {
          const items = await menuApi.getAll();
          setMenuItems(items);
        } catch (error) {
          console.error('Failed to load menu items from API:', error);
          
          // Fallback to smart dynamic menu generation
          const dynamicMenuItems = generateSmartMenu();
          setMenuItems(dynamicMenuItems);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadMenuItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Generate smart menu based on user's actual permissions
  const generateSmartMenu = (): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    let itemId = 1;

    // Dashboard - always show if user has any system access
    if (hasPermission('dashboard.read')) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Dashboard',
        route: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'dashboard.read',
        sortOrder: 1,
        isActive: true
      });
    }

    // Users - show if user has any user permissions
    const userPerms = getEffectivePermissions('users');
    if (userPerms.canRead) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Users',
        route: '/users',
        icon: 'Users',
        requiredPermission: 'users.read',
        sortOrder: 2,
        isActive: true
      });
    }

    // Colleges - show if user has any college permissions
    const collegePerms = getEffectivePermissions('colleges');
    if (collegePerms.canRead) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Colleges',
        route: '/colleges',
        icon: 'Building',
        requiredPermission: 'colleges.read',
        sortOrder: 3,
        isActive: true
      });
    }

    // Departments - show if user has any department permissions
    const departmentPerms = getEffectivePermissions('departments');
    if (departmentPerms.canRead) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Departments',
        route: '/departments',
        icon: 'Building2',
        requiredPermission: 'departments.read',
        sortOrder: 4,
        isActive: true
      });
    }

    // Academic Section - check if user has access to any academic functionality
    const academicPermissions = [
      'academic_years.read',
      'programs.read',
      'branches.read',
      'regulations.read',
      'batches.read',
      'semesters.read'
    ];

    const hasAcademicAccess = hasAnyPermission(academicPermissions);

    if (hasAcademicAccess) {
      const academicChildren: MenuItem[] = [];
      let academicItemId = 200;

      // Academic Years
      if (hasPermission('academic_years.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Academic Years',
          route: '/academic/years',
          icon: 'Calendar',
          requiredPermission: 'academic_years.read',
          sortOrder: 1,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Programs
      if (hasPermission('programs.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Programs',
          route: '/academic/programs',
          icon: 'GraduationCap',
          requiredPermission: 'programs.read',
          sortOrder: 2,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Branches
      if (hasPermission('branches.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Branches',
          route: '/academic/branches',
          icon: 'GitBranch',
          requiredPermission: 'branches.read',
          sortOrder: 3,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Regulations
      if (hasPermission('regulations.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Regulations',
          route: '/academic/regulations',
          icon: 'BookOpen',
          requiredPermission: 'regulations.read',
          sortOrder: 4,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Batches
      if (hasPermission('batches.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Batches',
          route: '/academic/batches',
          icon: 'Users',
          requiredPermission: 'batches.read',
          sortOrder: 5,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Semesters
      if (hasPermission('semesters.read')) {
        academicChildren.push({
          _id: (academicItemId++).toString(),
          name: 'Semesters',
          route: '/academic/semesters',
          icon: 'Calendar',
          requiredPermission: 'semesters.read',
          sortOrder: 6,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Only add academic menu if there are children
      if (academicChildren.length > 0) {
        menuItems.push({
          _id: (itemId++).toString(),
          name: 'Academic',
          icon: 'GraduationCap',
          route: '/academic',
          requiredPermission: 'academic.access',
          sortOrder: 5,
          isActive: true,
          children: academicChildren
        });
      }
    }

    // Files/Attachments - show if user has any attachment permissions
    const attachmentPerms = getEffectivePermissions('attachments');
    if (attachmentPerms.canRead) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Files',
        route: '/attachments',
        icon: 'File',
        requiredPermission: 'attachments.read',
        sortOrder: 6,
        isActive: true
      });
    }

    // Settings - show if user has any settings permissions
    const settingsPerms = getEffectivePermissions('settings');
    if (settingsPerms.canRead) {
      menuItems.push({
        _id: (itemId++).toString(),
        name: 'Settings',
        route: '/settings',
        icon: 'Settings',
        requiredPermission: 'settings.read',
        sortOrder: 7,
        isActive: true
      });
    }

    // Admin Section - only show if user has any admin permissions
    const adminPermissions = [
      'permissions.manage',
      'models.manage', 
      'audit.read',
      'abac.manage'
    ];

    const hasAdminAccess = hasAnyPermission(adminPermissions);

    if (hasAdminAccess) {
      const adminChildren: MenuItem[] = [];
      let adminItemId = 100;

      // Permission Management
      if (hasPermission('permissions.manage')) {
        adminChildren.push({
          _id: (adminItemId++).toString(),
          name: 'Permission Management',
          route: '/admin/permissions',
          icon: 'Lock',
          requiredPermission: 'permissions.manage',
          sortOrder: 1,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Models Management
      if (hasPermission('models.manage')) {
        adminChildren.push({
          _id: (adminItemId++).toString(),
          name: 'Models',
          route: '/admin/models',
          icon: 'Database',
          requiredPermission: 'models.manage',
          sortOrder: 2,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Audit Log
      if (hasPermission('audit.read')) {
        adminChildren.push({
          _id: (adminItemId++).toString(),
          name: 'Audit Log',
          route: '/admin/audit-log',
          icon: 'History',
          requiredPermission: 'audit.read',
          sortOrder: 3,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // ABAC Management
      if (hasPermission('abac.manage')) {
        adminChildren.push({
          _id: (adminItemId++).toString(),
          name: 'ABAC Management',
          route: '/admin/abac',
          icon: 'Shield',
          requiredPermission: 'abac.manage',
          sortOrder: 4,
          isActive: true,
          parentId: itemId.toString()
        });
      }

      // Only add admin menu if there are children
      if (adminChildren.length > 0) {
        menuItems.push({
          _id: (itemId++).toString(),
          name: 'Administration',
          icon: 'ShieldCheck',
          route: '/admin',
          requiredPermission: 'admin.access',
          sortOrder: 8,
          isActive: true,
          children: adminChildren
        });
      }
    }

    return menuItems;
  };

  // Render menu items with smart permission checking
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map(item => (
      <React.Fragment key={item._id}>
        {!item.children || item.children.length === 0 ? (
          <NavLink
            to={item.route}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${isActive 
                ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-600' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
              transition-all duration-200 ease-in-out
            `}
            onClick={() => setIsOpen(false)}
          >
            {getIcon(item.icon)}
            <span>{item.name}</span>
            
            {/* Show permission indicators for development */}
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-auto text-xs text-gray-400">
                {getPermissionBadge(item.requiredPermission.split('.')[0])}
              </span>
            )}
          </NavLink>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 rounded-lg">
              {getIcon(item.icon)}
              <span>{item.name}</span>
              <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                {item.children.length}
              </span>
            </div>
            <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
              {renderMenuItems(item.children)}
            </div>
          </div>
        )}
      </React.Fragment>
    ));
  };

  // Get permission badge for visual feedback (development only)
  const getPermissionBadge = (modelName: string) => {
    if (!modelName || user?.isSuperAdmin) return 'ALL';
    
    const perms = getEffectivePermissions(modelName);
    const badges = [];
    
    if (perms.canCreate) badges.push('C');
    if (perms.canRead) badges.push('R');
    if (perms.canUpdate) badges.push('U'); 
    if (perms.canDelete) badges.push('D');
    
    return badges.length > 0 ? badges.join('') : 'NONE';
  };

  if (loading) {
    return (
      <>
        {/* Mobile sidebar overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:relative md:z-0 md:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            flex flex-col h-full
          `}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 flex-shrink-0">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center">
                <Icons.Shield className="h-4 w-4 text-white" />
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">{siteName}</span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content area with loading */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Icons.Info className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">Loading Menu...</p>
                <p className="text-xs text-gray-500">Please wait</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:relative md:z-0 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col h-full
        `}
      >
        {/* Sidebar header - Fixed - Now uses dynamic site name */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 flex-shrink-0 bg-white">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center">
              <Icons.Shield className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">{siteName}</span>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.length > 0 ? (
              renderMenuItems(menuItems)
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Icons.Menu className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No Menu Access</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contact administrator for permissions
                </p>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar footer - Fixed */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              user?.isSuperAdmin ? 'bg-purple-100' : 'bg-indigo-100'
            }`}>
              <Icons.User className={`h-4 w-4 ${
                user?.isSuperAdmin ? 'text-purple-600' : 'text-indigo-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.isSuperAdmin ? 'Super Admin' : `${menuItems.length} menu items`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;