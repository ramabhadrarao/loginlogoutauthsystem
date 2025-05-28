// src/components/modals/RegulationFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, BookOpen, GraduationCap, GitBranch, Calendar, FileText, Hash } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { Regulation, programsApi, branchesApi, Program, Branch } from '../../utils/academicApi';

interface RegulationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (regulationData: Partial<Regulation>) => Promise<void>;
  regulation?: Regulation | null;
  isLoading?: boolean;
}

const RegulationFormModal = ({ isOpen, onClose, onSubmit, regulation, isLoading }: RegulationFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    programId: '',
    branchId: '',
    effectiveFromYear: new Date().getFullYear(),
    effectiveToYear: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'archived'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load programs and branches when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Filter branches by selected program
  useEffect(() => {
    if (formData.programId) {
      const programBranches = branches.filter(branch => branch.programId === formData.programId);
      setFilteredBranches(programBranches);
      
      // Clear branch selection if current branch doesn't belong to selected program
      if (formData.branchId && !programBranches.some(b => b._id === formData.branchId)) {
        setFormData(prev => ({ ...prev, branchId: '' }));
      }
    } else {
      setFilteredBranches([]);
      setFormData(prev => ({ ...prev, branchId: '' }));
    }
  }, [formData.programId, branches]);

  // Reset form when modal opens/closes or regulation changes
  useEffect(() => {
    if (isOpen) {
      if (regulation) {
        // Edit mode
        setFormData({
          name: regulation.name || '',
          code: regulation.code || '',
          programId: regulation.programId || '',
          branchId: regulation.branchId || '',
          effectiveFromYear: regulation.effectiveFromYear || new Date().getFullYear(),
          effectiveToYear: regulation.effectiveToYear?.toString() || '',
          description: regulation.description || '',
          status: regulation.status || 'active'
        });
      } else {
        // Create mode
        const currentYear = new Date().getFullYear();
        setFormData({
          name: '',
          code: '',
          programId: '',
          branchId: '',
          effectiveFromYear: currentYear,
          effectiveToYear: '',
          description: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, regulation]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [programsData, branchesData] = await Promise.all([
        programsApi.getAll(),
        branchesApi.getAll()
      ]);
      setPrograms(programsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'effectiveFromYear' || name === 'effectiveToYear') {
      const numValue = value ? parseInt(value) : (name === 'effectiveFromYear' ? new Date().getFullYear() : '');
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Auto-generate code and name based on program and year
    if (name === 'programId' || name === 'effectiveFromYear') {
      const program = programs.find(p => p._id === (name === 'programId' ? value : formData.programId));
      const year = name === 'effectiveFromYear' ? (value ? parseInt(value) : new Date().getFullYear()) : formData.effectiveFromYear;
      
      if (program && year && !regulation) {
        setFormData(prev => ({
          ...prev,
          name: `${program.name} Regulation ${year}`,
          code: `${program.code}-REG-${year}`
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
      newErrors.name = 'Regulation name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Regulation code is required';
    }

    if (!formData.programId) {
      newErrors.programId = 'Program selection is required';
    }

    if (!formData.effectiveFromYear || formData.effectiveFromYear < 2000) {
      newErrors.effectiveFromYear = 'Valid effective from year is required';
    }

    if (formData.effectiveToYear && typeof formData.effectiveToYear === 'number' && formData.effectiveToYear <= formData.effectiveFromYear) {
      newErrors.effectiveToYear = 'Effective to year must be after effective from year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const regulationData: Partial<Regulation> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      programId: formData.programId,
      branchId: formData.branchId || undefined,
      effectiveFromYear: formData.effectiveFromYear,
      effectiveToYear: formData.effectiveToYear ? parseInt(formData.effectiveToYear.toString()) : undefined,
      description: formData.description.trim() || undefined,
      status: formData.status
    };

    try {
      await onSubmit(regulationData);
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
                <BookOpen className="h-5 w-5 text-indigo-600" />
                {regulation ? 'Edit Regulation' : 'Add New Regulation'}
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
                  <FormField id="programId" label="Program" error={errors.programId}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="programId"
                        name="programId"
                        value={formData.programId}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select Program</option>
                        {programs.map(program => (
                          <option key={program._id} value={program._id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>

                  <FormField id="branchId" label="Branch (Optional)" error={errors.branchId}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <GitBranch className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        id="branchId"
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleInputChange}
                        disabled={isLoading || !formData.programId}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">All Branches</option>
                        {filteredBranches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} ({branch.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="effectiveFromYear" label="Effective From Year" error={errors.effectiveFromYear}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="effectiveFromYear"
                        name="effectiveFromYear"
                        type="number"
                        value={formData.effectiveFromYear}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="2000"
                        max="2100"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>

                  <FormField id="effectiveToYear" label="Effective To Year (Optional)" error={errors.effectiveToYear}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="effectiveToYear"
                        name="effectiveToYear"
                        type="number"
                        value={formData.effectiveToYear}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="2000"
                        max="2100"
                        placeholder="Leave empty for ongoing"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="name" label="Regulation Name" error={errors.name}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="e.g., Computer Science Regulation 2023"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>

                  <FormField id="code" label="Regulation Code" error={errors.code}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Hash className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="pl-10 uppercase"
                        placeholder="CS-REG-2023"
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
                      placeholder="Enter regulation description"
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
              {regulation ? 'Update Regulation' : 'Create Regulation'}
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

export default RegulationFormModal;