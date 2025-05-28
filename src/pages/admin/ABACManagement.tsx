// src/pages/admin/ABACManagement.tsx
import React, { useState } from 'react';
import { Shield, Settings, Users, Eye, TestTube, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import PolicyRulesManager from './PolicyRulesManager';
import AttributeManager from './AttributeManager';
import UserAttributesManager from './UserAttributesManager';
import PolicyAuditViewer from './PolicyAuditViewer';
import PolicyTester from './PolicyTester';
import { useABAC } from '../../hooks/useABAC';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  description: string;
  badge?: string;
}

const ABACManagement = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const { policies, attributes, loading } = useABAC();

  const tabs: TabConfig[] = [
    { 
      id: 'policies', 
      name: 'Policy Rules', 
      icon: Shield, 
      component: PolicyRulesManager,
      description: 'Manage access control policies',
      badge: policies.length > 0 ? policies.length.toString() : undefined
    },
    { 
      id: 'attributes', 
      name: 'Attributes', 
      icon: Settings, 
      component: AttributeManager,
      description: 'Define user and resource attributes',
      badge: attributes.length > 0 ? attributes.length.toString() : undefined
    },
    { 
      id: 'user-attrs', 
      name: 'User Attributes', 
      icon: Users, 
      component: UserAttributesManager,
      description: 'Assign attributes to users'
    },
    { 
      id: 'audit', 
      name: 'Policy Audit', 
      icon: Eye, 
      component: PolicyAuditViewer,
      description: 'View policy evaluation logs'
    },
    { 
      id: 'test', 
      name: 'Policy Tester', 
      icon: TestTube, 
      component: PolicyTester,
      description: 'Test policy rules'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PolicyRulesManager;

  // Get system statistics
  const getSystemStats = () => {
    const activePolicies = policies.filter(p => p.isActive).length;
    const allowPolicies = policies.filter(p => p.effect === 'allow').length;
    const denyPolicies = policies.filter(p => p.effect === 'deny').length;
    const activeAttributes = attributes.filter(a => a.isActive).length;

    return {
      totalPolicies: policies.length,
      activePolicies,
      allowPolicies,
      denyPolicies,
      totalAttributes: attributes.length,
      activeAttributes
    };
  };

  const stats = getSystemStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dynamic ABAC Management</h1>
        <p className="mt-1 text-gray-500">
          Create and manage attribute-based access control policies dynamically
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPolicies}</p>
                <p className="text-xs text-gray-500">
                  {stats.activePolicies} active
                </p>
              </div>
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attributes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAttributes}</p>
                <p className="text-xs text-gray-500">
                  {stats.activeAttributes} active
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Database className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allow Policies</p>
                <p className="text-2xl font-bold text-green-600">{stats.allowPolicies}</p>
                <p className="text-xs text-gray-500">
                  Grant access rules
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deny Policies</p>
                <p className="text-2xl font-bold text-red-600">{stats.denyPolicies}</p>
                <p className="text-xs text-gray-500">
                  Restrict access rules
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || Shield, {
                className: "h-4 w-4 text-blue-600"
              })}
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading ABAC system...</span>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div className="mt-6">
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          }>
            <ActiveComponent />
          </React.Suspense>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common ABAC management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('policies')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <Shield className="h-5 w-5 text-indigo-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Create Policy</p>
                <p className="text-xs text-gray-500">Add new access rule</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('attributes')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
            >
              <Settings className="h-5 w-5 text-green-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Add Attribute</p>
                <p className="text-xs text-gray-500">Define new attribute</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <TestTube className="h-5 w-5 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Test Policy</p>
                <p className="text-xs text-gray-500">Simulate access check</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <Eye className="h-5 w-5 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">View Audit</p>
                <p className="text-xs text-gray-500">Check access logs</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ABACManagement;