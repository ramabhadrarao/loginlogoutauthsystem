// src/components/modals/DepartmentFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, Globe, MapPin, Calendar, Image as ImageIcon, Users } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import ImagePickerModal from './ImagePickerModal';
import { Department, College, User } from '../../types';
import { collegesApi, usersApi } from '../../utils/api';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (departmentData: Partial<Department>) => Promise<void>;
  department?: Department | null;
  isLoading?: boolean;
}

const DepartmentFormModal = ({ isOpen, onClose, onSubmit, department, isLoading }: DepartmentFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    collegeId: '',
    hodId: '',
    logo: '',
    description: '',
    email: '',
    phone: '',
    establishedDate: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [hods, setHods] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load colleges and potential HODs
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      if (department) {
        // Edit mode
        setFormData({
          name: department.name || '',
          code: department.code || '',
          collegeId: department.collegeId || '',
          hodId: department.hodId || '',
          logo: department.logo || '',
          description: department.description || '',
          email: department.email || '',
          phone: department.phone || '',
          establishedDate: department.establishedDate ? department.establishedDate.split('T')[0] : '',
          status: department.status || 'active'
        });
      } else {
        // Create mode
        setFormData({
          name: '',
          code: '',
          collegeId: '',
          hodId: '',
          logo: '',
          description: '',
          email: '',
          phone: '',
          establishedDate: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, department]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [collegesData, usersData] = await Promise.all([
        collegesApi.getAll(),
        usersApi.getAll()
      ]);
      setColleges(collegesData);
      setHods(usersData); // All users can potentially be HODs
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate code from name for new departments
    if (name === 'name' && !department) {
      const autoCode = value
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(' ')
        .map(word => word.slice(0, 3))
        .join('')
        .slice(0, 6);
      
      setFormData(prev => ({
        ...prev,
        code: autoCode
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      logo: imageUrl
    }));
    
    // Clear logo error if it exists
    if (errors.logo) {
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Department code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Department code must contain only uppercase letters and numbers';
    }

    if (!formData.collegeId) {
      newErrors.collegeId = 'College selection is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number format is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const departmentData: Partial<Department> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      collegeId: formData.collegeId,
      hodId: formData.hodId || undefined,
      logo: formData.logo.trim() || undefined,
      description: formData.description.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      establishedDate: formData.establishedDate || undefined,
      status: formData.status
    };

    try {
      await onSubmit(departmentData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
          
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  {department ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="name" label="Department Name" error={errors.name}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Enter department name"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    <FormField id="code" label="Department Code" error={errors.code}>
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="DEPT"
                        className="uppercase"
                        disabled={isLoading}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="collegeId" label="College" error={errors.collegeId}>
                      <select
                        id="collegeId"
                        name="collegeId"
                        value={formData.collegeId}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select College</option>
                        {colleges.map(college => (
                          <option key={college._id} value={college._id}>
                            {college.name} ({college.code})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField id="hodId" label="Head of Department" error={errors.hodId}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Users className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          id="hodId"
                          name="hodId"
                          value={formData.hodId}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select HOD (Optional)</option>
                          {hods.map(user => (
                            <option key={user._id} value={user._id}>
                              {user.username} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  </div>

                  {/* Logo Selection */}
                  <FormField id="logo" label="Department Logo" error={errors.logo}>
                    <div className="space-y-3">
                      {formData.logo && (
                        <div className="flex items-center space-x-3">
                          <img
                            src={formData.logo}
                            alt="Department logo preview"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyNFYzNE0zMiA0Mkg0Mk00MiAyNEgzMkgzMlpNMjIgMjRIMThWMzRINDJWMjRIMjJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Logo selected</p>
                            <p className="text-xs text-gray-500 truncate">
                              {formData.logo.split('/').pop()}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsImagePickerOpen(true)}
                          icon={<ImageIcon className="h-4 w-4" />}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {formData.logo ? 'Change Logo' : 'Select Logo'}
                        </Button>
                        
                        {formData.logo && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </FormField>

                  <FormField id="description" label="Description" error={errors.description}>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter department description"
                      disabled={isLoading}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="email" label="Email Address" error={errors.email}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="dept@college.edu"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    <FormField id="phone" label="Phone Number" error={errors.phone}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="(123) 456-7890"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="establishedDate" label="Established Date" error={errors.establishedDate}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="establishedDate"
                          name="establishedDate"
                          type="date"
                          value={formData.establishedDate}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    <FormField id="status" label="Status" error={errors.status}>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </FormField>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <Button
                type="submit"
                onClick={handleSubmit}
                isLoading={isLoading}
                disabled={loadingData}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {department ? 'Update Department' : 'Create Department'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={handleImageSelect}
        currentImageUrl={formData.logo}
        title="Select Department Logo"
      />
    </>
  );
};

export default DepartmentFormModal;