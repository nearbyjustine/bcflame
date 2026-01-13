/**
 * User Seeder
 * Seeds test users with profile fields into Strapi database
 */

import type { Strapi } from '@strapi/strapi';

interface SeedUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  businessLicense: string;
  confirmed: boolean;
  blocked: boolean;
}

/**
 * Sample users with complete profile information
 */
const sampleUsers: SeedUser[] = [
  {
    username: 'testuser',
    email: 'test@bcflame.com',
    password: 'Test1234!',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Green Valley Cannabis Co',
    phone: '(555) 123-4567',
    businessLicense: 'CA-LIC-123456',
    confirmed: true,
    blocked: false,
  },
  {
    username: 'janesmith',
    email: 'jane.smith@cannahealth.com',
    password: 'Test1234!',
    firstName: 'Jane',
    lastName: 'Smith',
    company: 'CannaHealth Dispensary',
    phone: '(555) 234-5678',
    businessLicense: 'CA-LIC-234567',
    confirmed: true,
    blocked: false,
  },
  {
    username: 'bobwilson',
    email: 'bob@highlanddispensary.com',
    password: 'Test1234!',
    firstName: 'Bob',
    lastName: 'Wilson',
    company: 'Highland Dispensary',
    phone: '(555) 345-6789',
    businessLicense: 'CA-LIC-345678',
    confirmed: true,
    blocked: false,
  },
];

/**
 * Seed users into the database
 */
export async function seedUsers(strapi: Strapi): Promise<void> {
  console.log('\n📋 Seeding Users...');

  try {
    // Get the authenticated role (default for registered users)
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({
        where: { type: 'authenticated' },
      });

    if (!authenticatedRole) {
      throw new Error('Authenticated role not found');
    }

    // Check if users already exist
    const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({
      where: {
        username: {
          $in: sampleUsers.map(u => u.username),
        },
      },
    });

    const existingUsernames = new Set(existingUsers.map((u: any) => u.username));

    let createdCount = 0;
    let skippedCount = 0;

    // Create users
    for (const userData of sampleUsers) {
      if (existingUsernames.has(userData.username)) {
        console.log(`  ⏭️  Skipping ${userData.username} (already exists)`);
        skippedCount++;
        continue;
      }

      try {
        // Hash password using bcrypt directly
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user with profile fields
        await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            company: userData.company,
            phone: userData.phone,
            businessLicense: userData.businessLicense,
            confirmed: userData.confirmed,
            blocked: userData.blocked,
            role: authenticatedRole.id,
          },
        });

        console.log(`  ✅ Created user: ${userData.username} (${userData.firstName} ${userData.lastName})`);
        createdCount++;
      } catch (error) {
        console.error(`  ❌ Failed to create user ${userData.username}:`, error);
      }
    }

    console.log(`\n  📊 Users: ${createdCount} created, ${skippedCount} skipped`);
  } catch (error) {
    console.error('\n❌ User seeding failed:', error);
    throw error;
  }
}
