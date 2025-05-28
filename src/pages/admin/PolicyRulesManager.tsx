// src/pages/admin/PolicyRulesManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { useABAC } from '../../hooks/useABAC';
import { PolicyRule, PolicyCondition } from '../../types/abac';

const PolicyRulesManager = () => {
  const { 
    policies, 
    attributes, 
    models, 
    loading, 
    error,
    createPolicy, 
    updatePolicy, 
    deletePolicy 
  } = useABAC();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyRule | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 100,
    effect: 'allow' as 'allow' | 'deny',
    resource: {
      modelName: '',
      resourceConditions: [] as PolicyCondition[]
    },
    subjectConditions: [] as PolicyCondition[],
    actions: [] as string[],
    environmentConditions: [] as PolicyCondition[],
    timeBasedAccess: {
      allowedDays: [] as string[],
      allowedHours: [] as Array<{ start: string; end: string }>
    }
  });

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setFormData({
      name: '',
      description: '',
      priority: 100,
      effect: 'allow',
      resource: { modelName: '', resourceConditions: [] },
      subjectConditions: [],
      actions: [],
      environmentConditions: [],
      timeBasedAccess: { allowedDays: [], allowedHours: [] }
    });
    setIsModalOpen(true);
  };

  const handleEditPolicy = (policy: PolicyRule) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      priority: policy.priority,
      effect: policy.effect,
      resource: policy.resource || { modelName: '', resourceConditions: [] },
      subjectConditions: policy.subjectConditions || [],
      actions: policy.actions || [],
      environmentConditions: policy.environmentConditions || [],
      timeBasedAccess: policy.timeBasedAccess || { allowedDays: [], allowedHours: [] }
    });
    setIsModalOpen(true);
  };

  const handleDeletePolicy = async (policyId: string, policyName: string) => {
    if (!window.confirm(`Are you sure you want to delete policy "${policyName}"?`)) {
      return;
    }

    try {
      await deletePolicy(policyId);
    } catch (error) {
      console.error('Failed to delete policy:', error);
    }
  };

  const addCondition = (type: 'subject' | 'resource' | 'environment') => {
    const newCondition: PolicyCondition = {
      attribute: '',
      operator: 'equals',
      value: '',
      logicalOperator: 'AND'
    };

    if (type === 'resource') {
      setFormData(prev => ({
        ...prev,
        resource: {
          ...prev.resource,
          resourceConditions: [...prev.resource.resourceConditions, newCondition]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [`${type}Conditions`]: [...prev[`${type}Conditions` as keyof typeof prev] as PolicyCondition[], newCondition]
      }));
    }
  };

  const updateCondition = (type: 'subject' | 'resource' | 'environment', index: number, field: keyof PolicyCondition, value: any) => {
    if (type === 'resource') {
      setFormData(prev => ({
        ...prev,
        resource: {
          ...prev.resource,
          resourceConditions: prev.resource.resourceConditions.map((condition, i) =>
            i === index ? { ...condition, [field]: value } : condition
          )
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [`${type}Conditions`]: (prev[`${type}Conditions` as keyof typeof prev] as PolicyCondition[]).map((condition, i) =>
          i === index ? { ...condition, [field]: value } : condition
        )
      }));
    }
  };

  const removeCondition = (type: 'subject' | 'resource' | 'environment', index: number) => {
    if (type === 'resource') {
      setFormData(prev => ({
        ...prev,
        resource: {
          ...prev.resource,
          resourceConditions: prev.resource.resourceConditions.filter((_, i) => i !== index)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [`${type}Conditions`]: (prev[`${type}Conditions` as keyof typeof prev] as PolicyCondition[]).filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Policy name is required');
      return;
    }

    if (!formData.resource.modelName) {
      alert('Resource model is required');
      return;
    }

    if (formData.actions.length === 0) {
      alert('At least one action must be selected');
      return;
    }

    try {
      setSaving(true);
      
      const policyData = {
        ...formData,
        isActive: true
      };

      if (selectedPolicy) {
        await updatePolicy(selectedPolicy._id, policyData);
      } else {
        await createPolicy(policyData);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert('Failed to save policy: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderConditionBuilder = (
    conditions: PolicyCondition[], 
    type: 'subject' | 'resource' | 'environment',
    title: string
  ) => {
    const availableAttributes = attributes.filter(attr => {
      if (type === 'subject') return attr.category === 'user';
      if (type === 'resource') return attr.category === 'resource';
      if (type === 'environment') return attr.category === 'environment';
      return false;
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{title}</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addCondition(type)}
          >
            Add Condition
          </Button>
        </div>
        
        {conditions.map((condition, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded-md bg-gray-50">
            <select
              className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white"
              value={condition.attribute}
              onChange={(e) => updateCondition(type, index, 'attribute', e.target.value)}
            >
              <option value="">Select Attribute</option>
              {availableAttributes.map(attr => (
                <option key={attr.name} value={attr.name}>{attr.displayName}</option>
              ))}
            </select>
            
            <select
              className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white"
              value={condition.operator}
              onChange={(e) => updateCondition(type, index, 'operator', e.target.value)}
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="in">In</option>
              <option value="not_in">Not In</option>
              <option value="contains">Contains</option>
              <option value="starts_with">Starts With</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              {type === 'resource' && (
                <>
                  <option value="same_as_user">Same as User</option>
                  <option value="different_from_user">Different from User</option>
                </>
              )}
            </select>
            
            {condition.operator === 'same_as_user' || condition.operator === 'different_from_user' ? (
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white"
                value={condition.referenceUserAttribute || ''}
                onChange={(e) => updateCondition(type, index, 'referenceUserAttribute', e.target.value)}
              >
                <option value="">Select User Attribute</option>
                {attributes.filter(attr => attr.category === 'user').map(attr => (
                  <option key={attr.name} value={attr.name}>{attr.displayName}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={condition.value}
                onChange={(e) => updateCondition(type, index, 'value', e.target.value)}
                placeholder="Value"
              />
            )}
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeCondition(type, index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        ))}
        
        {conditions.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No conditions added yet. Click "Add Condition" to get started.
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Policies</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Policy Rules</h2>
          <p className="text-sm text-gray-500">Define dynamic access control policies</p>
        </div>
        <Button onClick={handleCreatePolicy} icon={<Plus className="h-4 w-4" />}>
          Create Policy
        </Button>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{policy.name}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium
                    ${policy.effect === 'allow' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}
                  `}>
                    {policy.effect.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Priority: {policy.priority}
                  </span>
                  <span className={`
                    text-xs px-2 py-1 rounded
                    ${policy.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'}
                  `}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Resource</h4>
                  <p className="text-gray-600">{policy.resource.modelName}</p>
                  <p className="text-xs text-gray-500">
                    {policy.resource.resourceConditions?.length || 0} conditions
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Actions</h4>
                  <div className="flex flex-wrap gap-1">
                    {policy.actions.map((action, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Subject</h4>
                  <p className="text-xs text-gray-500">
                    {policy.subjectConditions?.length || 0} conditions
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditPolicy(policy)}
                  icon={<Edit className="h-4 w-4" />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeletePolicy(policy._id, policy.name)}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {policies.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Policies Found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first access control policy
              </p>
              <Button onClick={handleCreatePolicy} icon={<Plus className="h-4 w-4" />}>
                Create First Policy
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Policy Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative w-full max-w-6xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedPolicy ? 'Edit Policy' : 'Create New Policy'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Name *
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter policy name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority *
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this policy does"
                    />
                  </div>

                  {/* Resource and Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Model *
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.resource.modelName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          resource: { ...prev.resource, modelName: e.target.value }
                        }))}
                      >
                        <option value="">Select Model</option>
                        {models.map(model => (
                          <option key={model._id} value={model.name}>
                            {model.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Effect *
                      </label>
                      <div className="flex space-x-4 pt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="effect"
                            value="allow"
                            checked={formData.effect === 'allow'}
                            onChange={(e) => setFormData(prev => ({ ...prev, effect: e.target.value as 'allow' | 'deny' }))}
                            className="mr-2 text-indigo-600"
                          />
                          <span className="text-sm text-green-700 font-medium">Allow</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="effect"
                            value="deny"
                            checked={formData.effect === 'deny'}
                            onChange={(e) => setFormData(prev => ({ ...prev, effect: e.target.value as 'allow' | 'deny' }))}
                            className="mr-2 text-indigo-600"
                          />
                          <span className="text-sm text-red-700 font-medium">Deny</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Actions *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import'].map(action => (
                        <label key={action} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.actions.includes(action)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  actions: [...prev.actions, action]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  actions: prev.actions.filter(a => a !== action)
                                }));
                              }
                            }}
                            className="mr-2 text-indigo-600"
                          />
                          <span className="text-sm capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-6">
                    {renderConditionBuilder(formData.subjectConditions, 'subject', 'Subject Conditions (Who can access)')}
                    {renderConditionBuilder(formData.resource.resourceConditions, 'resource', 'Resource Conditions (What can be accessed)')}
                    {renderConditionBuilder(formData.environmentConditions, 'environment', 'Environment Conditions (When/where access is allowed)')}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  icon={<Save className="h-4 w-4" />}
                  isLoading={saving}
                >
                  {selectedPolicy ? 'Update Policy' : 'Create Policy'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PolicyRulesManager;