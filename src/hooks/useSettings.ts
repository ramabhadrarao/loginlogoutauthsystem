// src/hooks/useSettings.ts
import { useState, useEffect } from 'react';
import { settingsApi } from '../utils/api';
import { SystemSetting } from '../types';

interface UseSettingsReturn {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
  getSetting: (key: string, defaultValue?: string) => string;
  refreshSettings: () => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all settings
      const data = await settingsApi.getAll();
      
      // Convert to key-value pairs for easy access
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {} as Record<string, string>);
      
      setSettings(settingsMap);
      
      console.log('Settings loaded:', settingsMap); // Debug log
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getSetting = (key: string, defaultValue: string = '') => {
    const value = settings[key] || defaultValue;
    console.log(`Getting setting ${key}:`, value); // Debug log
    return value;
  };

  const refreshSettings = async () => {
    console.log('Refreshing settings...'); // Debug log
    await loadSettings();
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    refreshSettings
  };
};