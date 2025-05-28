// src/components/modals/AcademicYearFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, FileText, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { AcademicYear } from '../../utils/academicApi';

interface AcademicYearFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (yearData: Partial<AcademicYear>) => Promise<void>;
  academicYear?: AcademicYear | null;
  isLoading?: boolean;
}

const AcademicYearFormModal = ({ isOpen, onClose, onSubmit, academicYear, isLoading }: AcademicYearFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
    description: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed' | 'archived'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or academic year changes
  useEffect(() => {
    if (isOpen) {
      if (academicYear) {
        // Edit mode
        setFormData({
          name: academicYear.name || '',
          code: academicYear.code || '',
          startYear: academicYear.startYear || new Date().getFullYear(),
          endYear: academicYear.endYear || new Date().getFullYear() + 1,
          startDate: academicYear.startDate ? academicYear.startDate.split('T')[0] : '',
          endDate: academicYear.endDate ? academicYear.endDate.split('T')[0] : '',
          description: academicYear.description || '',
          status: academicYear.status || 'upcoming'
        });
      } else {
        // Create mode - set default values
        const currentYear = new Date().getFullYear();
        setFormData({
          name: `${currentYear}-${currentYear + 1}`,
          code: `AY${currentYear}-${String(currentYear + 1).slice(-2)}`,
          startYear: currentYear,
          endYear: currentYear + 1,
          startDate: `${currentYear}-06-01`, // Default to June 1st
          endDate: `${currentYear + 1}-05-31`, // Default to May 31st next year
          description: '',
          status: 'upcoming'
        });
      }
      setErrors({});
    }
  }, [isOpen, academicYear]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'startYear' || name === 'endYear' ? parseInt(value) || 0 : value
    }));
    
    // Auto-generate name and code when years change
    if (name === 'startYear' || name === 'endYear') {
      const startYear = name === 'startYear' ? parseInt(value) || 0 : formData.startYear;
      const endYear = name === 'endYear' ? parseInt(value) || 0 : formData.endYear;
      
      if (startYear && endYear && endYear > startYear) {
        setFormData(prev => ({
          ...prev,
          [name]: parseInt(value) || 0,
          name: `${startYear}-${endYear}`,
          code: `AY${startYear}-${String(endYear).slice(-2)}`
        }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Academic year name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Academic year code is required';
    }

    if (!formData.startYear || formData.startYear < 2000) {
      newErrors.startYear = 'Valid start year is required';
    }

    if (!formData.endYear || formData.endYear < 2000) {
      newErrors.endYear = 'Valid end year is required';
    }

    if (formData.endYear <= formData.startYear) {
      newErrors.endYear = 'End year must be after start year';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const yearData: Partial<AcademicYear> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      startYear: formData.startYear,
      endYear: formData.endYear,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description.trim() || undefined,
      status: formData.status
    };

    try {
      await onSubmit(yearData);
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
                <Calendar className="h-5 w-5 text-indigo-600" />
                {academicYear ? 'Edit Academic Year' : 'Add New Academic Year'}
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
                <FormField id="startYear" label="Start Year" error={errors.startYear}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="startYear"
                      name="startYear"
                      type="number"
                      value={formData.startYear}
                      onChange={handleInputChange}
                      className="pl-10"
                      min="2000"
                      max="2100"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                <FormField id="endYear" label="End Year" error={errors.endYear}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="endYear"
                      name="endYear"
                      type="number"
                      value={formData.endYear}
                      onChange={handleInputChange}
                      className="pl-10"
                      min="2000"
                      max="2100"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField id="name" label="Academic Year Name" error={errors.name}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="e.g., 2024-2025"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                <FormField id="code" label="Academic Year Code" error={errors.code}>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="AY2024-25"
                    className="uppercase"
                    disabled={isLoading}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField id="startDate" label="Start Date" error={errors.startDate}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                <FormField id="endDate" label="End Date" error={errors.endDate}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>
              </div>

              <FormField id="status" label="Status" error={errors.status}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </FormField>

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
                    placeholder="Optional description for this academic year"
                    disabled={isLoading}
                  />
                </div>
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
              {academicYear ? 'Update Academic Year' : 'Create Academic Year'}
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

export default AcademicYearFormModal;