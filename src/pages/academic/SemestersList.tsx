// src/pages/academic/SemestersList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SemesterFormModal from '../../components/modals/SemesterFormModal';
import { Calendar, Plus, Search, Edit, Trash2, BookOpen, RefreshCw, CheckCircle, Clock, AlertCircle, Archive } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { semestersApi, academicYearsApi, regulationsApi, Semester, AcademicYear, Regulation } from '../../utils/academicApi';

const SemestersList = () => {
  const { hasPermission } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [regulationFilter, setRegulationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateSemester = hasPermission('semesters.create');
  const canUpdateSemester = hasPermission('semesters.update');
  const canDeleteSemester = hasPermission('semesters.delete');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [semestersData, academicYearsData, regulationsData] = await Promise.all([
        semestersApi.getAll(),
        academicYearsApi.getAll(),
        regulationsApi.getAll()
      ]);
      setSemesters(semestersData);
      setAcademicYears(academicYearsData);
      setRegulations(regulationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter semesters
  const filteredSemesters = semesters.filter(semester => {
    const matchesSearch = 
      semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (semester.academicYearName && semester.academicYearName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (semester.regulationName && semester.regulationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (semester.programName && semester.programName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAcademicYear = !academicYearFilter || semester.academicYearId === academicYearFilter;
    const matchesRegulation = !regulationFilter || semester.regulationId === regulationFilter;
    const matchesStatus = !statusFilter || semester.status === statusFilter;
    
    return matchesSearch && matchesAcademicYear && matchesRegulation && matchesStatus;
  });

  const handleAddSemester = () => {
    setEditingSemester(null);
    setIsModalOpen(true);
  };

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
  };

  const handleSubmitSemester = async (semesterData: Partial<Semester>) => {
    try {
      setModalLoading(true);
      
      if (editingSemester) {
        const updatedSemester = await semestersApi.update(editingSemester._id, semesterData);
        setSemesters(semesters => 
          semesters.map(semester => semester._id === editingSemester._id ? updatedSemester : semester)
        );
      } else {
        const newSemester = await semestersApi.create(semesterData);
        setSemesters(semesters => [newSemester, ...semesters]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingSemester ? 'update' : 'create'} semester: ` + err.message);
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
      await semestersApi.delete(id);
      setSemesters(semesters => semesters.filter(semester => semester._id !== id));
    } catch (err: any) {
      alert('Failed to delete semester: ' + err.message);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string, name: string) => {
    if (!window.confirm(`Change status of "${name}" to ${newStatus}?`)) {
      return;
    }

    try {
      const updatedSemester = await semestersApi.updateStatus(id, newStatus);
      setSemesters(semesters => 
        semesters.map(semester => semester._id === id ? updatedSemester : semester)
      );
    } catch (err: any) {
      alert('Failed to update semester status: ' + err.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'registration_open': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'ongoing': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exam_period': return <BookOpen className="h-4 w-4 text-purple-600" />;
      case 'completed': return <Archive className="h-4 w-4 text-gray-600" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'registration_open': return 'bg-orange-100 text-orange-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'exam_period': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDateInFuture = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const isDateInPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Semesters</h1>
            <p className="mt-1 text-gray-500">Manage semester schedules and timelines</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Semesters</h1>
            <p className="mt-1 text-gray-500">Manage semester schedules and timelines</p>
          </div>
          <Button onClick={loadData} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-red-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Semesters</h3>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Semesters</h1>
            <p className="mt-1 text-gray-500">Manage semester schedules and timelines</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateSemester && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddSemester}
              >
                Add Semester
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
              placeholder="Search semesters..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name}
                </option>
              ))}
            </select>

            <select
              value={regulationFilter}
              onChange={(e) => setRegulationFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Regulations</option>
              {regulations.map(regulation => (
                <option key={regulation._id} value={regulation._id}>
                  {regulation.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="exam_period">Exam Period</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <span className="text-sm text-gray-500">
              {filteredSemesters.length} semesters
            </span>
          </div>
        </div>

        {/* Semesters Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSemesters.map(semester => (
            <Card key={semester._id} className={`overflow-hidden hover:shadow-lg transition-shadow ${semester.isActive ? 'ring-2 ring-green-200' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 line-clamp-2">
                      <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      {semester.name}
                      {semester.isActive && <CheckCircle className="h-4 w-4 text-green-500 fill-current" />}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Semester {semester.semesterNumber} • {semester.academicYearName}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(semester.status)}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(semester.status)}`}>
                      {semester.status.replace('_', ' ')}
                    </span>
                  </div>
                  {semester.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium text-right">
                      {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Regulation:
                    </span>
                    <span className="font-medium text-right text-xs">{semester.regulationName}</span>
                  </div>
                  
                  {semester.programName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Program:</span>
                      <span className="font-medium text-right text-xs">{semester.programName}</span>
                    </div>
                  )}

                  {/* Important Dates */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {semester.registrationStartDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Registration:</span>
                        <span className={`font-medium text-xs ${
                          isDateInPast(semester.registrationEndDate || semester.registrationStartDate) 
                            ? 'text-gray-500' 
                            : 'text-orange-600'
                        }`}>
                          {formatDate(semester.registrationStartDate)}
                          {semester.registrationEndDate && ` - ${formatDate(semester.registrationEndDate)}`}
                        </span>
                      </div>
                    )}

                    {semester.examStartDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Exams:</span>
                        <span className={`font-medium text-xs ${
                          isDateInFuture(semester.examStartDate) 
                            ? 'text-purple-600' 
                            : 'text-gray-500'
                        }`}>
                          {formatDate(semester.examStartDate)}
                          {semester.examEndDate && ` - ${formatDate(semester.examEndDate)}`}
                        </span>
                      </div>
                    )}

                    {semester.resultPublishDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Results:</span>
                        <span className={`font-medium text-xs ${
                          isDateInFuture(semester.resultPublishDate) 
                            ? 'text-blue-600' 
                            : 'text-green-600'
                        }`}>
                          {formatDate(semester.resultPublishDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {semester.isActive && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Currently Active Semester
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(semester.dateUpdated)}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateSemester && semester.status !== 'archived' && (
                      <div className="flex space-x-1">
                        {semester.status === 'upcoming' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-orange-600 hover:bg-orange-50"
                            onClick={() => handleStatusUpdate(semester._id, 'registration_open', semester.name)}
                            title="Open Registration"
                          >
                            Open Reg
                          </Button>
                        )}
                        
                        {semester.status === 'registration_open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-green-600 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(semester._id, 'ongoing', semester.name)}
                            title="Start Semester"
                          >
                            Start
                          </Button>
                        )}
                        
                        {semester.status === 'ongoing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-purple-600 hover:bg-purple-50"
                            onClick={() => handleStatusUpdate(semester._id, 'exam_period', semester.name)}
                            title="Start Exams"
                          >
                            Exams
                          </Button>
                        )}
                        
                        {semester.status === 'exam_period' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-gray-600 hover:bg-gray-50"
                            onClick={() => handleStatusUpdate(semester._id, 'completed', semester.name)}
                            title="Complete Semester"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {canUpdateSemester && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditSemester(semester)}
                        title="Edit semester"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteSemester && semester.status !== 'ongoing' && semester.status !== 'exam_period' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(semester._id, semester.name)}
                        title="Delete semester"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredSemesters.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No semesters found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || academicYearFilter || regulationFilter || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating a new semester'}
                </p>
                {canCreateSemester && !searchTerm && !academicYearFilter && !regulationFilter && !statusFilter && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddSemester}
                    >
                      Add Semester
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester Form Modal */}
      <SemesterFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitSemester}
        semester={editingSemester}
        isLoading={modalLoading}
      />
    </>
  );
};

export default SemestersList;