// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Building, File, Settings, ArrowUpRight, Shield, Lock, Database, History, Plus, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../utils/auth';
import { usersApi, collegesApi, attachmentsApi, settingsApi } from '../utils/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  linkTo?: string;
  permissions: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  loading?: boolean;
}

const StatCard = ({ title, value, icon, description, change, trend, linkTo, permissions, loading }: StatCardProps) => {
  const CardWrapper = linkTo ? Link : 'div';
  const cardProps = linkTo ? { to: linkTo, className: "block group" } : { className: "block" };

  return (
    <CardWrapper {...cardProps}>
      <Card className={`h-full transition-all duration-200 ${linkTo ? 'hover:shadow-lg hover:border-indigo-300 group-hover:scale-[1.02]' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {linkTo && <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />}
              </div>
              
              {loading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">{value}</h3>
                  {description && (
                    <p className="text-sm text-gray-500 mb-2">{description}</p>
                  )}
                </>
              )}
              
              {/* Permission indicators */}
              <div className="flex items-center gap-1 mb-2">
                {permissions.canRead && (
                  <span className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    <Eye className="h-3 w-3 mr-1" />R
                  </span>
                )}
                {permissions.canCreate && (
                  <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    <Plus className="h-3 w-3 mr-1" />C
                  </span>
                )}
                {permissions.canUpdate && (
                  <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                    U
                  </span>
                )}
                {permissions.canDelete && (
                  <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    D
                  </span>
                )}
              </div>

              {change && !loading && (
                <div className="flex items-center">
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
            <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 ml-4">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  requiredPermission: string;
  color: 'indigo' | 'purple' | 'green' | 'blue' | 'yellow';
}

const QuickAction = ({ title, description, icon, to, requiredPermission, color }: QuickActionProps) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(requiredPermission)) {
    return null;
  }

  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border-indigo-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200 border-purple-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200 border-green-200',
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border-yellow-200'
  };

  return (
    <Link to={to} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md border-2 border-transparent hover:border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 transition-colors ${colorClasses[color]}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {title}
              </h4>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const Dashboard = () => {
  const { user, getEffectivePermissions } = useAuth();
  
  // State for real data
  const [stats, setStats] = useState({
    users: 0,
    colleges: 0,
    attachments: 0,
    settings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get permissions for different models
  const userPerms = getEffectivePermissions('users');
  const collegePerms = getEffectivePermissions('colleges');
  const attachmentPerms = getEffectivePermissions('attachments');
  const settingsPerms = getEffectivePermissions('settings');

  // Load real statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = [];
        const results: { [key: string]: number } = {};

        // Only fetch data for resources user can access
        if (userPerms.canRead) {
          promises.push(
            usersApi.getAll().then(data => { results.users = data.length; }).catch(() => { results.users = 0; })
          );
        }
        
        if (collegePerms.canRead) {
          promises.push(
            collegesApi.getAll().then(data => { results.colleges = data.length; }).catch(() => { results.colleges = 0; })
          );
        }
        
        if (attachmentPerms.canRead) {
          promises.push(
            attachmentsApi.getAll().then(data => { results.attachments = data.length; }).catch(() => { results.attachments = 0; })
          );
        }
        
        if (settingsPerms.canRead) {
          promises.push(
            settingsApi.getAll().then(data => { results.settings = data.length; }).catch(() => { results.settings = 0; })
          );
        }

        await Promise.all(promises);
        setStats(results);
      } catch (err: any) {
        setError(err.message || 'Failed to load statistics');
        console.error('Load stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userPerms.canRead, collegePerms.canRead, attachmentPerms.canRead, settingsPerms.canRead]);

  const refreshStats = () => {
    setLoading(true);
    // Trigger useEffect to reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Welcome back, {user?.username}! {user?.isSuperAdmin && '👑'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshStats}
          icon={<RefreshCw className="h-4 w-4" />}
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* User Status */}
      {user?.isSuperAdmin && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-purple-900">Super Administrator</h3>
                <p className="text-sm text-purple-700">
                  You have unrestricted access to all system features and functions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-900">Error Loading Statistics</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Only show cards for resources user has access to */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {userPerms.canRead && (
          <StatCard
            title="Users"
            value={stats.users}
            icon={<Users className="h-6 w-6" />}
            description="System users"
            linkTo="/users"
            permissions={userPerms}
            loading={loading}
          />
        )}
        
        {collegePerms.canRead && (
          <StatCard
            title="Colleges"
            value={stats.colleges}
            icon={<Building className="h-6 w-6" />}
            description="Institutions"
            linkTo="/colleges"
            permissions={collegePerms}
            loading={loading}
          />
        )}
        
        {attachmentPerms.canRead && (
          <StatCard
            title="Files"
            value={stats.attachments}
            icon={<File className="h-6 w-6" />}
            description="Attachments"
            linkTo="/attachments"
            permissions={attachmentPerms}
            loading={loading}
          />
        )}
        
        {settingsPerms.canRead && (
          <StatCard
            title="Settings"
            value={stats.settings}
            icon={<Settings className="h-6 w-6" />}
            description="Configurations"
            linkTo="/settings"
            permissions={settingsPerms}
            loading={loading}
          />
        )}
      </div>

      {/* Show message if no stats are available */}
      {!userPerms.canRead && !collegePerms.canRead && !attachmentPerms.canRead && !settingsPerms.canRead && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
            <p className="text-gray-500">
              You need read permissions for at least one resource to view dashboard statistics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Manage Permissions"
            description="Assign user permissions"
            icon={<Lock className="h-5 w-5" />}
            to="/admin/permissions"
            requiredPermission="permissions.manage"
            color="purple"
          />
          
          <QuickAction
            title="Create Models"
            description="Add new data models"
            icon={<Database className="h-5 w-5" />}
            to="/admin/models"
            requiredPermission="models.manage"
            color="indigo"
          />
          
          <QuickAction
            title="View Audit Log"
            description="Check system activity"
            icon={<History className="h-5 w-5" />}
            to="/admin/audit-log"
            requiredPermission="audit.read"
            color="blue"
          />
          
          <QuickAction
            title="Add College"
            description="Register new institution"
            icon={<Building className="h-5 w-5" />}
            to="/colleges"
            requiredPermission="colleges.create"
            color="green"
          />
          
          <QuickAction
            title="Upload Files"
            description="Add new attachments"
            icon={<File className="h-5 w-5" />}
            to="/attachments"
            requiredPermission="attachments.create"
            color="yellow"
          />
          
          <QuickAction
            title="System Settings"
            description="Configure system"
            icon={<Settings className="h-5 w-5" />}
            to="/settings"
            requiredPermission="settings.update"
            color="indigo"
          />
        </div>
      </div>

      {/* Your Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Your Access Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.isSuperAdmin ? (
            <div className="text-center py-6">
              <div className="rounded-full bg-purple-100 p-4 w-16 h-16 mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Super Administrator</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You have unrestricted access to all system features, including user management, 
                system settings, and administrative functions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {userPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Users</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      userPerms.canRead && 'Read',
                      userPerms.canCreate && 'Create', 
                      userPerms.canUpdate && 'Update',
                      userPerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {collegePerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <Building className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Colleges</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      collegePerms.canRead && 'Read',
                      collegePerms.canCreate && 'Create',
                      collegePerms.canUpdate && 'Update', 
                      collegePerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {attachmentPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <File className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Files</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      attachmentPerms.canRead && 'Read',
                      attachmentPerms.canCreate && 'Create',
                      attachmentPerms.canUpdate && 'Update',
                      attachmentPerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {settingsPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <Settings className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Settings</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      settingsPerms.canRead && 'Read',
                      settingsPerms.canCreate && 'Create',
                      settingsPerms.canUpdate && 'Update',
                      settingsPerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;