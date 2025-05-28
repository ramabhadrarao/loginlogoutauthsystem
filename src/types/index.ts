export interface User {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface Model {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  _id: string;
  modelId: string;
  action: 'create' | 'read' | 'update' | 'delete';
  permissionKey: string;
  createdAt: string;
}

export interface UserPermission {
  _id: string;
  userId: string;
  permissionId: string;
  grantedAt: string;
  grantedBy: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  route: string;
  icon: string;
  parentId?: string;
  requiredPermission: string;
  sortOrder: number;
  isActive: boolean;
  children?: MenuItem[];
}

export interface College {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  dateCreated: string;
  dateUpdated: string;
}
export interface Department {
  _id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  establishedDate?: string;
  status: 'active' | 'inactive';
  dateCreated: string;
  dateUpdated: string;
  
  // Populated fields
  collegeName?: string;
  collegeCode?: string;
  hodName?: string;
  hodEmail?: string;
}

export interface Attachment {
  _id: string;
  uploaderUserId: string;
  uploaderName?: string; // Add this if it's populated from the backend
  fileName: string;
  originalFileName: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number;
  storageLocation: string;
  createdAt: string;
  updatedAt?: string; // Add this if the backend includes it
}

export interface SystemSetting {
  _id: string;
  settingKey: string;
  settingValue: string;
  settingGroup?: string;
  isPublic: boolean;
  description?: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface AuditLogEntry {
  _id: string;
  userId: string;
  action: 'granted' | 'revoked';
  permissionKey: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}