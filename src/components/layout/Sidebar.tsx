import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { MenuItem } from '../../types';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';

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
  const { hasPermission } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    // Simulated menu items - in a real app, this would come from the API
    const mockMenuItems: MenuItem[] = [
      {
        _id: '1',
        name: 'Dashboard',
        route: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'dashboard.read',
        sortOrder: 1,
        isActive: true
      },
      {
        _id: '2',
        name: 'Users',
        route: '/users',
        icon: 'Users',
        requiredPermission: 'users.read',
        sortOrder: 2,
        isActive: true
      },
      {
        _id: '3',
        name: 'Colleges',
        route: '/colleges',
        icon: 'Building',
        requiredPermission: 'colleges.read',
        sortOrder: 3,
        isActive: true
      },
      {
        _id: '4',
        name: 'Files',
        route: '/attachments',
        icon: 'File',
        requiredPermission: 'attachments.read',
        sortOrder: 4,
        isActive: true
      },
      {
        _id: '5',
        name: 'Settings',
        route: '/settings',
        icon: 'Settings',
        requiredPermission: 'settings.read',
        sortOrder: 5,
        isActive: true
      },
      {
        _id: '6',
        name: 'Admin',
        icon: 'Shield',
        route: '/admin',
        requiredPermission: 'admin.access',
        sortOrder: 6,
        isActive: true,
        children: [
          {
            _id: '7',
            name: 'Permission Management',
            route: '/admin/permissions',
            icon: 'Lock',
            requiredPermission: 'permissions.manage',
            sortOrder: 1,
            isActive: true,
            parentId: '6'
          },
          {
            _id: '8',
            name: 'Models',
            route: '/admin/models',
            icon: 'Database',
            requiredPermission: 'models.manage',
            sortOrder: 2,
            isActive: true,
            parentId: '6'
          },
          {
            _id: '9',
            name: 'Audit Log',
            route: '/admin/audit-log',
            icon: 'History',
            requiredPermission: 'audit.read',
            sortOrder: 3,
            isActive: true,
            parentId: '6'
          }
        ]
      }
    ];

    // Filter menu items based on permissions
    const filteredMenuItems = mockMenuItems.filter(item => {
      // Check if the user has permission for this menu item
      const hasItemPermission = hasPermission(item.requiredPermission);
      
      // If the item has children, filter them too
      if (item.children) {
        item.children = item.children.filter(child => 
          hasPermission(child.requiredPermission)
        );
      }
      
      // Include item if the user has permission or if it has any visible children
      return hasItemPermission || (item.children && item.children.length > 0);
    });

    setMenuItems(filteredMenuItems);
  }, [hasPermission]);

  // Render menu items
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map(item => (
      <React.Fragment key={item._id}>
        {!item.children ? (
          <NavLink
            to={item.route}
            className={({ isActive }) => `
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
              ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
              transition-colors duration-150 ease-in-out
            `}
          >
            {getIcon(item.icon)}
            <span>{item.name}</span>
          </NavLink>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700">
              {getIcon(item.icon)}
              <span>{item.name}</span>
            </div>
            <div className="ml-6 space-y-1 border-l border-gray-200 pl-2">
              {renderMenuItems(item.children)}
            </div>
          </div>
        )}
      </React.Fragment>
    ));
  };

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
        `}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center">
              <Icons.Shield className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">PermSys</span>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="h-0 flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {renderMenuItems(menuItems)}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Icons.Info className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">Permission System</p>
              <p className="text-xs text-gray-500">v0.1.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;