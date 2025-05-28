#!/usr/bin/env node
// server/scripts/menuManager.js - CLI script for managing menu items (Updated with Academic Structure)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  seedMenuItem,
  seedAdminSubMenuItem,
  seedAllBaseMenuItems,
  seedAdministrationMenu,
  seedAllMenuItems,
  seedAcademicMenuItems,
  seedCoreMenuItems,
  seedInstitutionalMenuItems,
  checkMenuItemExists,
  getAllMenuItems,
  getMenuHierarchy,
  getMenuStats,
  validateMenuSystem,
  resetMenuSystem,
  updateMenuItem,
  removeMenuItem,
  toggleMenuItem,
  AVAILABLE_MENU_ITEMS,
  BASE_MENU_ITEMS,
  ADMIN_SUB_MENU_ITEMS
} from '../utils/menuSeeders.js';

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
  async check(route) {
    if (!route) {
      console.log('❌ Please provide a route to check');
      console.log('Usage: npm run menu check /dashboard');
      return;
    }
    
    const exists = await checkMenuItemExists(route);
    console.log(`Menu item '${route}': ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  },

  async list() {
    console.log('📋 All Menu Items:');
    const menuItems = await getAllMenuItems();
    
    if (menuItems.length === 0) {
      console.log('No menu items found');
      return;
    }
    
    // Group by categories
    const categories = {
      core: [],
      institutional: [],
      academic: [],
      admin: [],
      other: []
    };
    
    menuItems.forEach(item => {
      const parentInfo = item.parentId ? ` (child of ${item.parentId})` : '';
      const statusIcon = item.isActive ? '✅' : '❌';
      const itemStr = `${statusIcon} ${item.name} -> ${item.route}${parentInfo}`;
      
      if (item.parentId) {
        categories.admin.push(itemStr);
      } else if (['/dashboard', '/users', '/attachments', '/settings'].includes(item.route)) {
        categories.core.push(itemStr);
      } else if (['/colleges', '/departments'].includes(item.route)) {
        categories.institutional.push(itemStr);
      } else if (['/programs', '/branches', '/academic-years', '/regulations', '/semesters', '/batches'].includes(item.route)) {
        categories.academic.push(itemStr);
      } else {
        categories.other.push(itemStr);
      }
    });
    
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        items.forEach(item => console.log(`  ${item}`));
      }
    });
  },

  async hierarchy() {
    console.log('🌳 Menu Hierarchy:');
    const hierarchy = await getMenuHierarchy();
    
    const printLevel = (items, level = 0) => {
      items.forEach(item => {
        const indent = '  '.repeat(level);
        const statusIcon = item.isActive ? '✅' : '❌';
        console.log(`${indent}${statusIcon} ${item.name} -> ${item.route}`);
        
        if (item.children && item.children.length > 0) {
          printLevel(item.children, level + 1);
        }
      });
    };
    
    printLevel(hierarchy);
  },

  async stats() {
    console.log('📊 Menu Statistics:');
    const stats = await getMenuStats();
    
    if (!stats) {
      console.log('❌ Failed to get menu statistics');
      return;
    }
    
    console.log(`Total Menu Items: ${stats.total}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Inactive: ${stats.inactive}`);
    console.log(`Root Level: ${stats.rootLevel}`);
    console.log(`Sub-menu Items: ${stats.withParent}`);
    console.log(`Academic Structure Items: ${stats.academic}`);
  },

  async validate() {
    const result = await validateMenuSystem();
    
    if (result.valid) {
      console.log('✅ Menu system is valid');
    } else {
      console.log('⚠️  Menu system has issues:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    }
  },

  async seed(type = 'all') {
    console.log(`🌱 Seeding ${type} menu items...`);
    
    try {
      switch (type) {
        case 'all':
          await seedAllMenuItems();
          break;
        case 'base':
          await seedAllBaseMenuItems();
          break;
        case 'core':
          await seedCoreMenuItems();
          break;
        case 'institutional':
          await seedInstitutionalMenuItems();
          break;
        case 'academic':
          await seedAcademicMenuItems();
          break;
        case 'admin':
          await seedAdministrationMenu();
          break;
        default:
          // Try to seed individual item
          if (BASE_MENU_ITEMS[type]) {
            await seedMenuItem(type);
          } else if (ADMIN_SUB_MENU_ITEMS[type]) {
            console.log('❌ Admin submenu items need a parent ID. Use "admin" to seed all admin items.');
          } else {
            console.log(`❌ Unknown menu type: ${type}`);
            console.log('Available types:');
            console.log('  - all: Seed all menu items');
            console.log('  - base: Seed all base menu items');
            console.log('  - core: Seed core items (dashboard, users, files, settings, admin)');
            console.log('  - institutional: Seed institutional items (colleges, departments)');
            console.log('  - academic: Seed academic structure items (programs, branches, etc.)');
            console.log('  - admin: Seed administration menu with sub-items');
            console.log('  - Individual items:', AVAILABLE_MENU_ITEMS.base.join(', '));
          }
          break;
      }
    } catch (error) {
      console.error('❌ Seeding error:', error.message);
    }
  },

  async enable(route) {
    if (!route) {
      console.log('❌ Please provide a route to enable');
      console.log('Usage: npm run menu enable /dashboard');
      return;
    }
    
    try {
      await toggleMenuItem(route, true);
    } catch (error) {
      console.error('❌ Error enabling menu item:', error.message);
    }
  },

  async disable(route) {
    if (!route) {
      console.log('❌ Please provide a route to disable');
      console.log('Usage: npm run menu disable /dashboard');
      return;
    }
    
    try {
      await toggleMenuItem(route, false);
    } catch (error) {
      console.error('❌ Error disabling menu item:', error.message);
    }
  },

  async toggle(route) {
    if (!route) {
      console.log('❌ Please provide a route to toggle');
      console.log('Usage: npm run menu toggle /dashboard');
      return;
    }
    
    try {
      await toggleMenuItem(route);
    } catch (error) {
      console.error('❌ Error toggling menu item:', error.message);
    }
  },

  async remove(route) {
    if (!route) {
      console.log('❌ Please provide a route to remove');
      console.log('Usage: npm run menu remove /dashboard');
      return;
    }
    
    try {
      await removeMenuItem(route);
    } catch (error) {
      console.error('❌ Error removing menu item:', error.message);
    }
  },

  async reset() {
    console.log('⚠️  This will delete ALL menu items and recreate them!');
    console.log('Are you sure you want to continue? This action cannot be undone.');
    
    // In a real implementation, you'd want to add a confirmation prompt
    // For now, we'll add a safety check
    if (process.argv.includes('--confirm')) {
      try {
        await resetMenuSystem();
      } catch (error) {
        console.error('❌ Reset error:', error.message);
      }
    } else {
      console.log('❌ Reset cancelled. Use --confirm flag to proceed.');
      console.log('Usage: npm run menu reset --confirm');
    }
  },

  async update(route, field, value) {
    if (!route || !field || !value) {
      console.log('❌ Please provide route, field, and value');
      console.log('Usage: npm run menu update /dashboard name "New Dashboard"');
      console.log('Available fields: name, icon, requiredPermission, sortOrder, isActive');
      return;
    }
    
    try {
      const updateData = { [field]: value };
      
      // Parse boolean and number values
      if (field === 'isActive') {
        updateData[field] = value.toLowerCase() === 'true';
      } else if (field === 'sortOrder') {
        updateData[field] = parseInt(value);
      }
      
      await updateMenuItem(route, updateData);
    } catch (error) {
      console.error('❌ Error updating menu item:', error.message);
    }
  },

  async missing() {
    console.log('🔍 Checking for missing academic structure menu items...');
    
    const requiredAcademicItems = [
      { route: '/programs', name: 'Programs' },
      { route: '/branches', name: 'Branches' },
      { route: '/academic-years', name: 'Academic Years' },
      { route: '/regulations', name: 'Regulations' },
      { route: '/semesters', name: 'Semesters' },
      { route: '/batches', name: 'Batches' }
    ];
    
    const missing = [];
    
    for (const item of requiredAcademicItems) {
      const exists = await checkMenuItemExists(item.route);
      if (!exists) {
        missing.push(item);
      }
    }
    
    if (missing.length === 0) {
      console.log('✅ All academic structure menu items are present');
    } else {
      console.log(`❌ Missing ${missing.length} academic menu items:`);
      missing.forEach(item => {
        console.log(`   - ${item.name} (${item.route})`);
      });
      console.log('\nTo add missing items, run:');
      console.log('   npm run menu seed academic');
    }
  },

  help() {
    console.log('🔧 Menu Management CLI - Academic Structure Enhanced');
    console.log('');
    console.log('Available commands:');
    console.log('  check <route>         - Check if menu item exists');
    console.log('  list                  - List all menu items (grouped by category)');
    console.log('  hierarchy             - Show menu hierarchy');
    console.log('  stats                 - Show menu statistics');
    console.log('  validate              - Validate menu system');
    console.log('  missing               - Check for missing academic structure items');
    console.log('');
    console.log('Seeding commands:');
    console.log('  seed all              - Seed all menu items');
    console.log('  seed base             - Seed all base menu items');
    console.log('  seed core             - Seed core items (dashboard, users, files, settings)');
    console.log('  seed institutional    - Seed institutional items (colleges, departments)');
    console.log('  seed academic         - Seed academic structure items');
    console.log('  seed admin            - Seed administration menu');
    console.log('  seed <item>           - Seed specific menu item');
    console.log('');
    console.log('Management commands:');
    console.log('  enable <route>        - Enable menu item');
    console.log('  disable <route>       - Disable menu item');
    console.log('  toggle <route>        - Toggle menu item status');
    console.log('  update <route> <field> <value> - Update menu item field');
    console.log('  remove <route>        - Remove menu item');
    console.log('  reset --confirm       - Reset entire menu system');
    console.log('  help                  - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run menu missing');
    console.log('  npm run menu seed academic');
    console.log('  npm run menu check /programs');
    console.log('  npm run menu list');
    console.log('  npm run menu enable /admin/abac');
    console.log('  npm run menu update /dashboard name "Main Dashboard"');
    console.log('');
    console.log('Academic Structure Items:');
    console.log('  programs, branches, academicYears, regulations, semesters, batches');
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
    console.log('Run "npm run menu help" for available commands');
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