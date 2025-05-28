// src/utils/abacApi.ts
import { fetchWithAuth } from './api';
import { AttributeDefinition, PolicyRule, UserAttribute, PolicyEvaluation } from '../types/abac';

export const abacApi = {
  // Attribute Definitions
  attributes: {
    getAll: (): Promise<AttributeDefinition[]> => 
      fetchWithAuth('/abac/attributes'),
    
    create: (data: Partial<AttributeDefinition>): Promise<AttributeDefinition> =>
      fetchWithAuth('/abac/attributes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<AttributeDefinition>): Promise<AttributeDefinition> =>
      fetchWithAuth(`/abac/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string): Promise<{ message: string }> =>
      fetchWithAuth(`/abac/attributes/${id}`, { method: 'DELETE' })
  },

  // Policy Rules
  policies: {
    getAll: (params?: { modelName?: string; isActive?: boolean }): Promise<PolicyRule[]> => {
      const searchParams = new URLSearchParams();
      if (params?.modelName) searchParams.append('modelName', params.modelName);
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
      
      const queryString = searchParams.toString();
      return fetchWithAuth(`/abac/policies${queryString ? `?${queryString}` : ''}`);
    },
    
    create: (data: Partial<PolicyRule>): Promise<PolicyRule> =>
      fetchWithAuth('/abac/policies', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<PolicyRule>): Promise<PolicyRule> =>
      fetchWithAuth(`/abac/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string): Promise<{ message: string }> =>
      fetchWithAuth(`/abac/policies/${id}`, { method: 'DELETE' }),
    
    test: (data: { userId: string; resource: any; action: string; context?: any }): Promise<any> =>
      fetchWithAuth('/abac/policies/test', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // User Attributes
  userAttributes: {
    getByUser: (userId: string): Promise<UserAttribute[]> =>
      fetchWithAuth(`/abac/users/${userId}/attributes`),
    
    set: (userId: string, data: { attributeName: string; attributeValue: any; validFrom?: Date; validUntil?: Date }): Promise<UserAttribute> =>
      fetchWithAuth(`/abac/users/${userId}/attributes`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    remove: (userId: string, attributeName: string): Promise<{ message: string }> =>
      fetchWithAuth(`/abac/users/${userId}/attributes/${attributeName}`, { method: 'DELETE' })
  },

  // Policy Evaluations (Audit)
  evaluations: {
    getAll: (params?: { 
      userId?: string; 
      modelName?: string; 
      action?: string; 
      decision?: string; 
      limit?: number; 
      page?: number; 
    }): Promise<{
      evaluations: PolicyEvaluation[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
    }> => {
      const searchParams = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value.toString());
      });
      
      const queryString = searchParams.toString();
      return fetchWithAuth(`/abac/evaluations${queryString ? `?${queryString}` : ''}`);
    }
  },

  // Utilities
  utils: {
    getModels: (): Promise<Array<{ _id: string; name: string; displayName: string }>> =>
      fetchWithAuth('/abac/models'),
    
    getMyScope: (modelName: string): Promise<{ hasAccess: boolean; filter: any }> =>
      fetchWithAuth(`/abac/my-scope/${modelName}`)
  }
};