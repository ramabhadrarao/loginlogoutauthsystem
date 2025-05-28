// server/utils/modelSeeders.js - Individual model seeder functions
import Model from '../models/Model.js';
import Permission from '../models/Permission.js';

// Complete model definitions
export const MODEL_DEFINITIONS = {
  // Core system models
  users: {
    name: 'users',
    displayName: 'Users',
    description: 'User accounts and profiles'
  },
  dashboard: {
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Dashboard access and analytics'
  },
  attachments: {
    name: 'attachments',
    displayName: 'Attachments',
    description: 'File uploads and attachments'
  },
  settings: {
    name: 'settings',
    displayName: 'Settings',
    description: 'System configuration settings'
  },
  admin: {
    name: 'admin',
    displayName: 'Admin',
    description: 'Administrative functions'
  },
  abac: {
    name: 'abac',
    displayName: 'ABAC',
    description: 'Attribute-Based Access Control'
  },

  // Institutional models
  colleges: {
    name: 'colleges',
    displayName: 'Colleges',
    description: 'Educational institutions'
  },
  departments: {
    name: 'departments',
    displayName: 'Departments',
    description: 'Academic departments within colleges'
  },

  // Academic structure models - MISSING FROM YOUR DATABASE
  programs: {
    name: 'programs',
    displayName: 'Programs',
    description: 'Academic programs leading to degrees'
  },
  branches: {
    name: 'branches',
    displayName: 'Branches',
    description: 'Specialization branches within programs'
  },
  academicYears: {
    name: 'academic_years',
    displayName: 'Academic Years',
    description: 'Academic year management'
  },
  regulations: {
    name: 'regulations',
    displayName: 'Regulations',
    description: 'Academic regulations and policies'
  },
  semesters: {
    name: 'semesters',
    displayName: 'Semesters',
    description: 'Semester management'
  },
  batches: {
    name: 'batches',
    displayName: 'Batches',
    description: 'Student batch management'
  }
};

// Model categories for organized management
export const MODEL_CATEGORIES = {
  core: ['users', 'dashboard', 'attachments', 'settings', 'admin', 'abac'],
  institutional: ['colleges', 'departments'],
  academic: ['programs', 'branches', 'academicYears', 'regulations', 'semesters', 'batches']
};

// Available models for CLI help
export const AVAILABLE_MODELS = {
  all: Object.keys(MODEL_DEFINITIONS),
  core: MODEL_CATEGORIES.core,
  institutional: MODEL_CATEGORIES.institutional,
  academic: MODEL_CATEGORIES.academic
};

/**
 * Check if a model exists by name
 */
export const checkModelExists = async (modelName) => {
  try {
    const model = await Model.findOne({ name: modelName });
    return !!model;
  } catch (error) {
    console.error('Error checking model:', error);
    return false;
  }
};

/**
 * Get model by name
 */
export const getModelByName = async (modelName) => {
  try {
    return await Model.findOne({ name: modelName });
  } catch (error) {
    console.error('Error getting model:', error);
    return null;
  }
};

/**
 * Create permissions for a model
 */
export const createModelPermissions = async (modelId, modelName) => {
  try {
    // Special permission handling for specific models
    if (modelName === 'admin') {
      const adminPermissions = [
        { modelId, action: 'read', permissionKey: 'admin.access' },
        { modelId, action: 'create', permissionKey: 'permissions.manage' },
        { modelId, action: 'update', permissionKey: 'models.manage' },
        { modelId, action: 'delete', permissionKey: 'audit.read' }
      ];
      return await Permission.insertMany(adminPermissions);
    } else if (modelName === 'abac') {
      const abacPermissions = [
        { modelId, action: 'read', permissionKey: 'abac.read' },
        { modelId, action: 'create', permissionKey: 'abac.manage' },
        { modelId, action: 'update', permissionKey: 'abac.manage' },
        { modelId, action: 'delete', permissionKey: 'abac.manage' }
      ];
      return await Permission.insertMany(abacPermissions);
    } else if (modelName === 'dashboard') {
      const dashboardPermissions = [
        { modelId, action: 'read', permissionKey: 'dashboard.read' }
      ];
      return await Permission.insertMany(dashboardPermissions);
    } else {
      // Standard CRUD permissions
      const actions = ['create', 'read', 'update', 'delete'];
      const permissions = actions.map(action => ({
        modelId,
        action,
        permissionKey: `${modelName}.${action}`
      }));
      return await Permission.insertMany(permissions);
    }
  } catch (error) {
    console.error('Error creating model permissions:', error);
    throw error;
  }
};

/**
 * Seed a single model with permissions
 */
export const seedModel = async (modelKey, createPermissions = true) => {
  try {
    const modelData = MODEL_DEFINITIONS[modelKey];
    if (!modelData) {
      throw new Error(`Unknown model: ${modelKey}. Available models: ${Object.keys(MODEL_DEFINITIONS).join(', ')}`);
    }

    // Check if model already exists
    const exists = await checkModelExists(modelData.name);
    if (exists) {
      console.log(`⚠️  Model '${modelData.displayName}' already exists`);
      return await getModelByName(modelData.name);
    }

    // Create the model
    const model = await Model.create(modelData);
    console.log(`✅ Created model: ${modelData.displayName} (${modelData.name})`);

    // Create permissions if requested
    if (createPermissions) {
      const permissions = await createModelPermissions(model._id, modelData.name);
      console.log(`✅ Created ${permissions.length} permissions for ${modelData.displayName}`);
    }

    return model;
  } catch (error) {
    console.error(`❌ Error seeding model '${modelKey}':`, error.message);
    throw error;
  }
};

/**
 * Seed academic structure models only
 */
export const seedAcademicModels = async () => {
  console.log('🎓 Seeding academic structure models...');
  
  const academicModels = MODEL_CATEGORIES.academic;
  const createdModels = [];
  
  for (const modelKey of academicModels) {
    const model = await seedModel(modelKey, true);
    if (model) createdModels.push(model);
  }
  
  console.log(`✅ Academic structure models seeding completed - ${createdModels.length} models processed`);
  return createdModels;
};

/**
 * Seed core system models
 */
export const seedCoreModels = async () => {
  console.log('🔧 Seeding core system models...');
  
  const coreModels = MODEL_CATEGORIES.core;
  const createdModels = [];
  
  for (const modelKey of coreModels) {
    const model = await seedModel(modelKey, true);
    if (model) createdModels.push(model);
  }
  
  console.log(`✅ Core system models seeding completed - ${createdModels.length} models processed`);
  return createdModels;
};

/**
 * Seed institutional models
 */
export const seedInstitutionalModels = async () => {
  console.log('🏫 Seeding institutional models...');
  
  const institutionalModels = MODEL_CATEGORIES.institutional;
  const createdModels = [];
  
  for (const modelKey of institutionalModels) {
    const model = await seedModel(modelKey, true);
    if (model) createdModels.push(model);
  }
  
  console.log(`✅ Institutional models seeding completed - ${createdModels.length} models processed`);
  return createdModels;
};

/**
 * Seed all models
 */
export const seedAllModels = async () => {
  console.log('🌱 Seeding all models...');
  
  const allModels = Object.keys(MODEL_DEFINITIONS);
  const createdModels = [];
  
  for (const modelKey of allModels) {
    const model = await seedModel(modelKey, true);
    if (model) createdModels.push(model);
  }
  
  console.log(`✅ All models seeding completed - ${createdModels.length} models processed`);
  return createdModels;
};

/**
 * Get all models from database
 */
export const getAllModels = async () => {
  try {
    return await Model.find().sort({ name: 1 });
  } catch (error) {
    console.error('Error getting all models:', error);
    return [];
  }
};

/**
 * Get models by category
 */
export const getModelsByCategory = async (category) => {
  try {
    const categoryModels = MODEL_CATEGORIES[category];
    if (!categoryModels) {
      throw new Error(`Unknown category: ${category}. Available: ${Object.keys(MODEL_CATEGORIES).join(', ')}`);
    }
    
    return await Model.find({ name: { $in: categoryModels } }).sort({ name: 1 });
  } catch (error) {
    console.error('Error getting models by category:', error);
    return [];
  }
};

/**
 * Get model statistics
 */
export const getModelStats = async () => {
  try {
    const allModels = await getAllModels();
    
    const stats = {
      total: allModels.length,
      active: allModels.filter(model => model.isActive).length,
      inactive: allModels.filter(model => !model.isActive).length,
      byCategory: {}
    };
    
    // Count by category
    for (const [category, modelNames] of Object.entries(MODEL_CATEGORIES)) {
      const categoryCount = allModels.filter(model => modelNames.includes(model.name)).length;
      const expectedCount = modelNames.length;
      stats.byCategory[category] = {
        existing: categoryCount,
        expected: expectedCount,
        missing: expectedCount - categoryCount
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting model stats:', error);
    return null;
  }
};

/**
 * Find missing models
 */
export const findMissingModels = async () => {
  try {
    const existingModels = await getAllModels();
    const existingNames = existingModels.map(model => model.name);
    
    const missing = [];
    
    for (const [modelKey, modelData] of Object.entries(MODEL_DEFINITIONS)) {
      if (!existingNames.includes(modelData.name)) {
        missing.push({
          key: modelKey,
          name: modelData.name,
          displayName: modelData.displayName,
          description: modelData.description
        });
      }
    }
    
    return missing;
  } catch (error) {
    console.error('Error finding missing models:', error);
    return [];
  }
};

/**
 * Validate model system integrity
 */
export const validateModelSystem = async () => {
  try {
    const allModels = await getAllModels();
    const issues = [];
    
    // Check for duplicate names
    const names = allModels.map(model => model.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      issues.push(`Duplicate model names found: ${duplicateNames.join(', ')}`);
    }
    
    // Check for missing models
    const missing = await findMissingModels();
    if (missing.length > 0) {
      issues.push(`Missing models: ${missing.map(m => m.displayName).join(', ')}`);
    }
    
    // Check for models without permissions
    for (const model of allModels) {
      const permissionCount = await Permission.countDocuments({ modelId: model._id });
      if (permissionCount === 0) {
        issues.push(`Model '${model.displayName}' has no permissions`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      totalModels: allModels.length,
      missingCount: missing.length
    };
  } catch (error) {
    console.error('Error validating model system:', error);
    return {
      valid: false,
      issues: ['Error during validation: ' + error.message]
    };
  }
};

/**
 * Update model properties
 */
export const updateModel = async (modelName, updateData) => {
  try {
    const model = await Model.findOne({ name: modelName });
    if (!model) {
      throw new Error(`Model with name '${modelName}' not found`);
    }
    
    await Model.findByIdAndUpdate(model._id, updateData);
    
    console.log(`✅ Model '${model.displayName}' updated`);
    console.log(`   Updated fields: ${Object.keys(updateData).join(', ')}`);
  } catch (error) {
    console.error(`❌ Error updating model:`, error.message);
    throw error;
  }
};

/**
 * Toggle model active status
 */
export const toggleModel = async (modelName, forceStatus = null) => {
  try {
    const model = await Model.findOne({ name: modelName });
    if (!model) {
      throw new Error(`Model with name '${modelName}' not found`);
    }
    
    const newStatus = forceStatus !== null ? forceStatus : !model.isActive;
    
    await Model.findByIdAndUpdate(model._id, { isActive: newStatus });
    
    const action = newStatus ? 'activated' : 'deactivated';
    console.log(`✅ Model '${model.displayName}' ${action}`);
  } catch (error) {
    console.error(`❌ Error toggling model:`, error.message);
    throw error;
  }
};

/**
 * Remove model and its permissions
 */
export const removeModel = async (modelName) => {
  try {
    const model = await Model.findOne({ name: modelName });
    if (!model) {
      throw new Error(`Model with name '${modelName}' not found`);
    }
    
    // Don't allow deletion of core models
    const coreModels = ['users', 'settings', 'dashboard'];
    if (coreModels.includes(model.name)) {
      throw new Error('Cannot delete core system models');
    }
    
    // Delete associated permissions
    const deletedPermissions = await Permission.deleteMany({ modelId: model._id });
    console.log(`✅ Removed ${deletedPermissions.deletedCount} permissions for ${model.displayName}`);
    
    // Delete the model
    await Model.findByIdAndDelete(model._id);
    console.log(`✅ Model '${model.displayName}' removed`);
  } catch (error) {
    console.error(`❌ Error removing model:`, error.message);
    throw error;
  }
};

/**
 * Refresh model permissions (regenerate CRUD permissions)
 */
export const refreshModelPermissions = async (modelName) => {
  try {
    const model = await Model.findOne({ name: modelName });
    if (!model) {
      throw new Error(`Model with name '${modelName}' not found`);
    }
    
    // Delete existing permissions for this model
    const deletedPermissions = await Permission.deleteMany({ modelId: model._id });
    console.log(`✅ Removed ${deletedPermissions.deletedCount} old permissions`);
    
    // Create new permissions
    const newPermissions = await createModelPermissions(model._id, model.name);
    console.log(`✅ Created ${newPermissions.length} new permissions for ${model.displayName}`);
    
  } catch (error) {
    console.error(`❌ Error refreshing model permissions:`, error.message);
    throw error;
  }
};

export default {
  seedModel,
  seedAcademicModels,
  seedCoreModels,
  seedInstitutionalModels,
  seedAllModels,
  checkModelExists,
  getAllModels,
  getModelsByCategory,
  getModelStats,
  findMissingModels,
  validateModelSystem,
  updateModel,
  toggleModel,
  removeModel,
  refreshModelPermissions,
  MODEL_DEFINITIONS,
  MODEL_CATEGORIES,
  AVAILABLE_MODELS
};