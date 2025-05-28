import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Building, Plus, Search, Edit, Trash2, Link, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../utils/auth';

// Sample colleges data
const collegesData = [
  {
    _id: '1',
    name: 'Stanford University',
    code: 'STAN',
    logo: 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    website: 'https://stanford.edu',
    address: '450 Serra Mall, Stanford, CA 94305',
    phone: '(650) 723-2300',
    email: 'admission@stanford.edu',
    status: 'active',
    dateCreated: '2023-01-15T00:00:00.000Z',
    dateUpdated: '2023-04-10T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Massachusetts Institute of Technology',
    code: 'MIT',
    logo: 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    website: 'https://mit.edu',
    address: '77 Massachusetts Ave, Cambridge, MA 02139',
    phone: '(617) 253-1000',
    email: 'admission@mit.edu',
    status: 'active',
    dateCreated: '2023-01-16T00:00:00.000Z',
    dateUpdated: '2023-04-11T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'Harvard University',
    code: 'HARV',
    logo: 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    website: 'https://harvard.edu',
    address: 'Cambridge, MA 02138',
    phone: '(617) 495-1000',
    email: 'college@harvard.edu',
    status: 'active',
    dateCreated: '2023-01-17T00:00:00.000Z',
    dateUpdated: '2023-04-12T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'California Institute of Technology',
    code: 'CALTECH',
    logo: 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    website: 'https://caltech.edu',
    address: '1200 E California Blvd, Pasadena, CA 91125',
    phone: '(626) 395-6811',
    email: 'admission@caltech.edu',
    status: 'active',
    dateCreated: '2023-01-18T00:00:00.000Z',
    dateUpdated: '2023-04-13T00:00:00.000Z'
  }
];

const CollegesList = () => {
  const { hasPermission } = useAuth();
  const [colleges, setColleges] = useState(collegesData);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter colleges by search term
  const filteredColleges = colleges.filter(college => 
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCollege = hasPermission('colleges.create');
  const canUpdateCollege = hasPermission('colleges.update');
  const canDeleteCollege = hasPermission('colleges.delete');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
          <p className="mt-1 text-gray-500">
            Manage educational institutions
          </p>
        </div>
        {canCreateCollege && (
          <Button 
            icon={<Plus className="h-4 w-4" />}
          >
            Add College
          </Button>
        )}
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
                {college.address}
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
                      className="text-indigo-600 hover:text-indigo-800"
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
                      className="text-gray-700 hover:text-gray-900"
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
                  Last updated: {new Date(college.dateUpdated).toLocaleDateString()}
                </span>
                
                <div className="flex space-x-2">
                  {canUpdateCollege && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      icon={<Edit className="h-4 w-4 text-gray-500" />}
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
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {filteredColleges.length === 0 && (
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