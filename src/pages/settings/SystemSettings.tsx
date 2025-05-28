// src/pages/settings/SystemSettings.tsx - Complete version with Change Password
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { useAuth } from '../../utils/auth';
import { useSettings } from '../../hooks/useSettings';
import { settingsApi, authApi } from '../../utils/api';
import { SystemSetting } from '../../types';
import { 
  Settings, Save, RefreshCw, Check, Shield, Mail, Globe, Clock, Lock, Key, User, 
  AlertCircle, Eye, EyeOff, CheckCircle, XCircle 
} from 'lucide-react';

const SystemSettings = () => {
  const { hasPermission, user } = useAuth();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile update states
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const canUpdateSettings = hasPermission('settings.update');

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getAll();
      setSettings(data);
      
      // Initialize form values
      const initialValues = data.reduce((acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {} as Record<string, string>);
      setFormValues(initialValues);
      
      // Set first available group as active if not set
      if (data.length > 0 && activeTab === 'general') {
        const groups = [...new Set(data.map(s => s.settingGroup))];
        if (groups.length > 0 && !groups.includes('general')) {
          setActiveTab(groups[0] || 'general');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group settings by their group
  const groupedSettings = settings.reduce((acc, setting) => {
    const group = setting.settingGroup || 'general';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  const handleInputChange = (settingKey: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };

  const handleSave = async () => {
    if (!canUpdateSettings) return;
    
    setSaving(true);
    
    try {
      // Get only the settings for the active group
      const activeGroupSettings = groupedSettings[activeTab] || [];
      const settingsToUpdate = activeGroupSettings.map(setting => ({
        settingKey: setting.settingKey,
        settingValue: formValues[setting.settingKey],
        settingGroup: setting.settingGroup,
        description: setting.description,
        isPublic: setting.isPublic
      }));

      await settingsApi.bulkUpdate(settingsToUpdate);
      
      // Update local state
      setSettings(prevSettings => 
        prevSettings.map(setting => ({
          ...setting,
          settingValue: formValues[setting.settingKey] || setting.settingValue,
          dateUpdated: new Date().toISOString()
        }))
      );
      
      // Refresh the settings cache in useSettings hook
      if (refreshSettings) {
        await refreshSettings();
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // If we updated site.name or site.description, force a page refresh to update title
      const updatedKeys = settingsToUpdate.map(s => s.settingKey);
      if (updatedKeys.includes('site.name') || updatedKeys.includes('site.description')) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const originalValues = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue;
      return acc;
    }, {} as Record<string, string>);
    setFormValues(originalValues);
  };

  // Password change handlers
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    
    setPasswordLoading(true);
    
    try {
      await authApi.changePassword(passwordData);
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 5000);
      
    } catch (err: any) {
      setPasswordErrors({ 
        currentPassword: err.message || 'Failed to change password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Profile update handlers
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    
    if (!profileData.username.trim()) {
      errors.username = 'Username is required';
    } else if (profileData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Invalid email format';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;
    
    setProfileLoading(true);
    
    try {
      await authApi.updateProfile({
        username: profileData.username.trim(),
        email: profileData.email.trim()
      });
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 5000);
      
      // Refresh the page to update user data in auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err: any) {
      setProfileErrors({ 
        email: err.message || 'Failed to update profile' 
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Get the appropriate icon for each setting group
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'general':
        return <Settings className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
      case 'upload':
        return <Settings className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // Get the appropriate icon for each setting
  const getSettingIcon = (key: string) => {
    if (key.includes('email')) return <Mail className="h-4 w-4 text-gray-400" />;
    if (key.includes('site')) return <Globe className="h-4 w-4 text-gray-400" />;
    if (key.includes('timeout') || key.includes('expiry')) return <Clock className="h-4 w-4 text-gray-400" />;
    if (key.includes('security')) return <Shield className="h-4 w-4 text-gray-400" />;
    return null;
  };

  const tabs = [
    ...Object.keys(groupedSettings).map(group => ({
      id: group,
      name: group.charAt(0).toUpperCase() + group.slice(1),
      icon: getGroupIcon(group),
      count: groupedSettings[group]?.length || 0,
      requiresPermission: 'settings.update'
    })),
    {
      id: 'profile',
      name: 'Profile',
      icon: <User className="h-5 w-5" />,
      count: null,
      requiresPermission: null
    },
    {
      id: 'password',
      name: 'Password',
      icon: <Key className="h-5 w-5" />,
      count: null,
      requiresPermission: null
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-gray-500">Configure system settings and your account</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-6 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-500">Configure system settings and your account</p>
          </div>
          <Button 
            onClick={loadSettings}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <Settings className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Settings</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadSettings} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure system settings and manage your account
        </p>
      </div>

      {(saveSuccess || passwordSuccess || profileSuccess) && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {saveSuccess && 'Settings saved successfully!'}
                {passwordSuccess && 'Password changed successfully!'}
                {profileSuccess && 'Profile updated successfully!'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Manage system and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav>
                {tabs.map(tab => {
                  // Check permissions for system settings tabs
                  if (tab.requiresPermission && !hasPermission(tab.requiresPermission)) {
                    return null;
                  }
                  
                  return (
                    <button
                      key={tab.id}
                      className={`
                        flex w-full items-center justify-between px-6 py-3 text-left text-sm font-medium hover:bg-gray-50
                        ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600' : 'text-gray-700'}
                      `}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          rounded-md p-1.5
                          ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}
                        `}>
                          {tab.icon}
                        </div>
                        <span>{tab.name}</span>
                      </div>
                      {tab.count !== null && (
                        <span className="text-xs text-gray-400">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* System Settings Tabs */}
          {Object.keys(groupedSettings).includes(activeTab) && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {getGroupIcon(activeTab)}
                  <div>
                    <CardTitle className="capitalize">{activeTab} Settings</CardTitle>
                    <CardDescription>
                      Configure {activeTab} settings for the system
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {groupedSettings[activeTab]?.length > 0 ? (
                  <div className="space-y-6">
                    {groupedSettings[activeTab].map(setting => (
                      <FormField
                        key={setting._id}
                        id={setting.settingKey}
                        label={setting.settingKey.split('.').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' ')}
                        description={setting.description}
                      >
                        <div className="relative">
                          {getSettingIcon(setting.settingKey) && (
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              {getSettingIcon(setting.settingKey)}
                            </div>
                          )}
                          <Input
                            id={setting.settingKey}
                            value={formValues[setting.settingKey] || ''}
                            onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
                            disabled={!canUpdateSettings}
                            className={getSettingIcon(setting.settingKey) ? 'pl-10' : ''}
                            placeholder={setting.settingValue}
                          />
                        </div>
                      </FormField>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No Settings Found</h3>
                    <p className="text-sm text-gray-500">
                      No settings available for the {activeTab} category.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-gray-50">
                <div className="text-xs text-gray-500">
                  Last updated: {
                    groupedSettings[activeTab]?.length > 0 
                      ? new Date(Math.max(...groupedSettings[activeTab].map(s => new Date(s.dateUpdated).getTime()))).toLocaleDateString()
                      : 'Never'
                  }
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={handleReset}
                    disabled={!canUpdateSettings}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    icon={<Save className="h-4 w-4" />}
                    onClick={handleSave}
                    isLoading={saving}
                    disabled={!canUpdateSettings || groupedSettings[activeTab]?.length === 0}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Update your account information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <FormField
                    id="username"
                    label="Username"
                    error={profileErrors.username}
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                        className="pl-10"
                        placeholder="Enter your username"
                      />
                    </div>
                  </FormField>

                  <FormField
                    id="email"
                    label="Email Address"
                    error={profileErrors.email}
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="pl-10"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </FormField>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50">
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateProfile}
                    isLoading={profileLoading}
                    icon={<Save className="h-4 w-4" />}
                  >
                    Update Profile
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Key className="h-5 w-5" />
                  <div>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your account password for security
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <FormField
                    id="currentPassword"
                    label="Current Password"
                    error={passwordErrors.currentPassword}
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <FormField
                    id="newPassword"
                    label="New Password"
                    error={passwordErrors.newPassword}
                    description="Password must be at least 6 characters long"
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Key className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <FormField
                    id="confirmPassword"
                    label="Confirm New Password"
                    error={passwordErrors.confirmPassword}
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Check className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  {/* Password strength indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Password Strength:</div>
                      <div className="space-y-1">
                        <div className={`text-xs flex items-center gap-2 ${
                          passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {passwordData.newPassword.length >= 6 ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          At least 6 characters
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${
                          /[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {/[A-Z]/.test(passwordData.newPassword) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Contains uppercase letter
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${
                          /[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {/[0-9]/.test(passwordData.newPassword) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Contains number
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Make sure to use a strong, unique password</span>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    isLoading={passwordLoading}
                    icon={<Key className="h-4 w-4" />}
                  >
                    Change Password
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;