// src/pages/academic/RegulationsList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RegulationFormModal from '../../components/modals/RegulationFormModal';
import { BookOpen, Plus, Search, Edit, Trash2, GraduationCap, GitBranch, RefreshCw, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { regulationsApi, programsApi, branchesApi, Regulation, Program, Branch } from '../../utils/academicApi';

const RegulationsList = () => {
  const { hasPermission } = useAuth();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateRegulation = hasPermission('regulations.create');
  const canUpdateRegulation = hasPermission('regulations.update');
  const canDeleteRegulation = hasPermission('regulations.delete');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [regulationsData, programsData, branchesData] = await Promise.all([
        regulationsApi.getAll(),
        programsApi.getAll(),
        branchesApi.getAll()
      ]);
      setRegulations(regulationsData);
      setPrograms(programsData);
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter regulations
  const filteredRegulations = regulations.filter(regulation => {
    const matchesSearch = 
      regulation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regulation.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (regulation.programName && regulation.programName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProgram = !programFilter || regulation.programId === programFilter;
    const matchesBranch = !branchFilter || regulation.branchId === branchFilter;
    const matchesStatus = !statusFilter || regulation.status === statusFilter;
    
    return matchesSearch && matchesProgram && matchesBranch && matchesStatus;
  });

  const handleAddRegulation = () => {
    setEditingRegulation(null);
    setIsModalOpen(true);
  };

  const handleEditRegulation = (regulation: Regulation) => {
    setEditingRegulation(regulation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRegulation(null);
  };

  const handleSubmitRegulation = async (regulationData: Partial<Regulation>) => {
    try {
      setModalLoading(true);
      
      if (editingRegulation) {
        const updatedRegulation = await regulationsApi.update(editingRegulation._id, regulationData);
        setRegulations(regulations => 
          regulations.map(regulation => regulation._id === editingRegulation._id ? updatedRegulation : regulation)
        );
      } else {
        const newRegulation = await regulationsApi.create(regulationData);
        setRegulations(regulations => [newRegulation, ...regulations]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingRegulation ? 'update' : 'create'} regulation: ` + err.message);
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
      await regulationsApi.delete(id);
      setRegulations(regulations => regulations.filter(regulation => regulation._id !== id));
    } catch (err: any) {
      alert('Failed to delete regulation: ' + err.message);
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

  const isCurrentlyEffective = (regulation: Regulation) => {
    const currentYear = new Date().getFullYear();
    return regulation.effectiveFromYear <= currentYear && 
           (!regulation.effectiveToYear || regulation.effectiveToYear >= currentYear);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Regulations</h1>
            <p className="mt-1 text-gray-500">Manage academic rules and syllabus versions</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Regulations</h1>
            <p className="mt-1 text-gray-500">Manage academic rules and syllabus versions</p>
          </div>
          <Button onClick={loadData} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Regulations</h3>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Regulations</h1>
            <p className="mt-1 text-gray-500">Manage academic rules and syllabus versions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateRegulation && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddRegulation}
              >
                Add Regulation
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
              placeholder="Search regulations..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
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
              {filteredRegulations.length} regulations
            </span>
          </div>
        </div>

        {/* Regulations Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRegulations.map(regulation => (
            <Card key={regulation._id} className={`overflow-hidden hover:shadow-lg transition-shadow ${isCurrentlyEffective(regulation) ? 'ring-2 ring-green-200' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 line-clamp-2">
                      <BookOpen className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      {regulation.name}
                      {isCurrentlyEffective(regulation) && <CheckCircle className="h-4 w-4 text-green-500 fill-current" />}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {regulation.code} • {regulation.programName}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(regulation.status)}`}>
                    {regulation.status}
                  </span>
                  {isCurrentlyEffective(regulation) && (
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      Program:
                    </span>
                    <span className="font-medium text-right">{regulation.programName}</span>
                  </div>
                  
                  {regulation.branchName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <GitBranch className="h-4 w-4" />
                        Branch:
                      </span>
                      <span className="font-medium text-right">{regulation.branchName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Effective:
                    </span>
                    <span className="font-medium">
                      {regulation.effectiveFromYear}
                      {regulation.effectiveToYear && ` - ${regulation.effectiveToYear}`}
                    </span>
                  </div>
                  
                  {regulation.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{regulation.description}</p>
                  )}

                  {isCurrentlyEffective(regulation) && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Currently Effective
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(regulation.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateRegulation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditRegulation(regulation)}
                        title="Edit regulation"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteRegulation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(regulation._id, regulation.name)}
                        title="Delete regulation"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredRegulations.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No regulations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || programFilter || branchFilter || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating a new regulation'}
                </p>
                {canCreateRegulation && !searchTerm && !programFilter && !branchFilter && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddRegulation}
                    >
                      Add Regulation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regulation Form Modal */}
      <RegulationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRegulation}
        regulation={editingRegulation}
        isLoading={modalLoading}
      />
    </>
  );
};

export default RegulationsList;