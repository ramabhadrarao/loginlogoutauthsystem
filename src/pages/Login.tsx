// src/pages/Login.tsx - Fixed version with proper public settings loading
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { Shield, Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Add states for dynamic settings
  const [siteName, setSiteName] = useState('Permission System');
  const [siteDescription, setSiteDescription] = useState('Multi-user authentication and permission system');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load public settings
  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        setLoadingSettings(true);
        
        console.log('Loading public settings...');
        
        // Try to get public settings directly from the public endpoint
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const publicResponse = await fetch(`${API_URL}/settings/public/all`);
        
        if (publicResponse.ok) {
          const publicSettings = await publicResponse.json();
          console.log('Public settings loaded:', publicSettings);
          
          const nameSetting = publicSettings.find((s: any) => s.settingKey === 'site.name');
          const descSetting = publicSettings.find((s: any) => s.settingKey === 'site.description');
          
          if (nameSetting) {
            console.log('Found site name:', nameSetting.settingValue);
            setSiteName(nameSetting.settingValue);
          }
          if (descSetting) {
            console.log('Found site description:', descSetting.settingValue);
            setSiteDescription(descSetting.settingValue);
          }
        } else {
          console.warn('Public settings endpoint not available, trying alternative method');
          
          // Alternative: Try to get general settings (might need to make them public)
          try {
            const generalResponse = await fetch(`${API_URL}/settings?group=general`);
            if (generalResponse.ok) {
              const generalSettings = await generalResponse.json();
              const nameSetting = generalSettings.find((s: any) => s.settingKey === 'site.name');
              const descSetting = generalSettings.find((s: any) => s.settingKey === 'site.description');
              
              if (nameSetting) setSiteName(nameSetting.settingValue);
              if (descSetting) setSiteDescription(descSetting.settingValue);
            }
          } catch (altError) {
            console.log('Alternative method also failed, using defaults');
          }
        }
      } catch (error) {
        console.log('Could not load public settings, using defaults:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadPublicSettings();
  }, []);

  // Update document title dynamically
  useEffect(() => {
    document.title = `Login - ${siteName}`;
  }, [siteName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 animate-pulse">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto"></div>
          </div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{siteName}</h1>
          <p className="mt-2 text-gray-600">{siteDescription}</p>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-400">
              <p>Site Name: {siteName}</p>
              <p>Site Description: {siteDescription}</p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                />

                <Input
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  Demo Credentials: <br />
                  Email: <span className="font-medium">admin@example.com</span> <br />
                  Password: <span className="font-medium">password123</span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;