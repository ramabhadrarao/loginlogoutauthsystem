// src/components/modals/ProgramFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Building2, User, Clock, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { Program } from '../../utils/academicApi';
import { departmentsApi, usersApi, Department, User as UserType } from '../../utils/api';

interface ProgramFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (programData: Partial<Program>) => Promise<void>;
  program?: Program | null;
  isLoading?: boolean;
}

const ProgramFormModal = ({ isOpen, onClose, onSubmit, program, isLoading }: ProgramFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    coordinatorId: '',
    duration: '',
    degreeType: "Bachelor's" as "Bachelor's" | "Master's" | "Doctoral" | "Diploma" | "Certificate",
    description: '',
    status: 'active' as 'active' | 'inactive' | 'archived'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [coordinators, setCoordinators] = useState<UserType[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load departments and users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or program changes
  useEffect(() => {
    if (isOpen) {
      if (program) {
        // Edit mode
        setFormData({
          name: program.name || '',
          code: program.code || '',
          departmentId: program.departmentId || '',
          coordinatorId: program.coordinatorId || '',
          duration: program.duration || '',
          degreeType: program.degreeType || "Bachelor's",
          description: program.description || '',
          status: program.status || 'active'
        });
      } else {
        // Create mode
        setFormData({
          name: '',
          code: '',
          departmentId: '',
          coordinatorId: '',
          duration: '',
          degreeType: "Bachelor's",
          description: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, program]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [departmentsData, usersData] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.getAll()
      ]);
      setDepartments(departmentsData);
      setCoordinators(usersData); // All users can potentially be coordinators
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
    
    // Auto-generate code from name for new programs
    if (name === 'name' && !program) {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Program name must be at least 3 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Program code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Program code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Program code must contain only uppercase letters and numbers';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department selection is required';
    }

    if (!formData.degreeType) {
      newErrors.degreeType = 'Degree type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const programData: Partial<Program> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      departmentId: formData.departmentId,
      coordinatorId: formData.coordinatorId || undefined,
      duration: formData.duration.trim() || undefined,
      degreeType: formData.degreeType,
      description: formData.description.trim() || undefined,
      status: formData.status
    };

    try {
      await onSubmit(programData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                {program ? 'Edit Program' : 'Add New Program'}
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
                  <FormField id="name" label="Program Name" error={errors.name}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter program name"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>

                  <FormField id="code" label="Program Code" error={errors.code}>
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="PROG"
                      className="uppercase"
                      disabled={isLoading}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="departmentId" label="Department" error={errors.departmentId}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="departmentId"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(department => (
                          <option key={department._id} value={department._id}>
                            {department.name} ({department.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>

                  <FormField id="degreeType" label="Degree Type" error={errors.degreeType}>
                    <select
                      id="degreeType"
                      name="degreeType"
                      value={formData.degreeType}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="Doctoral">Doctoral</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="coordinatorId" label="Program Coordinator" error={errors.coordinatorId}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="coordinatorId"
                        name="coordinatorId"
                        value={formData.coordinatorId}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select Coordinator (Optional)</option>
                        {coordinators.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>

                  <FormField id="duration" label="Duration" error={errors.duration}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="duration"
                        name="duration"
                        type="text"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="e.g., 4 years, 2 semesters"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>

                <FormField id="description" label="Description" error={errors.description}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start pt-3 pl-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-10"
                      placeholder="Enter program description"
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
                    <option value="archived">Archived</option>
                  </select>
                </FormField>
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
              {program ? 'Update Program' : 'Create Program'}
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

export default ProgramFormModal;