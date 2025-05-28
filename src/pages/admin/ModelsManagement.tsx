import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Database, Trash2, Check, RefreshCw, CheckSquare } from 'lucide-react';
import FormField from '../../components/ui/FormField';

interface ModelFormData {
  name: string;
  displayName: string;
  description: string;
}

const ModelsManagement = () => {
  const [models, setModels] = useState([
    {
      _id: '1',
      name: 'users',
      displayName: 'Users',
      description: 'User accounts and profiles',
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: '2',
      name: 'colleges',
      displayName: 'Colleges',
      description: 'Educational institutions',
      isActive: true,
      createdAt: '2023-01-02T00:00:00.000Z'
    },
    {
      _id: '3',
      name: 'attachments',
      displayName: 'Attachments',
      description: 'File uploads and attachments',
      isActive: true,
      createdAt: '2023-01-03T00:00:00.000Z'
    },
    {
      _id: '4',
      name: 'settings',
      displayName: 'Settings',
      description: 'System configuration settings',
      isActive: true,
      createdAt: '2023-01-04T00:00:00.000Z'
    }
  ]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    displayName: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add new model to list (in real app would be from API response)
    const newModel = {
      _id: Math.random().toString(36).substring(2, 11),
      name: formData.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: formData.displayName,
      description: formData.description,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    setModels(prev => [...prev, newModel]);
    setFormData({ name: '', displayName: '', description: '' });
    setIsFormOpen(false);
    setIsLoading(false);
    
    setSuccessMessage('Model created successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Models Management</h1>
          <p className="mt-1 text-gray-500">
            Create and manage system models and their permissions
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Model
        </Button>
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
              <FormField id="name" label="Model Name" error="">
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., products"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              
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
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
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
                    Active
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
                >
                  Refresh Permissions
                </Button>
                {model.name !== 'users' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModelsManagement;