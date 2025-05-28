// src/utils/auth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  getEffectivePermissions: (modelName: string) => {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password });
      localStorage.setItem('token', token);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsLoading(false);
    }
  };

  // Smart permission checking with hierarchy logic
  const hasPermission = (permissionKey: string) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    // Direct permission check
    const directPermission = user.permissions?.some(
      permission => permission.permissionKey === permissionKey
    );
    
    if (directPermission) return true;
    
    // Smart permission logic: if you have write/update/delete, you automatically have read
    if (permissionKey.endsWith('.read')) {
      const modelName = permissionKey.replace('.read', '');
      const hasWrite = user.permissions?.some(p => p.permissionKey === `${modelName}.create`);
      const hasUpdate = user.permissions?.some(p => p.permissionKey === `${modelName}.update`);
      const hasDelete = user.permissions?.some(p => p.permissionKey === `${modelName}.delete`);
      
      return hasWrite || hasUpdate || hasDelete;
    }
    
    return false;
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (permissionKeys: string[]) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    return permissionKeys.some(key => hasPermission(key));
  };

  // Get effective permissions for a model (what the user can actually do)
  const getEffectivePermissions = (modelName: string) => {
    if (!user) {
      return { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
    }
    
    if (user.isSuperAdmin) {
      return { canRead: true, canCreate: true, canUpdate: true, canDelete: true };
    }
    
    const canCreate = hasPermission(`${modelName}.create`);
    const canUpdate = hasPermission(`${modelName}.update`);
    const canDelete = hasPermission(`${modelName}.delete`);
    const canRead = hasPermission(`${modelName}.read`) || canCreate || canUpdate || canDelete;
    
    return { canRead, canCreate, canUpdate, canDelete };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      getEffectivePermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};