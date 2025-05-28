// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/layout/AppLayout';
import PermissionManagement from './pages/admin/PermissionManagement';
import ModelsManagement from './pages/admin/ModelsManagement';
import AuditLog from './pages/admin/AuditLog';
import UsersList from './pages/users/UsersList';
import CollegesList from './pages/colleges/CollegesList';
import DepartmentsList from './pages/departments/DepartmentsList'; // ADD THIS
import ABACManagement from './pages/admin/ABACManagement'; // ADD THIS IMPORT
// Academic imports
import AcademicYearsList from './pages/academic/AcademicYearsList';
import ProgramsList from './pages/academic/ProgramsList';
import BranchesList from './pages/academic/BranchesList';
import RegulationsList from './pages/academic/RegulationsList';
import BatchesList from './pages/academic/BatchesList';
import SemestersList from './pages/academic/SemestersList';

import AttachmentsList from './pages/attachments/AttachmentsList';
import SystemSettings from './pages/settings/SystemSettings';

// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission?: string;
}) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-indigo-600 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this resource.</p>
        <p className="mt-1 text-sm text-gray-500">Required permission: {requiredPermission}</p>
        <button
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes - Single Layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Single Dashboard for everyone */}
            <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard.read"><Dashboard /></ProtectedRoute>} />
            
            {/* User Management */}
            <Route path="users" element={<ProtectedRoute requiredPermission="users.read"><UsersList /></ProtectedRoute>} />
            
            {/* Admin functions - no separate dashboard */}
            <Route path="admin/permissions" element={<ProtectedRoute requiredPermission="permissions.manage"><PermissionManagement /></ProtectedRoute>} />
            <Route path="admin/models" element={<ProtectedRoute requiredPermission="models.manage"><ModelsManagement /></ProtectedRoute>} />
            <Route path="admin/audit-log" element={<ProtectedRoute requiredPermission="audit.read"><AuditLog /></ProtectedRoute>} />
            <Route path="admin/abac" element={<ProtectedRoute requiredPermission="abac.manage"><ABACManagement /></ProtectedRoute>} />

            {/* Resource routes */}
            <Route path="colleges" element={<ProtectedRoute requiredPermission="colleges.read"><CollegesList /></ProtectedRoute>} />
            <Route path="departments" element={<ProtectedRoute requiredPermission="departments.read"><DepartmentsList /></ProtectedRoute>} />


            {/* Academic routes */}
            <Route path="academic/years" element={<ProtectedRoute requiredPermission="academic_years.read"><AcademicYearsList /></ProtectedRoute>} />
            <Route path="academic/programs" element={<ProtectedRoute requiredPermission="programs.read"><ProgramsList /></ProtectedRoute>} />
            <Route path="academic/branches" element={<ProtectedRoute requiredPermission="branches.read"><BranchesList /></ProtectedRoute>} />
            <Route path="academic/regulations" element={<ProtectedRoute requiredPermission="regulations.read"><RegulationsList /></ProtectedRoute>} />
            <Route path="academic/batches" element={<ProtectedRoute requiredPermission="batches.read"><BatchesList /></ProtectedRoute>} />
            <Route path="academic/semesters" element={<ProtectedRoute requiredPermission="semesters.read"><SemestersList /></ProtectedRoute>} />



            <Route path="attachments" element={<ProtectedRoute requiredPermission="attachments.read"><AttachmentsList /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredPermission="settings.read"><SystemSettings /></ProtectedRoute>} />
            
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;