/**
 * Database Seeder Runner
 * Runs all seeders in order
 */

import Strapi from '@strapi/strapi';
import path from 'path';
import { config } from 'dotenv';
import { seedProducts } from './seeders/product-seeder';
import { seedCustomization } from './seeders/customization-seeder';
import { seedUsers } from './seeders/user-seeder';
import { seedInventory } from './seeders/inventory-seeder';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '..', '.env') });

async function runSeeders() {
  console.log('🚀 Starting database seeding...\n');

  // Initialize Strapi with the app directory context
  const appContext = await Strapi({
    distDir: path.resolve(__dirname, '..', 'dist'),
    appDir: path.resolve(__dirname, '..'),
  }).load();

  const app = await appContext.start();

  let exitCode = 0;
  try {
    // Seed users first (required for order inquiries)
    // Pass true to force recreate users with proper password hashing
    await seedUsers(app, true);

    // Seed customization options next (used by products)
    await seedCustomization(app);

    // Run product seeder
    await seedProducts(app);

    // Seed inventory for products (run after products exist)
    await seedInventory(app);

    console.log('\n✅ All seeders completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    exitCode = 1;
  } finally {
    await app.destroy();
    process.exit(exitCode);
  }
}

runSeeders();
