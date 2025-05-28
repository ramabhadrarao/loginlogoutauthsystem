// src/pages/admin/AttributeManager.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Save, X, Settings, Database, User, Globe, AlertCircle } from 'lucide-react';
import { useABAC } from '../../hooks/useABAC';
import { AttributeDefinition } from '../../types/abac';

const AttributeManager = () => {
  const { 
    attributes, 
    models, 
    loading, 
    error,
    createAttribute, 
    updateAttribute, 
    deleteAttribute 
  } = useABAC();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeDefinition | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    dataType: 'string' as 'string' | 'number' | 'boolean' | 'date' | 'reference' | 'array',
    referenceModel: '',
    possibleValues: [] as Array<{ value: string; label: string }>,
    isRequired: false,
    category: 'user' as 'user' | 'resource' | 'environment' | 'context',
    description: '',
    validationRules: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
      pattern: ''
    }
  });

  const [newPossibleValue, setNewPossibleValue] = useState({ value: '', label: '' });

  const handleCreateAttribute = () => {
    setSelectedAttribute(null);
    setFormData({
      name: '',
      displayName: '',
      dataType: 'string',
      referenceModel: '',
      possibleValues: [],
      isRequired: false,
      category: 'user',
      description: '',
      validationRules: { min: undefined, max: undefined, pattern: '' }
    });
    setIsModalOpen(true);
  };

  const handleEditAttribute = (attribute: AttributeDefinition) => {
    setSelectedAttribute(attribute);
    setFormData({
      name: attribute.name,
      displayName: attribute.displayName,
      dataType: attribute.dataType,
      referenceModel: attribute.referenceModel || '',
      possibleValues: attribute.possibleValues || [],
      isRequired: attribute.isRequired,
      category: attribute.category,
      description: attribute.description || '',
      validationRules: attribute.validationRules || { min: undefined, max: undefined, pattern: '' }
    });
    setIsModalOpen(true);
  };

  const handleDeleteAttribute = async (attributeId: string, attributeName: string) => {
    if (!window.confirm(`Are you sure you want to delete attribute "${attributeName}"?`)) {
      return;
    }

    try {
      await deleteAttribute(attributeId);
    } catch (error) {
      console.error('Failed to delete attribute:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Attribute name is required');
      return;
    }

    if (!formData.displayName.trim()) {
      alert('Display name is required');
      return;
    }

    if (formData.dataType === 'reference' && !formData.referenceModel) {
      alert('Reference model is required for reference type attributes');
      return;
    }

    try {
      setSaving(true);
      
      const attributeData = {
        ...formData,
        name: formData.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        isActive: true,
        possibleValues: formData.possibleValues.length > 0 ? formData.possibleValues : undefined,
        referenceModel: formData.dataType === 'reference' ? formData.referenceModel : undefined,
        validationRules: (formData.validationRules.min !== undefined || 
                         formData.validationRules.max !== undefined || 
                         formData.validationRules.pattern) ? formData.validationRules : undefined
      };

      if (selectedAttribute) {
        await updateAttribute(selectedAttribute._id, attributeData);
      } else {
        await createAttribute(attributeData);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save attribute:', error);
      alert('Failed to save attribute: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addPossibleValue = () => {
    if (!newPossibleValue.value.trim() || !newPossibleValue.label.trim()) {
      return;
    }

    if (formData.possibleValues.some(pv => pv.value === newPossibleValue.value)) {
      alert('Value already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      possibleValues: [...prev.possibleValues, { ...newPossibleValue }]
    }));
    setNewPossibleValue({ value: '', label: '' });
  };

  const removePossibleValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      possibleValues: prev.possibleValues.filter((_, i) => i !== index)
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <User className="h-4 w-4" />;
      case 'resource': return <Database className="h-4 w-4" />;
      case 'environment': return <Globe className="h-4 w-4" />;
      case 'context': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'resource': return 'bg-green-100 text-green-800';
      case 'environment': return 'bg-purple-100 text-purple-800';
      case 'context': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'bg-indigo-100 text-indigo-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-red-100 text-red-800';
      case 'date': return 'bg-yellow-100 text-yellow-800';
      case 'reference': return 'bg-purple-100 text-purple-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group attributes by category
  const groupedAttributes = attributes.reduce((acc, attr) => {
    if (!acc[attr.category]) {
      acc[attr.category] = [];
    }
    acc[attr.category].push(attr);
    return acc;
  }, {} as Record<string, AttributeDefinition[]>);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            <h3 className="text-sm font-medium text-red-800">Error Loading Attributes</h3>
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
          <h2 className="text-lg font-semibold text-gray-900">Attribute Definitions</h2>
          <p className="text-sm text-gray-500">Define attributes that can be used in access control policies</p>
        </div>
        <Button onClick={handleCreateAttribute} icon={<Plus className="h-4 w-4" />}>
          Add Attribute
        </Button>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {['user', 'resource', 'environment', 'context'].map(category => {
          const categoryAttrs = groupedAttributes[category] || [];
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                    <p className="text-2xl font-bold text-gray-900">{categoryAttrs.length}</p>
                    <p className="text-xs text-gray-500">
                      {categoryAttrs.filter(a => a.isActive).length} active
                    </p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attributes by Category */}
      {Object.entries(groupedAttributes).map(([category, categoryAttributes]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center mb-4">
            <div className={`rounded-full p-2 mr-3 ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 capitalize">{category} Attributes</h3>
            <span className="ml-2 text-sm text-gray-500">({categoryAttributes.length})</span>
          </div>

          <div className="grid gap-4">
            {categoryAttributes.map((attr) => (
              <Card key={attr._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{attr.displayName}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getDataTypeColor(attr.dataType)}`}>
                          {attr.dataType}
                        </span>
                        {attr.isRequired && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${attr.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {attr.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{attr.name}</code>
                        {attr.description && (
                          <span className="ml-2">{attr.description}</span>
                        )}
                      </p>

                      {attr.referenceModel && (
                        <p className="text-xs text-gray-500 mb-2">
                          References: <strong>{attr.referenceModel}</strong>
                        </p>
                      )}

                      {attr.possibleValues && attr.possibleValues.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Possible Values:</p>
                          <div className="flex flex-wrap gap-1">
                            {attr.possibleValues.map((pv, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {pv.label} ({pv.value})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {attr.validationRules && (
                        <div className="text-xs text-gray-500">
                          {attr.validationRules.min !== undefined && (
                            <span className="mr-2">Min: {attr.validationRules.min}</span>
                          )}
                          {attr.validationRules.max !== undefined && (
                            <span className="mr-2">Max: {attr.validationRules.max}</span>
                          )}
                          {attr.validationRules.pattern && (
                            <span>Pattern: {attr.validationRules.pattern}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAttribute(attr)}
                        icon={<Edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAttribute(attr._id, attr.displayName)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {attributes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Settings className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attributes Defined</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first attribute definition
            </p>
            <Button onClick={handleCreateAttribute} icon={<Plus className="h-4 w-4" />}>
              Create First Attribute
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attribute Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedAttribute ? 'Edit Attribute' : 'Create New Attribute'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.displayName}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            displayName: e.target.value,
                            name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
                          }));
                        }}
                        placeholder="e.g., Department"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attribute Name *
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                        value={formData.name}
                        readOnly
                        placeholder="auto-generated"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Type *
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.dataType}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dataType: e.target.value as any,
                          referenceModel: e.target.value === 'reference' ? prev.referenceModel : ''
                        }))}
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="reference">Reference</option>
                        <option value="array">Array</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      >
                        <option value="user">User Attribute</option>
                        <option value="resource">Resource Attribute</option>
                        <option value="environment">Environment Attribute</option>
                        <option value="context">Context Attribute</option>
                      </select>
                    </div>
                  </div>

                  {/* Reference Model */}
                  {formData.dataType === 'reference' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference Model *
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.referenceModel}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceModel: e.target.value }))}
                      >
                        <option value="">Select Model</option>
                        {models.map(model => (
                          <option key={model._id} value={model.name}>
                            {model.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this attribute represents"
                    />
                  </div>

                  {/* Possible Values */}
                  {(formData.dataType === 'string' || formData.dataType === 'array') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Possible Values (Optional)
                      </label>
                      
                      <div className="space-y-2">
                        {formData.possibleValues.map((pv, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={pv.value}
                              readOnly
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-gray-50"
                            />
                            <input
                              type="text"
                              value={pv.label}
                              readOnly
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-gray-50"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removePossibleValue(index)}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Value"
                            value={newPossibleValue.value}
                            onChange={(e) => setNewPossibleValue(prev => ({ ...prev, value: e.target.value }))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Label"
                            value={newPossibleValue.label}
                            onChange={(e) => setNewPossibleValue(prev => ({ ...prev, label: e.target.value }))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addPossibleValue}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Rules */}
                  {formData.dataType === 'number' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Value
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          value={formData.validationRules.min || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            validationRules: {
                              ...prev.validationRules,
                              min: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Value
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          value={formData.validationRules.max || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            validationRules: {
                              ...prev.validationRules,
                              max: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Required checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={formData.isRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
                      This attribute is required
                    </label>
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
                  {selectedAttribute ? 'Update Attribute' : 'Create Attribute'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttributeManager;