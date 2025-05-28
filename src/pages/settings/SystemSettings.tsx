import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import { useAuth } from '../../utils/auth';
import { Settings, Save, RefreshCw, Check, Shield, Mail, Globe, Clock } from 'lucide-react';

// Sample settings data
const settingsData = [
  {
    _id: '1',
    settingKey: 'site.name',
    settingValue: 'Permission System',
    settingGroup: 'general',
    isPublic: true,
    description: 'The name of the site',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    settingKey: 'site.description',
    settingValue: 'Multi-user authentication and permission system',
    settingGroup: 'general',
    isPublic: true,
    description: 'The description of the site',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  },
  {
    _id: '3',
    settingKey: 'email.from_address',
    settingValue: 'noreply@example.com',
    settingGroup: 'email',
    isPublic: false,
    description: 'The email address that system emails are sent from',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  },
  {
    _id: '4',
    settingKey: 'email.smtp_host',
    settingValue: 'smtp.example.com',
    settingGroup: 'email',
    isPublic: false,
    description: 'SMTP server hostname',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  },
  {
    _id: '5',
    settingKey: 'security.password_expiry_days',
    settingValue: '90',
    settingGroup: 'security',
    isPublic: false,
    description: 'Number of days before passwords expire',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  },
  {
    _id: '6',
    settingKey: 'security.session_timeout_minutes',
    settingValue: '30',
    settingGroup: 'security',
    isPublic: false,
    description: 'Number of minutes before user sessions timeout',
    dateCreated: '2023-01-01T00:00:00.000Z',
    dateUpdated: '2023-01-01T00:00:00.000Z'
  }
];

// Group settings by their group
const groupedSettings = settingsData.reduce((acc, setting) => {
  const group = setting.settingGroup;
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(setting);
  return acc;
}, {} as Record<string, typeof settingsData>);

const SystemSettings = () => {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(settingsData);
  const [activeGroup, setActiveGroup] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(
    settingsData.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue;
      return acc;
    }, {} as Record<string, string>)
  );

  const canUpdateSettings = hasPermission('settings.update');

  const handleInputChange = (settingKey: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };

  const handleSave = async () => {
    if (!canUpdateSettings) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update settings
    const updatedSettings = settings.map(setting => ({
      ...setting,
      settingValue: formValues[setting.settingKey],
      dateUpdated: new Date().toISOString()
    }));
    
    setSettings(updatedSettings);
    setIsLoading(false);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
              <div className="space-y-6">
                {groupedSettings[activeGroup]?.map(setting => {
                  // Get the appropriate icon for each setting
                  const getSettingIcon = (key: string) => {
                    if (key.includes('email')) return <Mail className="h-4 w-4 text-gray-400" />;
                    if (key.includes('site')) return <Globe className="h-4 w-4 text-gray-400" />;
                    if (key.includes('timeout') || key.includes('expiry')) return <Clock className="h-4 w-4 text-gray-400" />;
                    if (key.includes('security')) return <Shield className="h-4 w-4 text-gray-400" />;
                    return null;
                  };

                  return (
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
                          value={formValues[setting.settingKey]}
                          onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
                          disabled={!canUpdateSettings}
                          className={getSettingIcon(setting.settingKey) ? 'pl-10' : ''}
                        />
                      </div>
                    </FormField>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50">
              <div className="text-xs text-gray-500">
                Last updated: {new Date(settings.find(s => s.settingGroup === activeGroup)?.dateUpdated || '').toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => {
                    // Reset form values to original settings
                    const originalValues = settingsData.reduce((acc, setting) => {
                      acc[setting.settingKey] = setting.settingValue;
                      return acc;
                    }, {} as Record<string, string>);
                    setFormValues(originalValues);
                  }}
                  disabled={!canUpdateSettings}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  isLoading={isLoading}
                  disabled={!canUpdateSettings}
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