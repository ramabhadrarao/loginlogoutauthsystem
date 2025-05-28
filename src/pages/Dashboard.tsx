import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Building, File, Settings, ArrowUpRight, Shield } from 'lucide-react';
import { useAuth } from '../utils/auth';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard = ({ title, value, icon, description, change, trend }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{value}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            {change && (
              <div className="mt-2 flex items-center">
                <span 
                  className={`
                    inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                    ${trend === 'up' ? 'bg-green-100 text-green-800' : 
                      trend === 'down' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}
                  `}
                >
                  {trend === 'up' && <ArrowUpRight className="mr-1 h-3 w-3" />}
                  {trend === 'down' && <ArrowUpRight className="mr-1 h-3 w-3 rotate-180" />}
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back, {user?.username}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="42"
          icon={<Users className="h-6 w-6" />}
          description="Active accounts"
          change="+5% (30d)"
          trend="up"
        />
        <StatCard
          title="Colleges"
          value="8"
          icon={<Building className="h-6 w-6" />}
          description="Registered institutions"
        />
        <StatCard
          title="Files"
          value="156"
          icon={<File className="h-6 w-6" />}
          description="Total attachments"
          change="+12% (30d)"
          trend="up"
        />
        <StatCard
          title="Settings"
          value="24"
          icon={<Settings className="h-6 w-6" />}
          description="System configurations"
        />
      </div>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Your Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user?.isSuperAdmin ? (
              <p className="col-span-full text-sm font-medium text-gray-700">
                You have <span className="font-bold text-indigo-600">Super Admin</span> status with unrestricted access to all system features.
              </p>
            ) : (
              <>
                <div className="rounded-md border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900">User Management</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Create:</span> 
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Read:</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Update:</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Delete:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900">College Management</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Create:</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Read:</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Update:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Delete:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900">System Settings</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Create:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Read:</span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Granted</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Update:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="inline-block w-16 font-medium">Delete:</span>
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Denied</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;