// src/pages/admin/ModelsManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Database, Trash2, Check, RefreshCw, CheckSquare } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import { modelsApi } from '../../utils/api';
import { Model } from '../../types';

interface ModelFormData {
  name: string;
  displayName: string;
  description: string;
}

const ModelsManagement = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    displayName: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load models from API
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelsApi.getAll();
      setModels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
      console.error('Load models error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate name from display name
    if (name === 'displayName') {
      const generatedName = value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      setFormData(prev => ({ ...prev, name: generatedName }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const newModel = await modelsApi.create(formData);
      setModels(prev => [...prev, newModel]);
      setFormData({ name: '', displayName: '', description: '' });
      setIsFormOpen(false);
      
      setSuccessMessage('Model created successfully with CRUD permissions');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert('Failed to create model: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" model? This will also delete all associated permissions.`)) {
      return;
    }

    try {
      await modelsApi.delete(id);
      setModels(models.filter(model => model._id !== id));
      setSuccessMessage('Model and permissions deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert('Failed to delete model: ' + err.message);
    }
  };

  const handleRefreshPermissions = async (id: string, name: string) => {
    if (!window.confirm(`Refresh CRUD permissions for "${name}" model?`)) {
      return;
    }

    try {
      await modelsApi.refreshPermissions(id);
      setSuccessMessage('Permissions refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert('Failed to refresh permissions: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Models Management</h1>
            <p className="mt-1 text-gray-500">Create and manage system models and their permissions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Models Management</h1>
            <p className="mt-1 text-gray-500">Create and manage system models and their permissions</p>
          </div>
          <Button 
            onClick={loadModels}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <Database className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Models</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadModels} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Models Management</h1>
          <p className="mt-1 text-gray-500">
            Create and manage system models and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={loadModels}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Model
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Model</CardTitle>
            <CardDescription>
              Create a new model to add to the system. This will automatically generate CRUD permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField id="displayName" label="Display Name" error="">
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="e.g., Products"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              
              <FormField id="name" label="Model Name (API)" error="" description="Auto-generated from display name">
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., products"
                  value={formData.name}
                  onChange={handleInputChange}
                  pattern="^[a-z_]+$"
                  title="Only lowercase letters and underscores allowed"
                  required
                />
              </FormField>
              
              <FormField id="description" label="Description" error="">
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., Product catalog items"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                setFormData({ name: '', displayName: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={creating}
            >
              Create Model
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map(model => (
          <Card key={model._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{model.displayName}</CardTitle>
                <div className="rounded-full bg-indigo-100 p-1 text-indigo-600">
                  <Database className="h-5 w-5" />
                </div>
              </div>
              <CardDescription>
                {model.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">API Name:</span>
                  <span className="font-mono text-gray-700">{model.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="flex items-center text-emerald-700">
                    <CheckSquare className="mr-1 h-4 w-4" />
                    {model.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-700">
                    {new Date(model.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 pt-3">
              <div className="flex w-full justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => handleRefreshPermissions(model._id, model.displayName)}
                >
                  Refresh Permissions
                </Button>
                {!['users', 'colleges', 'attachments', 'settings', 'dashboard', 'admin'].includes(model.name) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(model._id, model.displayName)}
                  >
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {models.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
            <div className="text-center">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No models found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new model
              </p>
              <div className="mt-6">
                <Button 
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsFormOpen(true)}
                >
                  Add Model
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelsManagement;