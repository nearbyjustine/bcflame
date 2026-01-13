/**
 * Customization Seeder
 * Seeds customization options: background styles, bud styles, font styles, pre-bagging options
 */

import type { Strapi } from '@strapi/strapi';

// ============================================================================
// SEED DATA
// ============================================================================

type BackgroundType = 'solid_color' | 'gradient' | 'texture' | 'image';
type BudCategory = 'trim_quality' | 'flower_grade' | 'visual_style';
type FontCategory = 'sans_serif' | 'serif' | 'display' | 'script';
type PackagingType = 'mylar_bag' | 'glass_jar' | 'preroll_tube' | 'child_resistant_container' | 'tin_container';

const backgroundStyles: { name: string; type: BackgroundType; color_hex: string; sort_order: number }[] = [
  { name: 'Classic White', type: 'solid_color', color_hex: '#FFFFFF', sort_order: 1 },
  { name: 'Midnight Black', type: 'solid_color', color_hex: '#000000', sort_order: 2 },
  { name: 'Forest Green', type: 'solid_color', color_hex: '#228B22', sort_order: 3 },
  { name: 'Royal Purple', type: 'solid_color', color_hex: '#6B3FA0', sort_order: 4 },
  { name: 'Sunset Gradient', type: 'gradient', color_hex: '#FF6B35', sort_order: 5 },
  { name: 'Ocean Gradient', type: 'gradient', color_hex: '#0077B6', sort_order: 6 },
  { name: 'Marble Texture', type: 'texture', color_hex: '#EEEEEE', sort_order: 7 },
  { name: 'Cannabis Leaf Pattern', type: 'texture', color_hex: '#2D5016', sort_order: 8 },
];

const budStyles: { name: string; category: BudCategory; description: string; sort_order: number }[] = [
  { name: 'AAA Grade', category: 'flower_grade', description: 'Premium top-shelf quality buds', sort_order: 1 },
  { name: 'AAAA Grade', category: 'flower_grade', description: 'Ultra-premium craft quality', sort_order: 2 },
  { name: 'Hand Trimmed', category: 'trim_quality', description: 'Carefully hand-trimmed for perfect appearance', sort_order: 3 },
  { name: 'Machine Trimmed', category: 'trim_quality', description: 'Efficiently machine-trimmed for consistency', sort_order: 4 },
  { name: 'Dense Nugs', category: 'visual_style', description: 'Tight, dense bud structure', sort_order: 5 },
  { name: 'Fluffy Nugs', category: 'visual_style', description: 'Airy, light bud structure', sort_order: 6 },
  { name: 'Purple Hues', category: 'visual_style', description: 'Distinctive purple coloration', sort_order: 7 },
  { name: 'Frosty Trichomes', category: 'visual_style', description: 'Heavy trichome coverage', sort_order: 8 },
];

const fontStyles: { name: string; font_family: string; category: FontCategory; sort_order: number }[] = [
  { name: 'Modern Sans', font_family: 'Inter', category: 'sans_serif', sort_order: 1 },
  { name: 'Clean Helvetica', font_family: 'Helvetica Neue', category: 'sans_serif', sort_order: 2 },
  { name: 'Classic Serif', font_family: 'Georgia', category: 'serif', sort_order: 3 },
  { name: 'Elegant Times', font_family: 'Times New Roman', category: 'serif', sort_order: 4 },
  { name: 'Bold Display', font_family: 'Bebas Neue', category: 'display', sort_order: 5 },
  { name: 'Impact Header', font_family: 'Impact', category: 'display', sort_order: 6 },
  { name: 'Elegant Script', font_family: 'Great Vibes', category: 'script', sort_order: 7 },
  { name: 'Handwritten', font_family: 'Dancing Script', category: 'script', sort_order: 8 },
];

const prebaggingOptions: { name: string; packaging_type: PackagingType; available_weights: string[]; description: string; unit_size: number; sort_order: number }[] = [
  {
    name: 'Premium Mylar (3.5g)',
    packaging_type: 'mylar_bag',
    available_weights: ['3.5g'],
    description: 'Heat-sealed smell-proof mylar bag',
    unit_size: 3.5,
    sort_order: 1,
  },
  {
    name: 'Premium Mylar (7g)',
    packaging_type: 'mylar_bag',
    available_weights: ['7g'],
    description: 'Heat-sealed smell-proof mylar bag',
    unit_size: 7,
    sort_order: 2,
  },
  {
    name: 'Premium Mylar (14g)',
    packaging_type: 'mylar_bag',
    available_weights: ['14g'],
    description: 'Heat-sealed smell-proof mylar bag',
    unit_size: 14,
    sort_order: 3,
  },
  {
    name: 'Premium Mylar (28g)',
    packaging_type: 'mylar_bag',
    available_weights: ['28g'],
    description: 'Large heat-sealed smell-proof mylar bag',
    unit_size: 28,
    sort_order: 4,
  },
  {
    name: 'Glass Stash Jar',
    packaging_type: 'glass_jar',
    available_weights: ['3.5g', '7g'],
    description: 'Airtight UV-protected glass jar',
    unit_size: 7,
    sort_order: 5,
  },
  {
    name: 'Child-Resistant Container',
    packaging_type: 'child_resistant_container',
    available_weights: ['3.5g', '7g', '14g'],
    description: 'Compliant child-resistant packaging',
    unit_size: 14,
    sort_order: 6,
  },
  {
    name: 'Preroll Tube (5pk)',
    packaging_type: 'preroll_tube',
    available_weights: ['3.5g'],
    description: '5-pack preroll tube container',
    unit_size: 3.5,
    sort_order: 7,
  },
  {
    name: 'Premium Tin',
    packaging_type: 'tin_container',
    available_weights: ['7g', '14g'],
    description: 'Collectible metal tin container',
    unit_size: 14,
    sort_order: 8,
  },
];

// ============================================================================
// SEEDER FUNCTIONS
// ============================================================================

async function seedBackgroundStyles(strapi: Strapi): Promise<number> {
  console.log('  📦 Seeding background styles...');

  const existingCount = await strapi.entityService.count('api::background-style.background-style');
  if (existingCount > 0) {
    console.log(`  ⚠️  Background styles already exist (${existingCount} entries). Skipping.`);
    return existingCount;
  }

  let created = 0;
  for (const style of backgroundStyles) {
    await strapi.entityService.create('api::background-style.background-style', {
      data: {
        ...style,
        publishedAt: new Date(),
      },
    });
    created++;
  }

  console.log(`  ✅ Created ${created} background styles`);
  return created;
}

async function seedBudStyles(strapi: Strapi): Promise<number> {
  console.log('  📦 Seeding bud styles...');

  const existingCount = await strapi.entityService.count('api::bud-style.bud-style');
  if (existingCount > 0) {
    console.log(`  ⚠️  Bud styles already exist (${existingCount} entries). Skipping.`);
    return existingCount;
  }

  let created = 0;
  for (const style of budStyles) {
    await strapi.entityService.create('api::bud-style.bud-style', {
      data: {
        ...style,
        publishedAt: new Date(),
      },
    });
    created++;
  }

  console.log(`  ✅ Created ${created} bud styles`);
  return created;
}

async function seedFontStyles(strapi: Strapi): Promise<number> {
  console.log('  📦 Seeding font styles...');

  const existingCount = await strapi.entityService.count('api::font-style.font-style');
  if (existingCount > 0) {
    console.log(`  ⚠️  Font styles already exist (${existingCount} entries). Skipping.`);
    return existingCount;
  }

  let created = 0;
  for (const style of fontStyles) {
    await strapi.entityService.create('api::font-style.font-style', {
      data: {
        ...style,
        publishedAt: new Date(),
      },
    });
    created++;
  }

  console.log(`  ✅ Created ${created} font styles`);
  return created;
}

async function seedPrebaggingOptions(strapi: Strapi): Promise<number> {
  console.log('  📦 Seeding pre-bagging options...');

  const existingCount = await strapi.entityService.count('api::prebagging-option.prebagging-option');
  if (existingCount > 0) {
    console.log(`  ⚠️  Pre-bagging options already exist (${existingCount} entries). Skipping.`);
    return existingCount;
  }

  let created = 0;
  for (const option of prebaggingOptions) {
    await strapi.entityService.create('api::prebagging-option.prebagging-option', {
      data: {
        ...option,
        unit_size_unit: 'g',
        publishedAt: new Date(),
      },
    });
    created++;
  }

  console.log(`  ✅ Created ${created} pre-bagging options`);
  return created;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function seedCustomization(strapi: Strapi) {
  console.log('🌱 Starting customization seeder...');

  try {
    await seedBackgroundStyles(strapi);
    await seedBudStyles(strapi);
    await seedFontStyles(strapi);
    await seedPrebaggingOptions(strapi);

    console.log('🎉 Customization seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding customization options:', error);
    throw error;
  }
}

export default seedCustomization;
