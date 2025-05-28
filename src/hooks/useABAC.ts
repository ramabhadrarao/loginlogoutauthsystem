// src/hooks/useABAC.ts
import { useState, useEffect } from 'react';
import { abacApi } from '../utils/abacApi';
import { AttributeDefinition, PolicyRule, UserAttribute } from '../types/abac';

export const useABAC = () => {
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [models, setModels] = useState<Array<{ _id: string; name: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [attributesData, policiesData, modelsData] = await Promise.all([
        abacApi.attributes.getAll(),
        abacApi.policies.getAll(),
        abacApi.utils.getModels()
      ]);
      
      setAttributes(attributesData);
      setPolicies(policiesData);
      setModels(modelsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load ABAC data');
    } finally {
      setLoading(false);
    }
  };

  // Attribute management
  const createAttribute = async (data: Partial<AttributeDefinition>) => {
    try {
      const newAttribute = await abacApi.attributes.create(data);
      setAttributes(prev => [...prev, newAttribute]);
      return newAttribute;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateAttribute = async (id: string, data: Partial<AttributeDefinition>) => {
    try {
      const updatedAttribute = await abacApi.attributes.update(id, data);
      setAttributes(prev => prev.map(attr => attr._id === id ? updatedAttribute : attr));
      return updatedAttribute;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAttribute = async (id: string) => {
    try {
      await abacApi.attributes.delete(id);
      setAttributes(prev => prev.filter(attr => attr._id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Policy management
  const createPolicy = async (data: Partial<PolicyRule>) => {
    try {
      const newPolicy = await abacApi.policies.create(data);
      setPolicies(prev => [...prev, newPolicy]);
      return newPolicy;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updatePolicy = async (id: string, data: Partial<PolicyRule>) => {
    try {
      const updatedPolicy = await abacApi.policies.update(id, data);
      setPolicies(prev => prev.map(policy => policy._id === id ? updatedPolicy : policy));
      return updatedPolicy;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      await abacApi.policies.delete(id);
      setPolicies(prev => prev.filter(policy => policy._id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Policy testing
  const testPolicy = async (userId: string, resource: any, action: string, context?: any) => {
    try {
      return await abacApi.policies.test({ userId, resource, action, context });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // User attribute management
  const getUserAttributes = async (userId: string) => {
    try {
      return await abacApi.userAttributes.getByUser(userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const setUserAttribute = async (userId: string, attributeName: string, attributeValue: any, validFrom?: Date, validUntil?: Date) => {
    try {
      return await abacApi.userAttributes.set(userId, { attributeName, attributeValue, validFrom, validUntil });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const removeUserAttribute = async (userId: string, attributeName: string) => {
    try {
      await abacApi.userAttributes.remove(userId, attributeName);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    // Data
    attributes,
    policies,
    models,
    loading,
    error,
    
    // Methods
    loadInitialData,
    
    // Attribute methods
    createAttribute,
    updateAttribute,
    deleteAttribute,
    
    // Policy methods
    createPolicy,
    updatePolicy,
    deletePolicy,
    testPolicy,
    
    // User attribute methods
    getUserAttributes,
    setUserAttribute,
    removeUserAttribute
  };
};