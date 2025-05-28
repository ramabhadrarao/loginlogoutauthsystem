// src/pages/academic/ProgramsList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgramFormModal from '../../components/modals/ProgramFormModal';
import { GraduationCap, Plus, Search, Edit, Trash2, User, Building2, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { programsApi, Program } from '../../utils/academicApi';
import { departmentsApi, Department } from '../../utils/api';

const ProgramsList = () => {
  const { hasPermission } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [degreeTypeFilter, setDegreeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateProgram = hasPermission('programs.create');
  const canUpdateProgram = hasPermission('programs.update');
  const canDeleteProgram = hasPermission('programs.delete');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [programsData, departmentsData] = await Promise.all([
        programsApi.getAll(),
        departmentsApi.getAll()
      ]);
      setPrograms(programsData);
      setDepartments(departmentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter programs
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.departmentName && program.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = !departmentFilter || program.departmentId === departmentFilter;
    const matchesDegreeType = !degreeTypeFilter || program.degreeType === degreeTypeFilter;
    const matchesStatus = !statusFilter || program.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesDegreeType && matchesStatus;
  });

  const handleAddProgram = () => {
    setEditingProgram(null);
    setIsModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
  };

  const handleSubmitProgram = async (programData: Partial<Program>) => {
    try {
      setModalLoading(true);
      
      if (editingProgram) {
        const updatedProgram = await programsApi.update(editingProgram._id, programData);
        setPrograms(programs => 
          programs.map(program => program._id === editingProgram._id ? updatedProgram : program)
        );
      } else {
        const newProgram = await programsApi.create(programData);
        setPrograms(programs => [newProgram, ...programs]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingProgram ? 'update' : 'create'} program: ` + err.message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await programsApi.delete(id);
      setPrograms(programs => programs.filter(program => program._id !== id));
    } catch (err: any) {
      alert('Failed to delete program: ' + err.message);
    }
  };

  const getDegreeTypeColor = (degreeType: string) => {
    switch (degreeType) {
      case "Bachelor's": return 'bg-blue-100 text-blue-800';
      case "Master's": return 'bg-purple-100 text-purple-800';
      case "Doctoral": return 'bg-red-100 text-red-800';
      case "Diploma": return 'bg-green-100 text-green-800';
      case "Certificate": return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
            <p className="mt-1 text-gray-500">Manage degree programs</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <div className="space-y-2">
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
            <p className="mt-1 text-gray-500">Manage degree programs</p>
          </div>
          <Button onClick={loadData} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Programs</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadData} variant="outline">Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Programs</h1>
            <p className="mt-1 text-gray-500">Manage degree programs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateProgram && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddProgram}
              >
                Add Program
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search programs..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={degreeTypeFilter}
              onChange={(e) => setDegreeTypeFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Degrees</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="Doctoral">Doctoral</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <span className="text-sm text-gray-500">
              {filteredPrograms.length} programs
            </span>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(program => (
            <Card key={program._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 line-clamp-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      {program.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {program.code} • {program.departmentName}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDegreeTypeColor(program.degreeType)}`}>
                    {program.degreeType}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(program.status)}`}>
                    {program.status}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Department:
                    </span>
                    <span className="font-medium text-right">{program.departmentName}</span>
                  </div>
                  
                  {program.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Duration:
                      </span>
                      <span className="font-medium">{program.duration}</span>
                    </div>
                  )}
                  
                  {program.coordinatorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Coordinator:
                      </span>
                      <span className="font-medium text-right">{program.coordinatorName}</span>
                    </div>
                  )}
                  
                  {program.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{program.description}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(program.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateProgram && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditProgram(program)}
                        title="Edit program"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteProgram && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(program._id, program.name)}
                        title="Delete program"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredPrograms.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No programs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || departmentFilter || degreeTypeFilter || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating a new program'}
                </p>
                {canCreateProgram && !searchTerm && !departmentFilter && !degreeTypeFilter && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddProgram}
                    >
                      Add Program
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Program Form Modal */}
      <ProgramFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProgram}
        program={editingProgram}
        isLoading={modalLoading}
      />
    </>
  );
};

export default ProgramsList;