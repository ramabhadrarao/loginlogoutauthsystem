import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { usersApi, permissionsApi } from '../../utils/api';
import { User, Permission } from '../../types';
import { Save, Check, X, Info, Search, RefreshCw } from 'lucide-react';

const PermissionManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Group permissions by model
  const permissionsByModel = permissions.reduce((acc, permission) => {
    const modelId = permission.modelId;
    if (!acc[modelId]) {
      acc[modelId] = [];
    }
    acc[modelId].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Load all users and permissions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, permissionsData] = await Promise.all([
          usersApi.getAll(),
          permissionsApi.getAll()
        ]);
        setUsers(usersData);
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load selected user's permissions
  useEffect(() => {
    if (selectedUser) {
      const loadUserPermissions = async () => {
        try {
          setLoading(true);
          const userPerms = await usersApi.getUserPermissions(selectedUser);
          setUserPermissions(userPerms.map(p => p.permissionKey));
        } catch (error) {
          console.error('Failed to load user permissions:', error);
        } finally {
          setLoading(false);
        }
      };

      loadUserPermissions();
    } else {
      setUserPermissions([]);
    }
  }, [selectedUser]);

  // Toggle permission
  const togglePermission = (permissionKey: string) => {
    setUserPermissions(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  // Save permissions
  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await usersApi.assignPermissions(selectedUser, userPermissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
        <p className="mt-1 text-gray-500">
          Assign permissions to users to control their access to system features
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Select a user to manage permissions</CardDescription>
              
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search users..."
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto p-0">
              <div className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <button
                    key={user._id}
                    className={`
                      w-full px-6 py-3 text-left hover:bg-gray-50 focus:outline-none
                      ${selectedUser === user._id ? 'bg-indigo-50' : ''}
                    `}
                    onClick={() => setSelectedUser(user._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {user.isSuperAdmin && (
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>
                  {selectedUser ? 'Manage Permissions' : 'Select a User'}
                </CardTitle>
                <CardDescription>
                  {selectedUser
                    ? 'Assign permissions to control access to system features'
                    : 'Select a user from the list to manage their permissions'}
                </CardDescription>
              </div>
              {selectedUser && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => {
                      const user = users.find(u => u._id === selectedUser);
                      if (user) {
                        // Reload permissions
                        setSelectedUser(null);
                        setTimeout(() => setSelectedUser(user._id), 10);
                      }
                    }}
                  >
                    Reset
                  </Button>
                  <Button 
                    size="sm"
                    onClick={savePermissions}
                    isLoading={loading}
                    icon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {saveSuccess && (
                <div className="mb-4 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Permissions saved successfully
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedUser ? (
                <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-12">
                  <Info className="h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No user selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a user from the list to manage their permissions
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Super admin alert */}
                  {users.find(u => u._id === selectedUser)?.isSuperAdmin && (
                    <div className="rounded-md bg-amber-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">
                            Super Admin User
                          </h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <p>
                              This user has Super Admin privileges and has unrestricted access to all system features.
                              Individual permissions do not affect Super Admin users.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Permission matrix */}
                  <div className="space-y-6">
                    {Object.entries(permissionsByModel).map(([modelId, modelPermissions]) => {
                      // Find a model name - in production this would come from the API
                      const modelName = 
                        modelId === '1' ? 'Users' :
                        modelId === '2' ? 'Colleges' :
                        modelId === '3' ? 'Attachments' :
                        modelId === '4' ? 'Settings' :
                        modelId === '5' ? 'Dashboard' :
                        modelId === '6' ? 'Admin' : 'Unknown';

                      return (
                        <div key={modelId} className="rounded-md border border-gray-200">
                          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {modelName}
                            </h3>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {modelPermissions.map(permission => (
                              <div 
                                key={permission._id} 
                                className="flex items-center justify-between px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {permission.permissionKey}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className={`
                                    inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                    ${userPermissions.includes(permission.permissionKey) ? 'bg-indigo-600' : 'bg-gray-200'}
                                  `}
                                  role="switch"
                                  aria-checked={userPermissions.includes(permission.permissionKey)}
                                  onClick={() => togglePermission(permission.permissionKey)}
                                >
                                  <span
                                    className={`
                                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                      ${userPermissions.includes(permission.permissionKey) ? 'translate-x-5' : 'translate-x-0'}
                                    `}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;