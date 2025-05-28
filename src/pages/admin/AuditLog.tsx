import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Search, Filter, Calendar, Clock, User, Shield, ArrowUpDown } from 'lucide-react';

// Sample audit log data
const auditLogData = [
  {
    _id: '1',
    userId: 'user1',
    userName: 'John Doe',
    action: 'granted',
    permissionKey: 'users.create',
    changedBy: 'admin1',
    changedByName: 'Admin User',
    changedAt: '2023-04-15T10:30:00Z',
    reason: 'New role assignment'
  },
  {
    _id: '2',
    userId: 'user2',
    userName: 'Jane Smith',
    action: 'revoked',
    permissionKey: 'settings.update',
    changedBy: 'admin1',
    changedByName: 'Admin User',
    changedAt: '2023-04-14T16:45:00Z',
    reason: 'Role change'
  },
  {
    _id: '3',
    userId: 'user3',
    userName: 'Bob Johnson',
    action: 'granted',
    permissionKey: 'colleges.read',
    changedBy: 'admin2',
    changedByName: 'Super Admin',
    changedAt: '2023-04-14T09:15:00Z',
    reason: 'New hire onboarding'
  },
  {
    _id: '4',
    userId: 'user1',
    userName: 'John Doe',
    action: 'granted',
    permissionKey: 'users.read',
    changedBy: 'admin1',
    changedByName: 'Admin User',
    changedAt: '2023-04-13T14:20:00Z',
    reason: 'Role upgrade'
  },
  {
    _id: '5',
    userId: 'user4',
    userName: 'Alice Wilson',
    action: 'revoked',
    permissionKey: 'attachments.delete',
    changedBy: 'admin2',
    changedByName: 'Super Admin',
    changedAt: '2023-04-12T11:10:00Z',
    reason: 'Security review'
  }
];

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'granted', 'revoked'

  // Filter logs based on search term and filter
  const filteredLogs = auditLogData.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.permissionKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || log.action === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-gray-500">
          Track permission changes across the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Permission Change History</CardTitle>
              <CardDescription>
                Record of all permission grants and revocations
              </CardDescription>
            </div>

            <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search logs..."
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Changes</option>
                <option value="granted">Granted Only</option>
                <option value="revoked">Revoked Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>Date/Time</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>User</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>Action</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>Permission</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>Changed By</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="flex items-center">
                      <span>Reason</span>
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(log.changedAt).toLocaleDateString()}
                          </span>
                          <Clock className="ml-3 mr-2 h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(log.changedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {log.userName}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`
                          inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${log.action === 'granted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'}
                        `}>
                          {log.action === 'granted' ? 'Granted' : 'Revoked'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <Shield className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="font-mono text-gray-900">
                            {log.permissionKey}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {log.changedByName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.reason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No audit log entries found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;