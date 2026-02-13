/**
 * Seed script for text effects
 * Run with: npm run strapi seed:text-effects
 */

import textEffectsData from './text-effects.json';

export default async () => {
  const { strapi } = global as any;

  console.log('🌱 Seeding text effects...');

  try {
    // Check if text effects already exist
    const existing = await strapi.entityService.findMany('api::text-effect.text-effect', {
      limit: 1,
    });

    if (existing && existing.length > 0) {
      console.log('⚠️  Text effects already exist. Skipping seed.');
      console.log('   To reseed, delete existing effects from Strapi admin first.');
      return;
    }

    // Create each text effect
    for (const effect of textEffectsData) {
      await strapi.entityService.create('api::text-effect.text-effect', {
        data: {
          ...effect,
          publishedAt: new Date().toISOString(), // Auto-publish
        },
      });
      console.log(`✅ Created: ${effect.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${textEffectsData.length} text effects!`);
  } catch (error) {
    console.error('❌ Error seeding text effects:', error);
    throw error;
  }
};
