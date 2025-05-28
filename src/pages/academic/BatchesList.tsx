// src/pages/academic/BatchesList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BatchFormModal from '../../components/modals/BatchFormModal';
import { Users, Plus, Search, Edit, Trash2, GraduationCap, User, GitBranch, RefreshCw, Clock, Target } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { batchesApi, programsApi, branchesApi, Batch, Program, Branch } from '../../utils/academicApi';

const BatchesList = () => {
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
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
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateBatch = hasPermission('batches.create');
  const canUpdateBatch = hasPermission('batches.update');
  const canDeleteBatch = hasPermission('batches.delete');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchesData, programsData, branchesData] = await Promise.all([
        batchesApi.getAll(),
        programsApi.getAll(),
        branchesApi.getAll()
      ]);
      setBatches(batchesData);
      setPrograms(programsData);
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.programName && batch.programName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.branchName && batch.branchName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.mentorName && batch.mentorName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProgram = !programFilter || batch.programId === programFilter;
    const matchesBranch = !branchFilter || batch.branchId === branchFilter;
    const matchesStatus = !statusFilter || batch.status === statusFilter;
    
    return matchesSearch && matchesProgram && matchesBranch && matchesStatus;
  });

  const handleAddBatch = () => {
    setEditingBatch(null);
    setIsModalOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBatch(null);
  };

  const handleSubmitBatch = async (batchData: Partial<Batch>) => {
    try {
      setModalLoading(true);
      
      if (editingBatch) {
        const updatedBatch = await batchesApi.update(editingBatch._id, batchData);
        setBatches(batches => 
          batches.map(batch => batch._id === editingBatch._id ? updatedBatch : batch)
        );
      } else {
        const newBatch = await batchesApi.create(batchData);
        setBatches(batches => [newBatch, ...batches]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingBatch ? 'update' : 'create'} batch: ` + err.message);
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
      await batchesApi.delete(id);
      setBatches(batches => batches.filter(batch => batch._id !== id));
    } catch (err: any) {
      alert('Failed to delete batch: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'graduated': return 'bg-purple-100 text-purple-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Batches</h1>
            <p className="mt-1 text-gray-500">Manage student batch groups</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Student Batches</h1>
            <p className="mt-1 text-gray-500">Manage student batch groups</p>
          </div>
          <Button onClick={loadData} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Batches</h3>
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
            <h1 className="text-2xl font-bold text-gray-900">Student Batches</h1>
            <p className="mt-1 text-gray-500">Manage student batch groups</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateBatch && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddBatch}
              >
                Add Batch
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
              placeholder="Search batches..."
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
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="graduated">Graduated</option>
              <option value="archived">Archived</option>
            </select>

            <span className="text-sm text-gray-500">
              {filteredBatches.length} batches
            </span>
          </div>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map(batch => (
            <Card key={batch._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 line-clamp-2">
                      <Users className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      {batch.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {batch.programName} • {batch.startYear} - {batch.endYear}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(batch.status)}`}>
                    {batch.status}
                  </span>
                  {batch.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
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
                    <span className="font-medium text-right">{batch.programName}</span>
                  </div>
                  
                  {batch.branchName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <GitBranch className="h-4 w-4" />
                        Branch:
                      </span>
                      <span className="font-medium text-right">{batch.branchName}</span>
                    </div>
                  )}
                  
                  {batch.mentorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Mentor:
                      </span>
                      <span className="font-medium text-right">{batch.mentorName}</span>
                    </div>
                  )}

                  {/* Student Capacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Students:
                      </span>
                      <span className="font-medium">
                        {batch.currentStudents} / {batch.maxStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          calculateProgress(batch.currentStudents, batch.maxStudents) >= 90 
                            ? 'bg-red-500' 
                            : calculateProgress(batch.currentStudents, batch.maxStudents) >= 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${calculateProgress(batch.currentStudents, batch.maxStudents)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {calculateProgress(batch.currentStudents, batch.maxStudents)}% filled
                      {batch.availableSeats !== undefined && (
                        <span className="ml-2">({batch.availableSeats} seats available)</span>
                      )}
                    </div>
                  </div>

                  {/* Duration and Current Year */}
                  {batch.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Duration:
                      </span>
                      <span className="font-medium">
                        {batch.duration} years
                        {batch.currentAcademicYear && (
                          <span className="text-gray-500 ml-1">
                            (Year {batch.currentAcademicYear})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {batch.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{batch.description}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(batch.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateBatch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditBatch(batch)}
                        title="Edit batch"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteBatch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(batch._id, batch.name)}
                        title="Delete batch"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredBatches.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || programFilter || branchFilter || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating a new batch'}
                </p>
                {canCreateBatch && !searchTerm && !programFilter && !branchFilter && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddBatch}
                    >
                      Add Batch
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Form Modal */}
      <BatchFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBatch}
        batch={editingBatch}
        isLoading={modalLoading}
      />
    </>
  );
};

export default BatchesList;