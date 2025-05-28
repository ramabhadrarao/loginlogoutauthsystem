// src/utils/api.ts
import { LoginCredentials, AuthResponse, User, Model, Permission, College, Attachment, SystemSetting, AuditLogEntry } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a fetch function with authorization header
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An error occurred');
  }

  return response.json();
};

// Auth API calls
export const authApi = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> => 
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: (): Promise<{ message: string }> => 
    fetchWithAuth('/auth/logout', { method: 'POST' }),

  getProfile: (): Promise<User> => 
    fetchWithAuth('/auth/profile'),
};

// Users API calls
export const usersApi = {
  getAll: (): Promise<User[]> => 
    fetchWithAuth('/admin/users'),

  getById: (id: string): Promise<User> => 
    fetchWithAuth(`/users/${id}`),

  create: (userData: Partial<User>): Promise<User> => 
    fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (id: string, userData: Partial<User>): Promise<User> => 
    fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/users/${id}`, { method: 'DELETE' }),

  getUserPermissions: (id: string): Promise<Permission[]> => 
    fetchWithAuth(`/admin/users/${id}/permissions`),

  assignPermissions: (id: string, permissions: string[]): Promise<{ success: boolean }> => 
    fetchWithAuth(`/admin/users/${id}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    }),
};

// Models API calls
export const modelsApi = {
  getAll: (): Promise<Model[]> => 
    fetchWithAuth('/admin/models'),

  create: (modelData: Partial<Model>): Promise<Model> => 
    fetchWithAuth('/admin/models', {
      method: 'POST',
      body: JSON.stringify(modelData),
    }),

  update: (id: string, modelData: Partial<Model>): Promise<Model> => 
    fetchWithAuth(`/admin/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(modelData),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/admin/models/${id}`, { method: 'DELETE' }),

  refreshPermissions: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/admin/models/${id}/refresh-permissions`, { method: 'POST' }),
};

// Permissions API calls
export const permissionsApi = {
  getAll: (): Promise<Permission[]> => 
    fetchWithAuth('/admin/permissions'),
};

// Colleges API calls
export const collegesApi = {
  getAll: (params?: { search?: string; status?: string }): Promise<College[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/colleges${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string): Promise<College> => 
    fetchWithAuth(`/colleges/${id}`),

  create: (collegeData: Partial<College>): Promise<College> => 
    fetchWithAuth('/colleges', {
      method: 'POST',
      body: JSON.stringify(collegeData),
    }),

  update: (id: string, collegeData: Partial<College>): Promise<College> => 
    fetchWithAuth(`/colleges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(collegeData),
    }),

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/colleges/${id}`, { method: 'DELETE' }),
};

// Attachments API calls
export const attachmentsApi = {
  getAll: (params?: { search?: string; mimeType?: string }): Promise<Attachment[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.mimeType) searchParams.append('mimeType', params.mimeType);
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/attachments${queryString ? `?${queryString}` : ''}`);
  },

  upload: (file: File): Promise<Attachment> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_URL}/attachments/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    });
  },

  download: (id: string): string => 
    `${API_URL}/attachments/${id}/download`,

  delete: (id: string): Promise<{ message: string }> => 
    fetchWithAuth(`/attachments/${id}`, { method: 'DELETE' }),
};

// Settings API calls
export const settingsApi = {
  getAll: (group?: string): Promise<SystemSetting[]> => {
    const queryString = group ? `?group=${group}` : '';
    return fetchWithAuth(`/settings${queryString}`);
  },

  getByKey: (key: string): Promise<SystemSetting> => 
    fetchWithAuth(`/settings/${key}`),

  update: (key: string, settingData: Partial<SystemSetting>): Promise<SystemSetting> => 
    fetchWithAuth(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(settingData),
    }),

  bulkUpdate: (settings: Partial<SystemSetting>[]): Promise<SystemSetting[]> => 
    fetchWithAuth('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    }),

  delete: (key: string): Promise<{ message: string }> => 
    fetchWithAuth(`/settings/${key}`, { method: 'DELETE' }),
};

// Audit Log API calls
export const auditLogApi = {
  getAll: (params?: { 
    action?: string; 
    userId?: string; 
    limit?: number; 
    page?: number; 
  }): Promise<{
    logs: AuditLogEntry[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.append('action', params.action);
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    
    const queryString = searchParams.toString();
    return fetchWithAuth(`/admin/audit-log${queryString ? `?${queryString}` : ''}`);
  },
};

// Menu API calls
export const menuApi = {
  getAll: (): Promise<any[]> => 
    fetchWithAuth('/menu'),
};