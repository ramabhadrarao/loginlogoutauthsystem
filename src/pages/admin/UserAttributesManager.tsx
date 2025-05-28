// src/pages/admin/UserAttributesManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Users, Plus, Edit, Trash2, Save, X, Search, Filter, Calendar, AlertCircle, User } from 'lucide-react';
import { useABAC } from '../../hooks/useABAC';
import { usersApi } from '../../utils/api';
import { User as UserType } from '../../types';
import { UserAttribute, AttributeDefinition } from '../../types/abac';

const UserAttributesManager = () => {
  const { 
    attributes, 
    loading: abacLoading, 
    error: abacError,
    getUserAttributes,
    setUserAttribute,
    removeUserAttribute
  } = useABAC();

  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttribute[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    attributeName: '',
    attributeValue: '',
    validFrom: '',
    validUntil: ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load user attributes when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserAttributes(selectedUser._id);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await usersApi.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAttributes = async (userId: string) => {
    try {
      setLoading(true);
      const attrs = await getUserAttributes(userId);
      setUserAttributes(attrs);
    } catch (error) {
      console.error('Failed to load user attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
  };

  const handleAddAttribute = () => {
    setFormData({
      attributeName: '',
      attributeValue: '',
      validFrom: '',
      validUntil: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveAttribute = async () => {
    if (!selectedUser) return;
    
    if (!formData.attributeName) {
      alert('Please select an attribute');
      return;
    }

    if (!formData.attributeValue.trim()) {
      alert('Please enter a value');
      return;
    }

    try {
      setSaving(true);
      
      await setUserAttribute(
        selectedUser._id,
        formData.attributeName,
        formData.attributeValue,
        formData.validFrom ? new Date(formData.validFrom) : undefined,
        formData.validUntil ? new Date(formData.validUntil) : undefined
      );

      await loadUserAttributes(selectedUser._id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to set user attribute:', error);
      alert('Failed to set attribute: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAttribute = async (attributeName: string) => {
    if (!selectedUser) return;

    if (!window.confirm(`Remove attribute "${attributeName}" from user "${selectedUser.username}"?`)) {
      return;
    }

    try {
      await removeUserAttribute(selectedUser._id, attributeName);
      await loadUserAttributes(selectedUser._id);
    } catch (error) {
      console.error('Failed to remove user attribute:', error);
      alert('Failed to remove attribute: ' + (error as Error).message);
    }
  };

  const getAttributeDefinition = (attributeName: string): AttributeDefinition | undefined => {
    return attributes.find(attr => attr.name === attributeName);
  };

  const renderAttributeValue = (attr: UserAttribute) => {
    const definition = getAttributeDefinition(attr.attributeName);
    
    if (!definition) {
      return <span className="text-gray-600">{String(attr.attributeValue)}</span>;
    }

    if (definition.dataType === 'boolean') {
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          attr.attributeValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {attr.attributeValue ? 'True' : 'False'}
        </span>
      );
    }

    if (definition.dataType === 'date') {
      return <span className="text-gray-600">{new Date(attr.attributeValue).toLocaleDateString()}</span>;
    }

    if (definition.possibleValues) {
      const possibleValue = definition.possibleValues.find(pv => pv.value === attr.attributeValue);
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {possibleValue ? possibleValue.label : attr.attributeValue}
        </span>
      );
    }

    return <span className="text-gray-600">{String(attr.attributeValue)}</span>;
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (abacLoading || loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (abacError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading User Attributes</h3>
            <p className="mt-2 text-sm text-red-700">{abacError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Attribute Management</h2>
          <p className="text-sm text-gray-500">Assign attributes to users for access control policies</p>
        </div>
        {selectedUser && (
          <Button onClick={handleAddAttribute} icon={<Plus className="h-4 w-4" />}>
            Add Attribute
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>Select a user to manage their attributes</CardDescription>
              
              <div className="relative">
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
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <button
                      key={user._id}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none transition-colors
                        ${selectedUser?._id === user._id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''}
                      `}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            Admin
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No users found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Attributes */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Attributes for {selectedUser.username}
                    </CardTitle>
                    <CardDescription>
                      Manage dynamic attributes for this user
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {userAttributes.length} attributes assigned
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {userAttributes.length > 0 ? (
                  <div className="space-y-4">
                    {userAttributes.map((attr) => {
                      const definition = getAttributeDefinition(attr.attributeName);
                      return (
                        <div key={attr._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {definition ? definition.displayName : attr.attributeName}
                                </h4>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                                  {definition ? definition.category : 'unknown'}
                                </span>
                                {!attr.isActive && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              
                              <div className="mb-2">
                                <span className="text-sm text-gray-600 mr-2">Value:</span>
                                {renderAttributeValue(attr)}
                              </div>

                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>Set: {new Date(attr.validFrom).toLocaleDateString()}</span>
                                </div>
                                {attr.validUntil && (
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>Expires: {new Date(attr.validUntil).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {definition?.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {definition.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveAttribute(attr.attributeName)}
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Users className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attributes Assigned</h3>
                    <p className="text-gray-500 mb-4">
                      This user doesn't have any attributes assigned yet.
                    </p>
                    <Button onClick={handleAddAttribute} icon={<Plus className="h-4 w-4" />}>
                      Add First Attribute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
                <p className="text-gray-500">
                  Choose a user from the list to manage their attributes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Attribute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add Attribute to {selectedUser?.username}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attribute *
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formData.attributeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, attributeName: e.target.value }))}
                    >
                      <option value="">Select Attribute</option>
                      {attributes.filter(attr => attr.isActive && attr.category === 'user').map(attr => (
                        <option key={attr._id} value={attr.name}>
                          {attr.displayName} ({attr.dataType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value *
                    </label>
                    {(() => {
                      const selectedAttr = attributes.find(attr => attr.name === formData.attributeName);
                      
                      if (selectedAttr?.dataType === 'boolean') {
                        return (
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={formData.attributeValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, attributeValue: e.target.value }))}
                          >
                            <option value="">Select Value</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        );
                      }
                      
                      if (selectedAttr?.possibleValues && selectedAttr.possibleValues.length > 0) {
                        return (
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={formData.attributeValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, attributeValue: e.target.value }))}
                          >
                            <option value="">Select Value</option>
                            {selectedAttr.possibleValues.map(pv => (
                              <option key={pv.value} value={pv.value}>
                                {pv.label}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      
                      return (
                        <input
                          type={selectedAttr?.dataType === 'number' ? 'number' : 
                                selectedAttr?.dataType === 'date' ? 'date' : 'text'}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          value={formData.attributeValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, attributeValue: e.target.value }))}
                          placeholder="Enter value"
                        />
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid From
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.validUntil}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Show attribute description if available */}
                  {formData.attributeName && (() => {
                    const selectedAttr = attributes.find(attr => attr.name === formData.attributeName);
                    return selectedAttr?.description ? (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>About this attribute:</strong> {selectedAttr.description}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveAttribute} 
                  icon={<Save className="h-4 w-4" />}
                  isLoading={saving}
                >
                  Add Attribute
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserAttributesManager;