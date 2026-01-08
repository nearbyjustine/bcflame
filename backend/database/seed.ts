/**
 * Database Seeder Runner
 * Runs all seeders in order
 */

import Strapi from '@strapi/strapi';
import path from 'path';
import { seedProducts } from './seeders/product-seeder';

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
    // Run seeders in order
    await seedProducts(app);

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
