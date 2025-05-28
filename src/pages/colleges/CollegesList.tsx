// src/pages/colleges/CollegesList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Building, Plus, Search, Edit, Trash2, Link, Mail, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { collegesApi } from '../../utils/api';
import { College } from '../../types';

const CollegesList = () => {
  const { hasPermission } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateCollege = hasPermission('colleges.create');
  const canUpdateCollege = hasPermission('colleges.update');
  const canDeleteCollege = hasPermission('colleges.delete');

  // Load colleges from API
  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collegesApi.getAll();
      setColleges(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load colleges');
      console.error('Load colleges error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter colleges by search term
  const filteredColleges = colleges.filter(college => 
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (college.email && college.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await collegesApi.delete(id);
      setColleges(colleges.filter(college => college._id !== id));
    } catch (err: any) {
      alert('Failed to delete college: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
            <p className="mt-1 text-gray-500">Manage educational institutions</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
            <p className="mt-1 text-gray-500">Manage educational institutions</p>
          </div>
          <Button 
            onClick={loadColleges}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <Building className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Colleges</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadColleges} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
          <p className="mt-1 text-gray-500">
            Manage educational institutions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={loadColleges}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          {canCreateCollege && (
            <Button 
              icon={<Plus className="h-4 w-4" />}
            >
              Add College
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search colleges..."
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredColleges.length} {filteredColleges.length === 1 ? 'college' : 'colleges'} found
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredColleges.map(college => (
          <Card key={college._id} className="overflow-hidden">
            <div className="relative h-40">
              <img 
                src={college.logo || 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                alt={college.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                <div className="absolute bottom-0 p-4">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-900">
                    {college.code}
                  </span>
                </div>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="line-clamp-1 text-lg">{college.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {college.address || 'No address provided'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2 pt-0">
              <div className="space-y-2 text-sm">
                {college.website && (
                  <div className="flex items-center space-x-2">
                    <Link className="h-4 w-4 text-gray-400" />
                    <a 
                      href={college.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 truncate"
                    >
                      {college.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                {college.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`mailto:${college.email}`}
                      className="text-gray-700 hover:text-gray-900 truncate"
                    >
                      {college.email}
                    </a>
                  </div>
                )}
                
                {college.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`tel:${college.phone}`}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      {college.phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-gray-50 pt-4">
              <div className="flex w-full justify-between">
                <span className="text-xs text-gray-500">
                  Updated: {new Date(college.dateUpdated).toLocaleDateString()}
                </span>
                
                <div className="flex space-x-2">
                  {canUpdateCollege && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      icon={<Edit className="h-4 w-4 text-gray-500" />}
                      title="Edit college"
                    >
                      <span className="sr-only">Edit</span>
                    </Button>
                  )}
                  
                  {canDeleteCollege && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => handleDelete(college._id, college.name)}
                      title="Delete college"
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {filteredColleges.length === 0 && !loading && (
          <div className="col-span-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
            <div className="text-center">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No colleges found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try a different search term' : 'Get started by creating a new college'}
              </p>
              {canCreateCollege && !searchTerm && (
                <div className="mt-6">
                  <Button 
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add College
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegesList;