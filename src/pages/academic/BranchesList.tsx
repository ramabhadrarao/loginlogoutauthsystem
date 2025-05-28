// src/pages/academic/BranchesList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BranchFormModal from '../../components/modals/BranchFormModal';
import { GitBranch, Plus, Search, Edit, Trash2, User, GraduationCap, RefreshCw } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { branchesApi, programsApi, Branch, Program } from '../../utils/academicApi';

const BranchesList = () => {
  const { hasPermission } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateBranch = hasPermission('branches.create');
  const canUpdateBranch = hasPermission('branches.update');
  const canDeleteBranch = hasPermission('branches.delete');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [branchesData, programsData] = await Promise.all([
        branchesApi.getAll(),
        programsApi.getAll()
      ]);
      setBranches(branchesData);
      setPrograms(programsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter branches
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.programName && branch.programName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProgram = !programFilter || branch.programId === programFilter;
    const matchesStatus = !statusFilter || branch.status === statusFilter;
    
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const handleAddBranch = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleSubmitBranch = async (branchData: Partial<Branch>) => {
    try {
      setModalLoading(true);
      
      if (editingBranch) {
        const updatedBranch = await branchesApi.update(editingBranch._id, branchData);
        setBranches(branches => 
          branches.map(branch => branch._id === editingBranch._id ? updatedBranch : branch)
        );
      } else {
        const newBranch = await branchesApi.create(branchData);
        setBranches(branches => [newBranch, ...branches]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingBranch ? 'update' : 'create'} branch: ` + err.message);
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
      await branchesApi.delete(id);
      setBranches(branches => branches.filter(branch => branch._id !== id));
    } catch (err: any) {
      alert('Failed to delete branch: ' + err.message);
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
            <h1 className="text-2xl font-bold text-gray-900">Program Branches</h1>
            <p className="mt-1 text-gray-500">Manage program specializations</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Program Branches</h1>
            <p className="mt-1 text-gray-500">Manage program specializations</p>
          </div>
          <Button onClick={loadData} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <GitBranch className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Branches</h3>
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
            <h1 className="text-2xl font-bold text-gray-900">Program Branches</h1>
            <p className="mt-1 text-gray-500">Manage program specializations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateBranch && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddBranch}
              >
                Add Branch
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
              placeholder="Search branches..."
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
              {filteredBranches.length} branches
            </span>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map(branch => (
            <Card key={branch._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 line-clamp-2">
                      <GitBranch className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      {branch.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {branch.code} • {branch.programName}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(branch.status)}`}>
                    {branch.status}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      Program:
                    </span>
                    <span className="font-medium text-right">{branch.programName}</span>
                  </div>
                  
                  {branch.departmentName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Department:</span>
                      <span className="font-medium text-right">{branch.departmentName}</span>
                    </div>
                  )}
                  
                  {branch.coordinatorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Coordinator:
                      </span>
                      <span className="font-medium text-right">{branch.coordinatorName}</span>
                    </div>
                  )}
                  
                  {branch.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{branch.description}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(branch.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateBranch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditBranch(branch)}
                        title="Edit branch"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteBranch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(branch._id, branch.name)}
                        title="Delete branch"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredBranches.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || programFilter || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating a new branch'}
                </p>
                {canCreateBranch && !searchTerm && !programFilter && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddBranch}
                    >
                      Add Branch
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBranch}
        branch={editingBranch}
        isLoading={modalLoading}
      />
    </>
  );
};

export default BranchesList;