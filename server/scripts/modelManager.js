#!/usr/bin/env node
// server/scripts/modelManager.js - CLI script for managing models

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
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
} from '../utils/modelSeeders.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/permission_system');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

// CLI Commands
const commands = {
  async check(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to check');
      console.log('Usage: npm run model check users');
      return;
    }
    
    const exists = await checkModelExists(modelName);
    console.log(`Model '${modelName}': ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  },

  async list(category = 'all') {
    console.log(`📋 Models (${category.toUpperCase()}):`);
    
    let models;
    if (category === 'all') {
      models = await getAllModels();
    } else {
      models = await getModelsByCategory(category);
    }
    
    if (models.length === 0) {
      console.log(`No models found for category: ${category}`);
      return;
    }
    
    // Group by categories if showing all
    if (category === 'all') {
      const categorized = {
        core: [],
        institutional: [],
        academic: [],
        other: []
      };
      
      models.forEach(model => {
        const statusIcon = model.isActive ? '✅' : '❌';
        const modelStr = `${statusIcon} ${model.displayName} (${model.name})`;
        
        if (MODEL_CATEGORIES.core.includes(model.name)) {
          categorized.core.push(modelStr);
        } else if (MODEL_CATEGORIES.institutional.includes(model.name)) {
          categorized.institutional.push(modelStr);
        } else if (MODEL_CATEGORIES.academic.includes(model.name)) {
          categorized.academic.push(modelStr);
        } else {
          categorized.other.push(modelStr);
        }
      });
      
      Object.entries(categorized).forEach(([cat, items]) => {
        if (items.length > 0) {
          console.log(`\n${cat.toUpperCase()}:`);
          items.forEach(item => console.log(`  ${item}`));
        }
      });
    } else {
      models.forEach(model => {
        const statusIcon = model.isActive ? '✅' : '❌';
        console.log(`  ${statusIcon} ${model.displayName} (${model.name})`);
      });
    }
  },

  async stats() {
    console.log('📊 Model Statistics:');
    const stats = await getModelStats();
    
    if (!stats) {
      console.log('❌ Failed to get model statistics');
      return;
    }
    
    console.log(`Total Models: ${stats.total}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Inactive: ${stats.inactive}`);
    
    console.log('\nBy Category:');
    Object.entries(stats.byCategory).forEach(([category, data]) => {
      const status = data.missing > 0 ? '⚠️' : '✅';
      console.log(`  ${status} ${category.toUpperCase()}: ${data.existing}/${data.expected} (${data.missing} missing)`);
    });
  },

  async missing() {
    console.log('🔍 Checking for missing models...');
    
    const missing = await findMissingModels();
    
    if (missing.length === 0) {
      console.log('✅ All models are present');
    } else {
      console.log(`❌ Missing ${missing.length} models:`);
      missing.forEach(model => {
        console.log(`   - ${model.displayName} (${model.name})`);
        console.log(`     ${model.description}`);
      });
      console.log('\nTo add missing models, run:');
      console.log('   npm run model seed missing');
      console.log('   # or specific categories:');
      console.log('   npm run model seed academic');
    }
  },

  async validate() {
    const result = await validateModelSystem();
    
    if (result.valid) {
      console.log('✅ Model system is valid');
      console.log(`   Total models: ${result.totalModels}`);
    } else {
      console.log('⚠️  Model system has issues:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
      if (result.missingCount > 0) {
        console.log(`\n💡 Tip: Run 'npm run model missing' to see what's missing`);
      }
    }
  },

  async seed(type = 'missing') {
    console.log(`🌱 Seeding ${type} models...`);
    
    try {
      switch (type) {
        case 'all':
          await seedAllModels();
          break;
        case 'core':
          await seedCoreModels();
          break;
        case 'institutional':
          await seedInstitutionalModels();
          break;
        case 'academic':
          await seedAcademicModels();
          break;
        case 'missing':
          const missing = await findMissingModels();
          if (missing.length === 0) {
            console.log('✅ No missing models to seed');
          } else {
            console.log(`🌱 Seeding ${missing.length} missing models...`);
            for (const missingModel of missing) {
              await seedModel(missingModel.key, true);
            }
            console.log('✅ Missing models seeding completed');
          }
          break;
        default:
          // Try to seed individual model
          if (MODEL_DEFINITIONS[type]) {
            await seedModel(type, true);
          } else {
            console.log(`❌ Unknown model type: ${type}`);
            console.log('Available types:');
            console.log('  - all: Seed all models');
            console.log('  - missing: Seed only missing models (recommended)');
            console.log('  - core: Seed core system models');
            console.log('  - institutional: Seed institutional models');
            console.log('  - academic: Seed academic structure models');
            console.log('  - Individual models:', AVAILABLE_MODELS.all.join(', '));
          }
          break;
      }
    } catch (error) {
      console.error('❌ Seeding error:', error.message);
    }
  },

  async activate(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to activate');
      console.log('Usage: npm run model activate programs');
      return;
    }
    
    try {
      await toggleModel(modelName, true);
    } catch (error) {
      console.error('❌ Error activating model:', error.message);
    }
  },

  async deactivate(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to deactivate');
      console.log('Usage: npm run model deactivate programs');
      return;
    }
    
    try {
      await toggleModel(modelName, false);
    } catch (error) {
      console.error('❌ Error deactivating model:', error.message);
    }
  },

  async toggle(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to toggle');
      console.log('Usage: npm run model toggle programs');
      return;
    }
    
    try {
      await toggleModel(modelName);
    } catch (error) {
      console.error('❌ Error toggling model:', error.message);
    }
  },

  async update(modelName, field, value) {
    if (!modelName || !field || !value) {
      console.log('❌ Please provide model name, field, and value');
      console.log('Usage: npm run model update programs displayName "Academic Programs"');
      console.log('Available fields: displayName, description, isActive');
      return;
    }
    
    try {
      const updateData = { [field]: value };
      
      // Parse boolean values
      if (field === 'isActive') {
        updateData[field] = value.toLowerCase() === 'true';
      }
      
      await updateModel(modelName, updateData);
    } catch (error) {
      console.error('❌ Error updating model:', error.message);
    }
  },

  async remove(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to remove');
      console.log('Usage: npm run model remove programs');
      return;
    }
    
    try {
      await removeModel(modelName);
    } catch (error) {
      console.error('❌ Error removing model:', error.message);
    }
  },

  async refresh(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to refresh permissions');
      console.log('Usage: npm run model refresh programs');
      return;
    }
    
    try {
      await refreshModelPermissions(modelName);
    } catch (error) {
      console.error('❌ Error refreshing model permissions:', error.message);
    }
  },

  async permissions(modelName) {
    if (!modelName) {
      console.log('❌ Please provide a model name to check permissions');
      console.log('Usage: npm run model permissions programs');
      return;
    }
    
    try {
      const Permission = (await import('../models/Permission.js')).default;
      const model = await (await import('../models/Model.js')).default.findOne({ name: modelName });
      
      if (!model) {
        console.log(`❌ Model '${modelName}' not found`);
        return;
      }
      
      const permissions = await Permission.find({ modelId: model._id });
      
      console.log(`🔐 Permissions for ${model.displayName}:`);
      if (permissions.length === 0) {
        console.log('   No permissions found');
      } else {
        permissions.forEach(permission => {
          console.log(`   - ${permission.permissionKey} (${permission.action})`);
        });
      }
    } catch (error) {
      console.error('❌ Error checking model permissions:', error.message);
    }
  },

  help() {
    console.log('🔧 Model Management CLI');
    console.log('');
    console.log('Available commands:');
    console.log('  check <model>         - Check if model exists');
    console.log('  list [category]       - List models (all, core, institutional, academic)');
    console.log('  stats                 - Show model statistics');
    console.log('  missing               - Check for missing models');
    console.log('  validate              - Validate model system');
    console.log('');
    console.log('Seeding commands:');
    console.log('  seed missing          - Seed only missing models (recommended)');
    console.log('  seed all              - Seed all models');
    console.log('  seed core             - Seed core system models');
    console.log('  seed institutional    - Seed institutional models');
    console.log('  seed academic         - Seed academic structure models');
    console.log('  seed <model>          - Seed specific model');
    console.log('');
    console.log('Management commands:');
    console.log('  activate <model>      - Activate model');
    console.log('  deactivate <model>    - Deactivate model');
    console.log('  toggle <model>        - Toggle model status');
    console.log('  update <model> <field> <value> - Update model field');
    console.log('  remove <model>        - Remove model (dangerous!)');
    console.log('  refresh <model>       - Refresh model permissions');
    console.log('  permissions <model>   - Show model permissions');
    console.log('  help                  - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run model missing');
    console.log('  npm run model seed academic');
    console.log('  npm run model check programs');
    console.log('  npm run model list academic');
    console.log('  npm run model permissions programs');
    console.log('  npm run model refresh programs');
    console.log('');
    console.log('Model Categories:');
    console.log('  core: users, dashboard, attachments, settings, admin, abac');
    console.log('  institutional: colleges, departments');
    console.log('  academic: programs, branches, academicYears, regulations, semesters, batches');
  }
};

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    commands.help();
    return;
  }
  
  if (!commands[command]) {
    console.log(`❌ Unknown command: ${command}`);
    console.log('Run "npm run model help" for available commands');
    return;
  }
  
  try {
    await connectDB();
    await commands[command](...args.slice(1));
  } catch (error) {
    console.error('❌ Command error:', error);
  } finally {
    await disconnectDB();
  }
}

// Run the CLI
main().catch(console.error);