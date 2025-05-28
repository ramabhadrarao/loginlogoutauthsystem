// src/pages/departments/DepartmentsList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DepartmentFormModal from '../../components/modals/DepartmentFormModal';
import { Building2, Plus, Search, Edit, Trash2, Mail, Phone, Calendar, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { departmentsApi, collegesApi } from '../../utils/api';
import { Department, College } from '../../types';

const DepartmentsList = () => {
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const canCreateDepartment = hasPermission('departments.create');
  const canUpdateDepartment = hasPermission('departments.update');
  const canDeleteDepartment = hasPermission('departments.delete');

  // Load departments and colleges
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [departmentsData, collegesData] = await Promise.all([
        departmentsApi.getAll(),
        collegesApi.getAll()
      ]);
      setDepartments(departmentsData);
      setColleges(collegesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter departments
  const filteredDepartments = departments.filter(department => {
    const matchesSearch = 
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.email && department.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (department.collegeName && department.collegeName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCollege = !selectedCollege || department.collegeId === selectedCollege;
    
    return matchesSearch && matchesCollege;
  });

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSubmitDepartment = async (departmentData: Partial<Department>) => {
    try {
      setModalLoading(true);
      
      if (editingDepartment) {
        // Update existing department
        const updatedDepartment = await departmentsApi.update(editingDepartment._id, departmentData);
        setDepartments(departments.map(dept => 
          dept._id === editingDepartment._id ? updatedDepartment : dept
        ));
      } else {
        // Create new department
        const newDepartment = await departmentsApi.create(departmentData);
        setDepartments([newDepartment, ...departments]);
      }
      
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingDepartment ? 'update' : 'create'} department: ` + err.message);
      throw err; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await departmentsApi.delete(id);
      setDepartments(departments.filter(dept => dept._id !== id));
    } catch (err: any) {
      alert('Failed to delete department: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="mt-1 text-gray-500">Manage academic departments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="mt-1 text-gray-500">Manage academic departments</p>
          </div>
          <Button 
            onClick={loadData}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <Building2 className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Departments</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadData} variant="outline">
                Try Again
              </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="mt-1 text-gray-500">
              Manage academic departments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={loadData}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            {canCreateDepartment && (
              <Button 
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddDepartment}
              >
                Add Department
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
              placeholder="Search departments..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>

            <span className="text-sm text-gray-500">
              {filteredDepartments.length} {filteredDepartments.length === 1 ? 'department' : 'departments'}
            </span>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map(department => (
            <Card key={department._id} className="overflow-hidden">
              <div className="relative h-40">
                <img 
                  src={department.logo || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                  alt={department.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="absolute bottom-0 p-4">
                    <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-900">
                      {department.code}
                    </span>
                    <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      department.status === 'active' 
                        ? 'bg-green-100/90 text-green-800' 
                        : 'bg-red-100/90 text-red-800'
                    }`}>
                      {department.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-lg">{department.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {department.collegeName || 'Unknown College'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 pt-0">
                <div className="space-y-2 text-sm">
                  {department.description && (
                    <p className="text-gray-600 line-clamp-2">{department.description}</p>
                  )}
                  
                  {department.hodName && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">HOD: {department.hodName}</span>
                    </div>
                  )}
                  
                  {department.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`mailto:${department.email}`}
                        className="text-indigo-600 hover:text-indigo-800 truncate"
                      >
                        {department.email}
                      </a>
                    </div>
                  )}
                  
                  {department.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`tel:${department.phone}`}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        {department.phone}
                      </a>
                    </div>
                  )}

                  {department.establishedDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        Est. {new Date(department.establishedDate).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 pt-4">
                <div className="flex w-full justify-between">
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(department.dateUpdated).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canUpdateDepartment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        icon={<Edit className="h-4 w-4 text-gray-500" />}
                        onClick={() => handleEditDepartment(department)}
                        title="Edit department"
                      >
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {canDeleteDepartment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(department._id, department.name)}
                        title="Delete department"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredDepartments.length === 0 && !loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCollege ? 'Try adjusting your filters' : 'Get started by creating a new department'}
                </p>
                {canCreateDepartment && !searchTerm && !selectedCollege && (
                  <div className="mt-6">
                    <Button 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleAddDepartment}
                    >
                      Add Department
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDepartment}
        department={editingDepartment}
        isLoading={modalLoading}
      />
    </>
  );
};

export default DepartmentsList;