// src/pages/academic/AcademicYearsList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AcademicYearFormModal from '../../components/modals/AcademicYearFormModal';
import { Calendar, Plus, Search, Edit, Trash2, Star, RefreshCw, CheckCircle, Clock, Archive } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { academicYearsApi, AcademicYear } from '../../utils/academicApi';

const AcademicYearsList = () => {
  const { hasPermission } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateYear = hasPermission('academic_years.create');
  const canUpdateYear = hasPermission('academic_years.update');
  const canDeleteYear = hasPermission('academic_years.delete');

  // Load academic years
  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicYearsApi.getAll();
      setAcademicYears(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load academic years');
      console.error('Load academic years error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter academic years
  const filteredYears = academicYears.filter(year => {
    const matchesSearch = 
      year.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      year.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || year.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddYear = () => {
    setEditingYear(null);
    setIsModalOpen(true);
  };

  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYear(null);
  };

  const handleSubmitYear = async (yearData: Partial<AcademicYear>) => {
    try {
      setModalLoading(true);
      
      if (editingYear) {
        const updatedYear = await academicYearsApi.update(editingYear._id, yearData);
        setAcademicYears(years => 
          years.map(year => year._id === editingYear._id ? updatedYear : year)
        );
      } else {
        const newYear = await academicYearsApi.create(yearData);
        setAcademicYears(years => [newYear, ...years]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingYear ? 'update' : 'create'} academic year: ` + err.message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleSetCurrent = async (id: string, name: string) => {
    if (!window.confirm(`Set "${name}" as the current academic year?`)) {
      return;
    }

    try {
      await academicYearsApi.setCurrent(id);
      await loadAcademicYears(); // Refresh to update current status
    } catch (err: any) {
      alert('Failed to set current academic year: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await academicYearsApi.delete(id);
      setAcademicYears(years => years.filter(year => year._id !== id));
    } catch (err: any) {
      alert('Failed to delete academic year: ' + err.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'upcoming': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed': return <Archive className="h-4 w-4 text-gray-600" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
            <p className="mt-1 text-gray-500">Manage academic calendar years</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
            <p className="mt-1 text-gray-500">Manage academic calendar years</p>
          </div>
          <Button onClick={loadAcademicYears} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Academic Years</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadAcademicYears} variant="outline">Try Again</Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
            <p className="mt-1 text-gray-500">Manage academic calendar years</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadAcademicYears}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateYear && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddYear}
              >
                Add Academic Year
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
              placeholder="Search academic years..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <span className="text-sm text-gray-500">
              {filteredYears.length} {filteredYears.length === 1 ? 'year' : 'years'}
            </span>
          </div>
        </div>

        {/* Academic Years Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredYears.map(year => (
            <Card key={year._id} className={`overflow-hidden ${year.isCurrent ? 'ring-2 ring-indigo-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    {year.name}
                    {year.isCurrent && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(year.status)}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(year.status)}`}>
                      {year.status}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  {year.code} • {year.startYear} - {year.endYear}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Start Date:</span>
                    <span className="font-medium">{new Date(year.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">End Date:</span>
                    <span className="font-medium">{new Date(year.endDate).toLocaleDateString()}</span>
                  </div>
                  {year.description && (
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{year.description}</p>
                  )}
                  {year.isCurrent && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-2 mt-2">
                      <p className="text-xs text-indigo-700 font-medium">
                        ✨ Current Academic Year
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(year.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateYear && !year.isCurrent && year.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50"
                        onClick={() => handleSetCurrent(year._id, year.name)}
                        title="Set as current"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canUpdateYear && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditYear(year)}
                        title="Edit academic year"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteYear && !year.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(year._id, year.name)}
                        title="Delete academic year"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredYears.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No academic years found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by creating a new academic year'}
                </p>
                {canCreateYear && !searchTerm && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddYear}
                    >
                      Add Academic Year
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Academic Year Form Modal */}
      <AcademicYearFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitYear}
        academicYear={editingYear}
        isLoading={modalLoading}
      />
    </>
  );
};

export default AcademicYearsList;