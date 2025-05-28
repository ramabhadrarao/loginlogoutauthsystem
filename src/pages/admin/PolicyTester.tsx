// src/pages/admin/PolicyTester.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { TestTube, Play, CheckCircle, XCircle, AlertCircle, Clock, User, Shield, Settings, RefreshCw, Copy, Save } from 'lucide-react';
import { useABAC } from '../../hooks/useABAC';
import { usersApi } from '../../utils/api';
import { User as UserType } from '../../types';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  userId: string;
  resource: {
    modelName: string;
    resourceId?: string;
    [key: string]: any;
  };
  action: string;
  context?: {
    [key: string]: any;
  };
}

const PolicyTester = () => {
  const { 
    models, 
    attributes, 
    testPolicy, 
    loading: abacLoading 
  } = useABAC();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Test form data
  const [testData, setTestData] = useState({
    userId: '',
    modelName: '',
    resourceId: '',
    resourceAttributes: {} as Record<string, any>,
    action: 'read',
    contextAttributes: {} as Record<string, any>
  });
  
  // Test results
  const [testResult, setTestResult] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<Array<{
    timestamp: Date;
    input: any;
    result: any;
  }>>([]);
  
  // Predefined scenarios
  const [scenarios, setScenarios] = useState<TestScenario[]>([
    {
      id: '1',
      name: 'HOD Department Access',
      description: 'Test if HOD can access students in their department',
      userId: '',
      resource: {
        modelName: 'Student',
        departmentId: '507f1f77bcf86cd799439011',
        status: 'active'
      },
      action: 'read'
    },
    {
      id: '2',
      name: 'Faculty Cross-Department',
      description: 'Test if faculty can access students from other departments',
      userId: '',
      resource: {
        modelName: 'Student',
        departmentId: '507f1f77bcf86cd799439012',
        status: 'active'
      },
      action: 'read'
    },
    {
      id: '3',
      name: 'Create Access Test',
      description: 'Test creation permissions for different roles',
      userId: '',
      resource: {
        modelName: 'Course',
        departmentId: '507f1f77bcf86cd799439011'
      },
      action: 'create'
    }
  ]);

  useEffect(() => {
    loadUsers();
  }, []);

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

  const handleRunTest = async () => {
    if (!testData.userId || !testData.modelName || !testData.action) {
      alert('Please fill in required fields: User, Resource Model, and Action');
      return;
    }

    try {
      setTesting(true);
      
      const resource = {
        modelName: testData.modelName,
        ...(testData.resourceId && { _id: testData.resourceId }),
        ...testData.resourceAttributes
      };

      const context = {
        ...testData.contextAttributes,
        timestamp: new Date().toISOString(),
        testMode: true
      };

      const result = await testPolicy(testData.userId, resource, testData.action, context);
      
      setTestResult(result);
      
      // Add to history
      setTestHistory(prev => [{
        timestamp: new Date(),
        input: { ...testData, resource, context },
        result
      }, ...prev.slice(0, 9)]); // Keep last 10 tests
      
    } catch (error) {
      console.error('Policy test failed:', error);
      setTestResult({
        decision: 'error',
        error: (error as Error).message,
        policies: []
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunScenario = async (scenario: TestScenario) => {
    if (!scenario.userId) {
      alert('Please select a user for this scenario first');
      return;
    }

    setTestData({
      userId: scenario.userId,
      modelName: scenario.resource.modelName,
      resourceId: scenario.resource.resourceId || '',
      resourceAttributes: { ...scenario.resource },
      action: scenario.action,
      contextAttributes: scenario.context || {}
    });

    // Automatically run the test
    setTimeout(() => {
      handleRunTest();
    }, 100);
  };

  const addResourceAttribute = () => {
    const key = prompt('Enter attribute name:');
    if (key) {
      const value = prompt('Enter attribute value:');
      if (value !== null) {
        setTestData(prev => ({
          ...prev,
          resourceAttributes: {
            ...prev.resourceAttributes,
            [key]: value
          }
        }));
      }
    }
  };

  const removeResourceAttribute = (key: string) => {
    setTestData(prev => ({
      ...prev,
      resourceAttributes: Object.fromEntries(
        Object.entries(prev.resourceAttributes).filter(([k]) => k !== key)
      )
    }));
  };

  const addContextAttribute = () => {
    const key = prompt('Enter context attribute name:');
    if (key) {
      const value = prompt('Enter context attribute value:');
      if (value !== null) {
        setTestData(prev => ({
          ...prev,
          contextAttributes: {
            ...prev.contextAttributes,
            [key]: value
          }
        }));
      }
    }
  };

  const removeContextAttribute = (key: string) => {
    setTestData(prev => ({
      ...prev,
      contextAttributes: Object.fromEntries(
        Object.entries(prev.contextAttributes).filter(([k]) => k !== key)
      )
    }));
  };

  const copyTestConfig = () => {
    const config = JSON.stringify(testData, null, 2);
    navigator.clipboard.writeText(config);
    alert('Test configuration copied to clipboard!');
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'allow':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'deny':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'allow':
        return 'bg-green-100 text-green-800';
      case 'deny':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Policy Tester</h2>
          <p className="text-sm text-gray-500">
            Test access control policies with different user scenarios
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={copyTestConfig}
            icon={<Copy className="h-4 w-4" />}
          >
            Copy Config
          </Button>
          <Button
            onClick={handleRunTest}
            isLoading={testing}
            icon={<Play className="h-4 w-4" />}
          >
            Run Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Configuration</CardTitle>
              <CardDescription>Set up your policy test scenario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Test Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test User *
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testData.userId}
                    onChange={(e) => setTestData(prev => ({ ...prev, userId: e.target.value }))}
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                        {user.isSuperAdmin && ' - Super Admin'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Model *
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testData.modelName}
                    onChange={(e) => setTestData(prev => ({ ...prev, modelName: e.target.value }))}
                  >
                    <option value="">Select Model</option>
                    {models.map(model => (
                      <option key={model._id} value={model.name}>
                        {model.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action *
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testData.action}
                    onChange={(e) => setTestData(prev => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="create">Create</option>
                    <option value="read">Read</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource ID (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={testData.resourceId}
                    onChange={(e) => setTestData(prev => ({ ...prev, resourceId: e.target.value }))}
                    placeholder="507f1f77bcf86cd799439011"
                  />
                </div>
              </div>

              {/* Resource Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resource Attributes
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addResourceAttribute}
                  >
                    Add Attribute
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(testData.resourceAttributes).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm bg-gray-50"
                      />
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => setTestData(prev => ({
                          ...prev,
                          resourceAttributes: {
                            ...prev.resourceAttributes,
                            [key]: e.target.value
                          }
                        }))}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeResourceAttribute(key)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {Object.keys(testData.resourceAttributes).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No resource attributes set</p>
                  )}
                </div>
              </div>

              {/* Context Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Context Attributes (Environment)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addContextAttribute}
                  >
                    Add Context
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(testData.contextAttributes).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm bg-gray-50"
                      />
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => setTestData(prev => ({
                          ...prev,
                          contextAttributes: {
                            ...prev.contextAttributes,
                            [key]: e.target.value
                          }
                        }))}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeContextAttribute(key)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {Object.keys(testData.contextAttributes).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No context attributes set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Scenarios */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Scenarios</CardTitle>
              <CardDescription>Pre-configured test scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{scenario.name}</h4>
                      <p className="text-xs text-gray-500">{scenario.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    <span className="font-medium">Resource:</span> {scenario.resource.modelName} | 
                    <span className="font-medium"> Action:</span> {scenario.action}
                  </div>
                  
                  <div className="mb-2">
                    <select
                      className="w-full text-xs rounded border border-gray-300 px-2 py-1"
                      value={scenario.userId}
                      onChange={(e) => {
                        const updatedScenarios = scenarios.map(s => 
                          s.id === scenario.id ? { ...s, userId: e.target.value } : s
                        );
                        setScenarios(updatedScenarios);
                      }}
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunScenario(scenario)}
                    disabled={!scenario.userId}
                    className="w-full"
                  >
                    Run Scenario
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              {getDecisionIcon(testResult.decision)}
              <span>Test Result: {testResult.decision?.toUpperCase()}</span>
              {testResult.evaluationTime && (
                <span className="text-sm text-gray-500">
                  ({testResult.evaluationTime}ms)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="font-medium text-red-800 mb-2">Error</h4>
                <p className="text-sm text-red-700">{testResult.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Decision Summary */}
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDecisionColor(testResult.decision)}`}>
                    {testResult.decision?.toUpperCase()}
                  </span>
                  {testResult.evaluationTime && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Evaluation time: {testResult.evaluationTime}ms</span>
                    </div>
                  )}
                </div>

                {/* Policy Details */}
                {testResult.policies && testResult.policies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Evaluated Policies ({testResult.policies.length})
                    </h4>
                    <div className="space-y-3">
                      {testResult.policies.map((policy: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{policy.policyName || `Policy ${index + 1}`}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-xs rounded ${policy.matched ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {policy.matched ? 'Matched' : 'Not Matched'}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded ${getDecisionColor(policy.effect)}`}>
                                {policy.effect?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          {policy.conditions && policy.conditions.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-1">Conditions:</h5>
                              <div className="space-y-1">
                                {policy.conditions.map((condition: any, condIndex: number) => (
                                  <div key={condIndex} className="text-xs text-gray-600 flex items-center space-x-2">
                                    <span className={`w-2 h-2 rounded-full ${condition.result ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span>
                                      {condition.type}: {condition.attribute} {condition.operator} {JSON.stringify(condition.expectedValue)}
                                    </span>
                                    <span className="text-gray-400">
                                      (got: {JSON.stringify(condition.actualValue)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test History</CardTitle>
            <CardDescription>Recent policy tests ({testHistory.length})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testHistory.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getDecisionIcon(test.result.decision)}
                    <div>
                      <div className="text-sm font-medium">
                        {test.input.modelName} - {test.input.action}
                      </div>
                      <div className="text-xs text-gray-500">
                        {test.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${getDecisionColor(test.result.decision)}`}>
                      {test.result.decision?.toUpperCase()}
                    </span>
                    {test.result.evaluationTime && (
                      <span className="text-xs text-gray-500">
                        {test.result.evaluationTime}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyTester;