// src/components/modals/SemesterFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Hash, FileText, Clock, Users, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import { Semester, academicYearsApi, regulationsApi, AcademicYear, Regulation } from '../../utils/academicApi';

interface SemesterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (semesterData: Partial<Semester>) => Promise<void>;
  semester?: Semester | null;
  isLoading?: boolean;
}

const SemesterFormModal = ({ isOpen, onClose, onSubmit, semester, isLoading }: SemesterFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    academicYearId: '',
    regulationId: '',
    semesterNumber: 1,
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    examStartDate: '',
    examEndDate: '',
    resultPublishDate: '',
    status: 'upcoming' as 'upcoming' | 'registration_open' | 'ongoing' | 'exam_period' | 'completed' | 'archived'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load academic years and regulations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or semester changes
  useEffect(() => {
    if (isOpen) {
      if (semester) {
        // Edit mode
        setFormData({
          name: semester.name || '',
          academicYearId: semester.academicYearId || '',
          regulationId: semester.regulationId || '',
          semesterNumber: semester.semesterNumber || 1,
          startDate: semester.startDate ? semester.startDate.split('T')[0] : '',
          endDate: semester.endDate ? semester.endDate.split('T')[0] : '',
          registrationStartDate: semester.registrationStartDate ? semester.registrationStartDate.split('T')[0] : '',
          registrationEndDate: semester.registrationEndDate ? semester.registrationEndDate.split('T')[0] : '',
          examStartDate: semester.examStartDate ? semester.examStartDate.split('T')[0] : '',
          examEndDate: semester.examEndDate ? semester.examEndDate.split('T')[0] : '',
          resultPublishDate: semester.resultPublishDate ? semester.resultPublishDate.split('T')[0] : '',
          status: semester.status || 'upcoming'
        });
      } else {
        // Create mode - set default values
        const today = new Date();
        const currentYear = today.getFullYear();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endOfSemester = new Date(today.getFullYear(), today.getMonth() + 6, 0);
        
        setFormData({
          name: '',
          academicYearId: '',
          regulationId: '',
          semesterNumber: 1,
          startDate: nextMonth.toISOString().split('T')[0],
          endDate: endOfSemester.toISOString().split('T')[0],
          registrationStartDate: '',
          registrationEndDate: '',
          examStartDate: '',
          examEndDate: '',
          resultPublishDate: '',
          status: 'upcoming'
        });
      }
      setErrors({});
    }
  }, [isOpen, semester]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [academicYearsData, regulationsData] = await Promise.all([
        academicYearsApi.getAll(),
        regulationsApi.getAll()
      ]);
      setAcademicYears(academicYearsData);
      setRegulations(regulationsData);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'semesterNumber') {
      const numValue = value ? parseInt(value) : 1;
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
    
    // Auto-generate semester name based on academic year and semester number
    if (name === 'academicYearId' || name === 'semesterNumber') {
      const academicYear = academicYears.find(year => 
        year._id === (name === 'academicYearId' ? value : formData.academicYearId)
      );
      const semNumber = name === 'semesterNumber' ? (value ? parseInt(value) : 1) : formData.semesterNumber;
      
      if (academicYear && semNumber && !semester) {
        setFormData(prev => ({
          ...prev,
          name: `${academicYear.name} - Semester ${semNumber}`
        }));
      }
    }
    
    // Auto-populate registration and exam dates based on semester duration
    if (name === 'startDate' || name === 'endDate') {
      const startDate = new Date(name === 'startDate' ? value : formData.startDate);
      const endDate = new Date(name === 'endDate' ? value : formData.endDate);
      
      if (startDate && endDate && endDate > startDate && !semester) {
        // Calculate registration period (2 weeks before semester starts)
        const regStart = new Date(startDate);
        regStart.setDate(regStart.getDate() - 14);
        const regEnd = new Date(startDate);
        regEnd.setDate(regEnd.getDate() - 1);
        
        // Calculate exam period (last 2 weeks of semester)
        const examStart = new Date(endDate);
        examStart.setDate(examStart.getDate() - 14);
        const examEnd = new Date(endDate);
        
        // Calculate result publish date (2 weeks after semester ends)
        const resultDate = new Date(endDate);
        resultDate.setDate(resultDate.getDate() + 14);
        
        setFormData(prev => ({
          ...prev,
          registrationStartDate: regStart.toISOString().split('T')[0],
          registrationEndDate: regEnd.toISOString().split('T')[0],
          examStartDate: examStart.toISOString().split('T')[0],
          examEndDate: examEnd.toISOString().split('T')[0],
          resultPublishDate: resultDate.toISOString().split('T')[0]
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
      newErrors.name = 'Semester name is required';
    }

    if (!formData.academicYearId) {
      newErrors.academicYearId = 'Academic year selection is required';
    }

    if (!formData.regulationId) {
      newErrors.regulationId = 'Regulation selection is required';
    }

    if (!formData.semesterNumber || formData.semesterNumber < 1 || formData.semesterNumber > 12) {
      newErrors.semesterNumber = 'Semester number must be between 1 and 12';
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

    // Validate registration dates
    if (formData.registrationStartDate && formData.registrationEndDate) {
      if (formData.registrationStartDate >= formData.registrationEndDate) {
        newErrors.registrationEndDate = 'Registration end date must be after start date';
      }
      if (formData.registrationEndDate >= formData.startDate) {
        newErrors.registrationEndDate = 'Registration must end before semester starts';
      }
    }

    // Validate exam dates
    if (formData.examStartDate && formData.examEndDate) {
      if (formData.examStartDate >= formData.examEndDate) {
        newErrors.examEndDate = 'Exam end date must be after start date';
      }
      if (formData.examStartDate <= formData.startDate) {
        newErrors.examStartDate = 'Exam period must be within semester duration';
      }
      if (formData.examEndDate > formData.endDate) {
        newErrors.examEndDate = 'Exam period must be within semester duration';
      }
    }

    // Validate result publish date
    if (formData.resultPublishDate && formData.endDate) {
      if (formData.resultPublishDate <= formData.endDate) {
        newErrors.resultPublishDate = 'Results should be published after semester ends';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const semesterData: Partial<Semester> = {
      name: formData.name.trim(),
      academicYearId: formData.academicYearId,
      regulationId: formData.regulationId,
      semesterNumber: formData.semesterNumber,
      startDate: formData.startDate,
      endDate: formData.endDate,
      registrationStartDate: formData.registrationStartDate || undefined,
      registrationEndDate: formData.registrationEndDate || undefined,
      examStartDate: formData.examStartDate || undefined,
      examEndDate: formData.examEndDate || undefined,
      resultPublishDate: formData.resultPublishDate || undefined,
      status: formData.status
    };

    try {
      await onSubmit(semesterData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                {semester ? 'Edit Semester' : 'Add New Semester'}
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="academicYearId" label="Academic Year" error={errors.academicYearId}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          id="academicYearId"
                          name="academicYearId"
                          value={formData.academicYearId}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select Academic Year</option>
                          {academicYears.map(year => (
                            <option key={year._id} value={year._id}>
                              {year.name} ({year.startYear}-{year.endYear})
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormField>

                    <FormField id="regulationId" label="Regulation" error={errors.regulationId}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          id="regulationId"
                          name="regulationId"
                          value={formData.regulationId}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select Regulation</option>
                          {regulations.map(regulation => (
                            <option key={regulation._id} value={regulation._id}>
                              {regulation.name} ({regulation.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="semesterNumber" label="Semester Number" error={errors.semesterNumber}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Hash className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="semesterNumber"
                          name="semesterNumber"
                          type="number"
                          value={formData.semesterNumber}
                          onChange={handleInputChange}
                          className="pl-10"
                          min="1"
                          max="12"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

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
                          <option value="registration_open">Registration Open</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="exam_period">Exam Period</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </FormField>
                  </div>

                  <FormField id="name" label="Semester Name" error={errors.name}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="e.g., 2024-2025 - Semester 1"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Semester Duration */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Semester Duration</h4>
                  
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
                </div>

                {/* Registration Period */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Registration Period (Optional)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="registrationStartDate" label="Registration Start Date" error={errors.registrationStartDate}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="registrationStartDate"
                          name="registrationStartDate"
                          type="date"
                          value={formData.registrationStartDate}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    <FormField id="registrationEndDate" label="Registration End Date" error={errors.registrationEndDate}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="registrationEndDate"
                          name="registrationEndDate"
                          type="date"
                          value={formData.registrationEndDate}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* Examination Period */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Examination Period (Optional)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="examStartDate" label="Exam Start Date" error={errors.examStartDate}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="examStartDate"
                          name="examStartDate"
                          type="date"
                          value={formData.examStartDate}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>

                    <FormField id="examEndDate" label="Exam End Date" error={errors.examEndDate}>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="examEndDate"
                          name="examEndDate"
                          type="date"
                          value={formData.examEndDate}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormField>
                  </div>

                  <FormField id="resultPublishDate" label="Result Publish Date" error={errors.resultPublishDate}>
                    <div className="relative max-w-md">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="resultPublishDate"
                        name="resultPublishDate"
                        type="date"
                        value={formData.resultPublishDate}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Helper Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Auto-calculated Dates
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>When you set the semester start and end dates, the system will automatically suggest:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Registration period: 2 weeks before semester starts</li>
                          <li>Exam period: Last 2 weeks of the semester</li>
                          <li>Result publication: 2 weeks after semester ends</li>
                        </ul>
                        <p className="mt-2">You can adjust these dates as needed.</p>
                      </div>
                    </div>
                  </div>
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
              {semester ? 'Update Semester' : 'Create Semester'}
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

export default SemesterFormModal;