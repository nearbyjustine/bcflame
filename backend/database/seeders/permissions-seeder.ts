/**
 * Permissions Seeder
 * Configures public API permissions for ALL Strapi content types
 */

import type { Strapi } from '@strapi/strapi';

/**
 * Standard CRUD actions to enable for all API content types
 */
const publicActions = ['find', 'findOne', 'create', 'update', 'delete'];

/**
 * Seed public permissions for ALL API endpoints
 * @param strapi - Strapi instance
 */
export async function seedPermissions(strapi: Strapi): Promise<void> {
  console.log('\n🔐 Seeding Public Permissions for ALL APIs...');

  try {
    // Find the public role
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({
        where: { type: 'public' },
      });

    if (!publicRole) {
      throw new Error('Public role not found');
    }

    // Get all content types that start with 'api::' (custom APIs)
    const contentTypes = Object.keys(strapi.contentTypes).filter(
      (key) => key.startsWith('api::')
    );

    console.log(`  📋 Found ${contentTypes.length} API content types`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const contentType of contentTypes) {
      for (const action of publicActions) {
        const actionIdentifier = `${contentType}.${action}`;

        // Check if permission already exists
        const existingPermission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({
            where: {
              role: publicRole.id,
              action: actionIdentifier,
            },
          });

        if (existingPermission) {
          skippedCount++;
          continue;
        }

        // Create the permission
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            role: publicRole.id,
            action: actionIdentifier,
          },
        });

        console.log(`  ✅ Enabled: ${actionIdentifier}`);
        updatedCount++;
      }
    }

    console.log(`\n  📊 Permissions: ${updatedCount} created, ${skippedCount} already existed`);
  } catch (error) {
    console.error('\n❌ Permissions seeding failed:', error);
    throw error;
  }
}
