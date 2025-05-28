// src/pages/settings/SystemSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { useAuth } from '../../utils/auth';
import { settingsApi } from '../../utils/api';
import { SystemSetting } from '../../types';
import { Settings, Save, RefreshCw, Check, Shield, Mail, Globe, Clock } from 'lucide-react';

const SystemSettings = () => {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [activeGroup, setActiveGroup] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const canUpdateSettings = hasPermission('settings.update');

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

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
      
      // Set first available group as active
      if (data.length > 0) {
        const groups = [...new Set(data.map(s => s.settingGroup))];
        setActiveGroup(groups[0] || 'general');
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
      const activeGroupSettings = groupedSettings[activeGroup] || [];
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
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  // Get the appropriate icon for each setting group
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'general':
        return <Settings className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-gray-500">Configure global settings for the application</p>
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
                  {[...Array(3)].map((_, i) => (
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
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="mt-1 text-gray-500">Configure global settings for the application</p>
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
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure global settings for the application
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Settings saved successfully
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Setting Groups Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Configure settings by category
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav>
                {Object.keys(groupedSettings).map(group => (
                  <button
                    key={group}
                    className={`
                      flex w-full items-center space-x-3 px-6 py-3 text-left text-sm font-medium hover:bg-gray-50
                      ${activeGroup === group ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}
                    `}
                    onClick={() => setActiveGroup(group)}
                  >
                    <div className={`
                      rounded-md p-1.5
                      ${activeGroup === group ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}
                    `}>
                      {getGroupIcon(group)}
                    </div>
                    <span className="capitalize">{group}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {groupedSettings[group]?.length || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                {getGroupIcon(activeGroup)}
                <div>
                  <CardTitle className="capitalize">{activeGroup} Settings</CardTitle>
                  <CardDescription>
                    Configure {activeGroup} settings for the system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {groupedSettings[activeGroup]?.length > 0 ? (
                <div className="space-y-6">
                  {groupedSettings[activeGroup].map(setting => (
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
                    No settings available for the {activeGroup} category.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50">
              <div className="text-xs text-gray-500">
                Last updated: {
                  groupedSettings[activeGroup]?.length > 0 
                    ? new Date(Math.max(...groupedSettings[activeGroup].map(s => new Date(s.dateUpdated).getTime()))).toLocaleDateString()
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
                  disabled={!canUpdateSettings || groupedSettings[activeGroup]?.length === 0}
                >
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;