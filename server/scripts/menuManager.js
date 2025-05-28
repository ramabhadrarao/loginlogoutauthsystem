#!/usr/bin/env node
// server/scripts/menuManager.js - CLI script for managing menu items

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  seedMenuItem,
  seedAdminSubMenuItem,
  seedAllBaseMenuItems,
  seedAdministrationMenu,
  seedAllMenuItems,
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
    
    menuItems.forEach(item => {
      const parentInfo = item.parentId ? ` (child of ${item.parentId})` : '';
      const statusIcon = item.isActive ? '✅' : '❌';
      console.log(`${statusIcon} ${item.name} -> ${item.route}${parentInfo}`);
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
            console.log('Available types: all, base, admin, or individual items:');
            console.log('Base items:', AVAILABLE_MENU_ITEMS.base.join(', '));
            console.log('Admin sub-items:', AVAILABLE_MENU_ITEMS.adminSub.join(', '));
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

  help() {
    console.log('🔧 Menu Management CLI');
    console.log('');
    console.log('Available commands:');
    console.log('  check <route>         - Check if menu item exists');
    console.log('  list                  - List all menu items');
    console.log('  hierarchy             - Show menu hierarchy');
    console.log('  stats                 - Show menu statistics');
    console.log('  validate              - Validate menu system');
    console.log('  seed [type]           - Seed menu items (all, base, admin, or specific item)');
    console.log('  enable <route>        - Enable menu item');
    console.log('  disable <route>       - Disable menu item');
    console.log('  toggle <route>        - Toggle menu item status');
    console.log('  update <route> <field> <value> - Update menu item field');
    console.log('  remove <route>        - Remove menu item');
    console.log('  reset --confirm       - Reset entire menu system');
    console.log('  help                  - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run menu check /dashboard');
    console.log('  npm run menu seed dashboard');
    console.log('  npm run menu seed admin');
    console.log('  npm run menu list');
    console.log('  npm run menu enable /admin/abac');
    console.log('  npm run menu update /dashboard name "Main Dashboard"');
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