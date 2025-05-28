// src/components/modals/CollegeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Building, Mail, Phone, Globe, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { College } from '../../types';

interface CollegeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collegeData: Partial<College>) => Promise<void>;
  college?: College | null;
  isLoading?: boolean;
}

const CollegeFormModal = ({ isOpen, onClose, onSubmit, college, isLoading }: CollegeFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo: '',
    website: '',
    address: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or college changes
  useEffect(() => {
    if (isOpen) {
      if (college) {
        // Edit mode
        setFormData({
          name: college.name || '',
          code: college.code || '',
          logo: college.logo || '',
          website: college.website || '',
          address: college.address || '',
          phone: college.phone || '',
          email: college.email || '',
          status: college.status || 'active'
        });
      } else {
        // Create mode
        setFormData({
          name: '',
          code: '',
          logo: '',
          website: '',
          address: '',
          phone: '',
          email: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, college]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate code from name for new colleges
    if (name === 'name' && !college) {
      const autoCode = value
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(' ')
        .map(word => word.slice(0, 4))
        .join('')
        .slice(0, 10);
      
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'College name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'College name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'College code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'College code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'College code must contain only uppercase letters and numbers';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must be a valid URL (starting with http:// or https://)';
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

    const collegeData: Partial<College> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      logo: formData.logo.trim() || undefined,
      website: formData.website.trim() || undefined,
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      status: formData.status
    };

    try {
      await onSubmit(collegeData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" />
                {college ? 'Edit College' : 'Add New College'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField id="name" label="College Name" error={errors.name}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter college name"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                <FormField id="code" label="College Code" error={errors.code}>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="COLLEGE"
                    className="uppercase"
                    disabled={isLoading}
                  />
                </FormField>
              </div>

              <FormField id="address" label="Address" error={errors.address}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="Enter college address"
                    disabled={isLoading}
                  />
                </div>
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
                      placeholder="contact@college.edu"
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

              <FormField id="website" label="Website" error={errors.website}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="https://college.edu"
                    disabled={isLoading}
                  />
                </div>
              </FormField>

              <FormField id="logo" label="Logo URL (Optional)" error={errors.logo}>
                <Input
                  id="logo"
                  name="logo"
                  type="url"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                  disabled={isLoading}
                />
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
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isLoading}
              className="w-full sm:ml-3 sm:w-auto"
            >
              {college ? 'Update College' : 'Create College'}
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
  );
};

export default CollegeFormModal;