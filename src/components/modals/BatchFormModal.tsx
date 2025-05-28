// src/components/modals/BatchFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Users, GraduationCap, GitBranch, User, Hash, FileText, Target, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { Batch, programsApi, branchesApi, Program, Branch } from '../../utils/academicApi';
import { usersApi, User as UserType } from '../../utils/api';

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (batchData: Partial<Batch>) => Promise<void>;
  batch?: Batch | null;
  isLoading?: boolean;
}

const BatchFormModal = ({ isOpen, onClose, onSubmit, batch, isLoading }: BatchFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    programId: '',
    branchId: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 4,
    mentorId: '',
    maxStudents: 60,
    currentStudents: 0,
    description: '',
    status: 'planned' as 'planned' | 'active' | 'graduated' | 'archived'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [mentors, setMentors] = useState<UserType[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load programs, branches and mentors when modal opens
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

  // Reset form when modal opens/closes or batch changes
  useEffect(() => {
    if (isOpen) {
      if (batch) {
        // Edit mode
        setFormData({
          name: batch.name || '',
          programId: batch.programId || '',
          branchId: batch.branchId || '',
          startYear: batch.startYear || new Date().getFullYear(),
          endYear: batch.endYear || new Date().getFullYear() + 4,
          mentorId: batch.mentorId || '',
          maxStudents: batch.maxStudents || 60,
          currentStudents: batch.currentStudents || 0,
          description: batch.description || '',
          status: batch.status || 'planned'
        });
      } else {
        // Create mode
        const currentYear = new Date().getFullYear();
        setFormData({
          name: '',
          programId: '',
          branchId: '',
          startYear: currentYear,
          endYear: currentYear + 4,
          mentorId: '',
          maxStudents: 60,
          currentStudents: 0,
          description: '',
          status: 'planned'
        });
      }
      setErrors({});
    }
  }, [isOpen, batch]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [programsData, branchesData, usersData] = await Promise.all([
        programsApi.getAll(),
        branchesApi.getAll(),
        usersApi.getAll()
      ]);
      setPrograms(programsData);
      setBranches(branchesData);
      setMentors(usersData); // All users can potentially be mentors
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'startYear' || name === 'endYear' || name === 'maxStudents' || name === 'currentStudents') {
      const numValue = value ? parseInt(value) : 0;
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
    
    // Auto-generate batch name based on program and year
    if (name === 'programId' || name === 'startYear') {
      const program = programs.find(p => p._id === (name === 'programId' ? value : formData.programId));
      const year = name === 'startYear' ? (value ? parseInt(value) : new Date().getFullYear()) : formData.startYear;
      
      if (program && year && !batch) {
        setFormData(prev => ({
          ...prev,
          name: `${program.code} Batch ${year}`
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
      newErrors.name = 'Batch name is required';
    }

    if (!formData.programId) {
      newErrors.programId = 'Program selection is required';
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

    if (formData.maxStudents < 1) {
      newErrors.maxStudents = 'Maximum students must be at least 1';
    }

    if (formData.currentStudents < 0) {
      newErrors.currentStudents = 'Current students cannot be negative';
    }

    if (formData.currentStudents > formData.maxStudents) {
      newErrors.currentStudents = 'Current students cannot exceed maximum capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const batchData: Partial<Batch> = {
      name: formData.name.trim(),
      programId: formData.programId,
      branchId: formData.branchId || undefined,
      startYear: formData.startYear,
      endYear: formData.endYear,
      mentorId: formData.mentorId || undefined,
      maxStudents: formData.maxStudents,
      currentStudents: formData.currentStudents,
      description: formData.description.trim() || undefined,
      status: formData.status
    };

    try {
      await onSubmit(batchData);
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
                <Users className="h-5 w-5 text-indigo-600" />
                {batch ? 'Edit Batch' : 'Add New Batch'}
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
                  <FormField id="startYear" label="Start Year" error={errors.startYear}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
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
                        <Calendar className="h-4 w-4 text-gray-400" />
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

                <FormField id="name" label="Batch Name" error={errors.name}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="e.g., CSE Batch 2024"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                <FormField id="mentorId" label="Batch Mentor" error={errors.mentorId}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      id="mentorId"
                      name="mentorId"
                      value={formData.mentorId}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Mentor (Optional)</option>
                      {mentors.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="maxStudents" label="Maximum Students" error={errors.maxStudents}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Target className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="maxStudents"
                        name="maxStudents"
                        type="number"
                        value={formData.maxStudents}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="1"
                        max="500"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>

                  <FormField id="currentStudents" label="Current Students" error={errors.currentStudents}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="currentStudents"
                        name="currentStudents"
                        type="number"
                        value={formData.currentStudents}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="0"
                        max={formData.maxStudents}
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>

                <FormField id="status" label="Status" error={errors.status}>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="graduated">Graduated</option>
                    <option value="archived">Archived</option>
                  </select>
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
                      placeholder="Optional description for this batch"
                      disabled={isLoading}
                    />
                  </div>
                </FormField>

                {/* Student Capacity Summary */}
                {formData.maxStudents > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">
                        {formData.currentStudents} / {formData.maxStudents} students
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          (formData.currentStudents / formData.maxStudents) * 100 >= 90 
                            ? 'bg-red-500' 
                            : (formData.currentStudents / formData.maxStudents) * 100 >= 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((formData.currentStudents / formData.maxStudents) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-center">
                      {Math.round((formData.currentStudents / formData.maxStudents) * 100)}% filled
                      {formData.maxStudents - formData.currentStudents > 0 && (
                        <span className="ml-2">
                          ({formData.maxStudents - formData.currentStudents} seats available)
                        </span>
                      )}
                    </div>
                  </div>
                )}
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
              {batch ? 'Update Batch' : 'Create Batch'}
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

export default BatchFormModal;