import { LoginCredentials, AuthResponse, User, Model, Permission } from '../types';

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

  logout: (): Promise<{ success: boolean }> => 
    fetchWithAuth('/auth/logout', { method: 'POST' }),

  getProfile: (): Promise<User> => 
    fetchWithAuth('/auth/profile'),

  refreshToken: (): Promise<{ token: string }> => 
    fetchWithAuth('/auth/refresh-token', { method: 'POST' }),
};

// Users API calls
export const usersApi = {
  getAll: (): Promise<User[]> => 
    fetchWithAuth('/admin/users'),

  getById: (id: string): Promise<User> => 
    fetchWithAuth(`/admin/users/${id}`),

  create: (userData: Partial<User>): Promise<User> => 
    fetchWithAuth('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (id: string, userData: Partial<User>): Promise<User> => 
    fetchWithAuth(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  delete: (id: string): Promise<{ success: boolean }> => 
    fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' }),

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
};

// Permissions API calls
export const permissionsApi = {
  getAll: (): Promise<Permission[]> => 
    fetchWithAuth('/admin/permissions'),

  getMyPermissions: (): Promise<Permission[]> => 
    fetchWithAuth('/user/my-permissions'),
};

// Generic resource API calls
export const resourceApi = {
  getAll: (model: string): Promise<any[]> => 
    fetchWithAuth(`/${model}`),

  getById: (model: string, id: string): Promise<any> => 
    fetchWithAuth(`/${model}/${id}`),

  create: (model: string, data: any): Promise<any> => 
    fetchWithAuth(`/${model}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (model: string, id: string, data: any): Promise<any> => 
    fetchWithAuth(`/${model}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (model: string, id: string): Promise<{ success: boolean }> => 
    fetchWithAuth(`/${model}/${id}`, { method: 'DELETE' }),
};

// Upload file API call
export const uploadApi = {
  uploadFile: (file: File): Promise<{ attachment: any }> => {
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
};