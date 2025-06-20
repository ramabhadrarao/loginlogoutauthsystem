// src/pages/Dashboard.tsx - Updated with academic quick actions
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import { 
  Users, Building, Building2, File, Settings, ArrowUpRight, Shield, Lock, Database, History, 
  Plus, Eye, RefreshCw, Calendar, GraduationCap, GitBranch, BookOpen, UserPlus 
} from 'lucide-react';
import { useAuth } from '../utils/auth';
import { usersApi, collegesApi, attachmentsApi, settingsApi } from '../utils/api';
import { departmentsApi } from '../utils/api';
import { academicYearsApi, programsApi, branchesApi, regulationsApi, batchesApi, semestersApi } from '../utils/academicApi';

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
  color: 'indigo' | 'purple' | 'green' | 'blue' | 'yellow' | 'teal' | 'orange' | 'red';
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
    yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border-yellow-200',
    teal: 'bg-teal-100 text-teal-600 hover:bg-teal-200 border-teal-200',
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200',
    red: 'bg-red-100 text-red-600 hover:bg-red-200 border-red-200'
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
  const { getSetting } = useSettings();
  
  // Get dynamic settings
  const siteName = getSetting('site.name', 'Permission System');
  const siteDescription = getSetting('site.description', 'Multi-user authentication and permission system');
  
  // State for real data
  const [stats, setStats] = useState({
    users: 0,
    colleges: 0,
    departments: 0,
    attachments: 0,
    settings: 0,
    academicYears: 0,
    programs: 0,
    branches: 0,
    regulations: 0,
    batches: 0,
    semesters: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get permissions for different models
  const userPerms = getEffectivePermissions('users');
  const collegePerms = getEffectivePermissions('colleges');
  const departmentPerms = getEffectivePermissions('departments');
  const attachmentPerms = getEffectivePermissions('attachments');
  const settingsPerms = getEffectivePermissions('settings');
  
  // Academic permissions
  const academicYearsPerms = getEffectivePermissions('academic_years');
  const programsPerms = getEffectivePermissions('programs');
  const branchesPerms = getEffectivePermissions('branches');
  const regulationsPerms = getEffectivePermissions('regulations');
  const batchesPerms = getEffectivePermissions('batches');
  const semestersPerms = getEffectivePermissions('semesters');

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
        
        if (departmentPerms.canRead) {
          promises.push(
            departmentsApi.getAll().then(data => { results.departments = data.length; }).catch(() => { results.departments = 0; })
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

        // Academic stats
        if (academicYearsPerms.canRead) {
          promises.push(
            academicYearsApi.getAll().then(data => { results.academicYears = data.length; }).catch(() => { results.academicYears = 0; })
          );
        }

        if (programsPerms.canRead) {
          promises.push(
            programsApi.getAll().then(data => { results.programs = data.length; }).catch(() => { results.programs = 0; })
          );
        }

        if (branchesPerms.canRead) {
          promises.push(
            branchesApi.getAll().then(data => { results.branches = data.length; }).catch(() => { results.branches = 0; })
          );
        }

        if (regulationsPerms.canRead) {
          promises.push(
            regulationsApi.getAll().then(data => { results.regulations = data.length; }).catch(() => { results.regulations = 0; })
          );
        }

        if (batchesPerms.canRead) {
          promises.push(
            batchesApi.getAll().then(data => { results.batches = data.length; }).catch(() => { results.batches = 0; })
          );
        }

        if (semestersPerms.canRead) {
          promises.push(
            semestersApi.getAll().then(data => { results.semesters = data.length; }).catch(() => { results.semesters = 0; })
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
  }, [userPerms.canRead, collegePerms.canRead, departmentPerms.canRead, attachmentPerms.canRead, settingsPerms.canRead, academicYearsPerms.canRead, programsPerms.canRead, branchesPerms.canRead, regulationsPerms.canRead, batchesPerms.canRead, semestersPerms.canRead]);

  const refreshStats = () => {
    setLoading(true);
    // Trigger useEffect to reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Update document title dynamically
  useEffect(() => {
    document.title = `Dashboard - ${siteName}`;
  }, [siteName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Welcome back, {user?.username}! {user?.isSuperAdmin && '👑'}
          </p>
          <p className="mt-1 text-sm text-gray-400">{siteDescription}</p>
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

      {/* Main Stats Grid */}
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

        {departmentPerms.canRead && (
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={<Building2 className="h-6 w-6" />}
            description="Academic departments"
            linkTo="/departments"
            permissions={departmentPerms}
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
      </div>

      {/* Academic Stats Grid */}
      {(academicYearsPerms.canRead || programsPerms.canRead || branchesPerms.canRead || regulationsPerms.canRead || batchesPerms.canRead || semestersPerms.canRead) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {academicYearsPerms.canRead && (
              <StatCard
                title="Academic Years"
                value={stats.academicYears}
                icon={<Calendar className="h-6 w-6" />}
                description="Academic calendar years"
                linkTo="/academic/years"
                permissions={academicYearsPerms}
                loading={loading}
              />
            )}

            {programsPerms.canRead && (
              <StatCard
                title="Programs"
                value={stats.programs}
                icon={<GraduationCap className="h-6 w-6" />}
                description="Degree programs"
                linkTo="/academic/programs"
                permissions={programsPerms}
                loading={loading}
              />
            )}

            {branchesPerms.canRead && (
              <StatCard
                title="Branches"
                value={stats.branches}
                icon={<GitBranch className="h-6 w-6" />}
                description="Program specializations"
                linkTo="/academic/branches"
                permissions={branchesPerms}
                loading={loading}
              />
            )}

            {regulationsPerms.canRead && (
              <StatCard
                title="Regulations"
                value={stats.regulations}
                icon={<BookOpen className="h-6 w-6" />}
                description="Academic regulations"
                linkTo="/academic/regulations"
                permissions={regulationsPerms}
                loading={loading}
              />
            )}

            {batchesPerms.canRead && (
              <StatCard
                title="Batches"
                value={stats.batches}
                icon={<UserPlus className="h-6 w-6" />}
                description="Student batches"
                linkTo="/academic/batches"
                permissions={batchesPerms}
                loading={loading}
              />
            )}

            {semestersPerms.canRead && (
              <StatCard
                title="Semesters"
                value={stats.semesters}
                icon={<Calendar className="h-6 w-6" />}
                description="Academic semesters"
                linkTo="/academic/semesters"
                permissions={semestersPerms}
                loading={loading}
              />
            )}
          </div>
        </div>
      )}

      {/* Settings Card */}
      {settingsPerms.canRead && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Settings"
            value={stats.settings}
            icon={<Settings className="h-6 w-6" />}
            description="Configurations"
            linkTo="/settings"
            permissions={settingsPerms}
            loading={loading}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Admin Actions */}
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
            title="ABAC Management"
            description="Dynamic access control"
            icon={<Shield className="h-5 w-5" />}
            to="/admin/abac"
            requiredPermission="abac.manage"
            color="purple"
          />
          
          {/* Institution Actions */}
          <QuickAction
            title="Add College"
            description="Register new institution"
            icon={<Building className="h-5 w-5" />}
            to="/colleges"
            requiredPermission="colleges.create"
            color="green"
          />
          
          <QuickAction
            title="Add Department"
            description="Create new department"
            icon={<Building2 className="h-5 w-5" />}
            to="/departments"
            requiredPermission="departments.create"
            color="teal"
          />

          {/* Academic Actions */}
          <QuickAction
            title="Academic Years"
            description="Manage academic calendar"
            icon={<Calendar className="h-5 w-5" />}
            to="/academic/years"
            requiredPermission="academic_years.create"
            color="blue"
          />

          <QuickAction
            title="Create Program"
            description="Add degree program"
            icon={<GraduationCap className="h-5 w-5" />}
            to="/academic/programs"
            requiredPermission="programs.create"
            color="indigo"
          />

          <QuickAction
            title="Add Branch"
            description="Create specialization"
            icon={<GitBranch className="h-5 w-5" />}
            to="/academic/branches"
            requiredPermission="branches.create"
            color="green"
          />

          <QuickAction
            title="Create Regulation"
            description="Add academic regulation"
            icon={<BookOpen className="h-5 w-5" />}
            to="/academic/regulations"
            requiredPermission="regulations.create"
            color="orange"
          />

          <QuickAction
            title="Add Batch"
            description="Create student batch"
            icon={<UserPlus className="h-5 w-5" />}
            to="/academic/batches"
            requiredPermission="batches.create"
            color="teal"
          />

          <QuickAction
            title="Add Semester"
            description="Create academic semester"
            icon={<Calendar className="h-5 w-5" />}
            to="/academic/semesters"
            requiredPermission="semesters.create"
            color="purple"
          />
          
          {/* System Actions */}
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
            color="red"
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

              {departmentPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <Building2 className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Departments</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      departmentPerms.canRead && 'Read',
                      departmentPerms.canCreate && 'Create',
                      departmentPerms.canUpdate && 'Update',
                      departmentPerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {academicYearsPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <Calendar className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Academic Years</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      academicYearsPerms.canRead && 'Read',
                      academicYearsPerms.canCreate && 'Create',
                      academicYearsPerms.canUpdate && 'Update',
                      academicYearsPerms.canDelete && 'Delete'
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {programsPerms.canRead && (
                <div className="text-center p-4 rounded-lg border border-gray-200">
                  <GraduationCap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Programs</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      programsPerms.canRead && 'Read',
                      programsPerms.canCreate && 'Create',
                      programsPerms.canUpdate && 'Update',
                      programsPerms.canDelete && 'Delete'
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