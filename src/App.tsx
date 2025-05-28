import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/layout/AppLayout';
import PermissionManagement from './pages/admin/PermissionManagement';
import ModelsManagement from './pages/admin/ModelsManagement';
import AuditLog from './pages/admin/AuditLog';
import CollegesList from './pages/colleges/CollegesList';
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
        <div className="animate-pulse text-indigo-600">Loading...</div>
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
          <svg className="h-10 w-10\" fill="none\" viewBox="0 0 24 24\" stroke="currentColor">
            <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this resource.</p>
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
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard\" replace />} />
            <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard.read"><Dashboard /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="admin/permissions" element={<ProtectedRoute requiredPermission="permissions.manage"><PermissionManagement /></ProtectedRoute>} />
            <Route path="admin/models" element={<ProtectedRoute requiredPermission="models.manage"><ModelsManagement /></ProtectedRoute>} />
            <Route path="admin/audit-log" element={<ProtectedRoute requiredPermission="audit.read"><AuditLog /></ProtectedRoute>} />
            
            {/* Resource routes */}
            <Route path="colleges" element={<ProtectedRoute requiredPermission="colleges.read"><CollegesList /></ProtectedRoute>} />
            <Route path="attachments" element={<ProtectedRoute requiredPermission="attachments.read"><AttachmentsList /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredPermission="settings.read"><SystemSettings /></ProtectedRoute>} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;