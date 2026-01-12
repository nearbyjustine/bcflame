/**
 * Seed script for BC Flame customization data
 *
 * Usage:
 * node scripts/seed-customization-data.js
 *
 * Or with custom credentials:
 * ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpass node scripts/seed-customization-data.js
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let apiClient;

/**
 * Authenticate and get JWT token
 */
async function authenticate() {
  console.log('🔐 Authenticating...');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    console.log('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpass node scripts/seed-customization-data.js');
    process.exit(1);
  }

  try {
    const response = await axios.post(`${STRAPI_URL}/api/auth/local`, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const { jwt } = response.data;

    apiClient = axios.create({
      baseURL: STRAPI_URL,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Authentication successful\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data?.error?.message || error.message);
    console.log('\n💡 Tip: Make sure you have created a user account in Strapi');
    console.log('   You can use any user with proper permissions, not necessarily an admin');
    process.exit(1);
  }
}

async function seedBudStyles() {
  console.log('\n🌿 Seeding Bud Styles...');

  const budStyles = [
    // Trim Quality
    {
      name: 'Hand-Trimmed Premium',
      category: 'trim_quality',
      description: 'Expertly hand-trimmed for maximum trichome preservation and bag appeal',
      sort_order: 1
    },
    {
      name: 'Machine-Trimmed Standard',
      category: 'trim_quality',
      description: 'Precision machine-trimmed for consistent appearance and efficiency',
      sort_order: 2
    },
    {
      name: 'Wet Trim',
      category: 'trim_quality',
      description: 'Trimmed immediately post-harvest for faster processing and smoother smoke',
      sort_order: 3
    },
    {
      name: 'Dry Trim',
      category: 'trim_quality',
      description: 'Trimmed after drying for superior terpene and cannabinoid preservation',
      sort_order: 4
    },

    // Flower Grades
    {
      name: 'Premium A-Grade',
      category: 'flower_grade',
      description: 'Top-shelf whole flower with dense, frosty buds',
      sort_order: 5
    },
    {
      name: 'Smalls B-Grade',
      category: 'flower_grade',
      description: 'Smaller buds with same quality and potency as A-Grade',
      sort_order: 6
    },
    {
      name: 'Popcorn Buds',
      category: 'flower_grade',
      description: 'Budget-friendly small nugs perfect for pre-rolls',
      sort_order: 7
    },
    {
      name: 'Shake',
      category: 'flower_grade',
      description: 'Premium shake for value-conscious customers',
      sort_order: 8
    },

    // Visual Styles
    {
      name: 'Tightly Manicured',
      category: 'visual_style',
      description: 'Meticulously trimmed for pristine appearance',
      sort_order: 9
    },
    {
      name: 'Natural Craft Style',
      category: 'visual_style',
      description: 'Minimal trim preserving natural bud structure',
      sort_order: 10
    },
    {
      name: 'Frosty',
      category: 'visual_style',
      description: 'Heavy trichome coverage with crystalline appearance',
      sort_order: 11
    },
    {
      name: 'Dense Structure',
      category: 'visual_style',
      description: 'Compact, dense buds with weight',
      sort_order: 12
    },
    {
      name: 'Fluffy Structure',
      category: 'visual_style',
      description: 'Light, airy buds with expanded structure',
      sort_order: 13
    },
  ];

  let created = 0;
  for (const style of budStyles) {
    try {
      await apiClient.post('/api/bud-styles', { data: style });
      created++;
      console.log(`  ✅ Created: ${style.name}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('unique')) {
        console.log(`  ⏭️  Skipped: ${style.name} (already exists)`);
      } else {
        console.error(`  ❌ Failed: ${style.name}`, error.response?.data?.error?.message || error.message);
      }
    }
  }

  console.log(`✅ Bud Styles seeded: ${created}/${budStyles.length} created\n`);
}

async function seedBackgroundStyles() {
  console.log('🎨 Seeding Background Styles...');

  const backgrounds = [
    { name: 'Pure White', type: 'solid_color', color_hex: '#FFFFFF', sort_order: 1 },
    { name: 'Matte Black', type: 'solid_color', color_hex: '#000000', sort_order: 2 },
    { name: 'Premium Gold', type: 'solid_color', color_hex: '#FFD700', sort_order: 3 },
    { name: 'Forest Green', type: 'solid_color', color_hex: '#228B22', sort_order: 4 },
    { name: 'Royal Purple', type: 'solid_color', color_hex: '#7851A9', sort_order: 5 },
    { name: 'Sunset Gradient', type: 'gradient', color_hex: '#FF6B6B,#FFA500', sort_order: 6 },
    { name: 'Ocean Blue Gradient', type: 'gradient', color_hex: '#1E90FF,#00CED1', sort_order: 7 },
    { name: 'Wood Texture', type: 'texture', sort_order: 8 },
    { name: 'Marble Texture', type: 'texture', sort_order: 9 },
    { name: 'Canvas Texture', type: 'texture', sort_order: 10 },
  ];

  let created = 0;
  for (const bg of backgrounds) {
    try {
      await apiClient.post('/api/background-styles', { data: bg });
      created++;
      console.log(`  ✅ Created: ${bg.name}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('unique')) {
        console.log(`  ⏭️  Skipped: ${bg.name} (already exists)`);
      } else {
        console.error(`  ❌ Failed: ${bg.name}`, error.response?.data?.error?.message || error.message);
      }
    }
  }

  console.log(`✅ Background Styles seeded: ${created}/${backgrounds.length} created\n`);
}

async function seedFontStyles() {
  console.log('🔤 Seeding Font Styles...');

  const fonts = [
    { name: 'Modern Sans', font_family: 'Inter, sans-serif', category: 'sans_serif', sort_order: 1 },
    { name: 'Clean Geometric', font_family: 'Futura, sans-serif', category: 'sans_serif', sort_order: 2 },
    { name: 'Classic Serif', font_family: 'Georgia, serif', category: 'serif', sort_order: 3 },
    { name: 'Elegant Didot', font_family: 'Didot, serif', category: 'serif', sort_order: 4 },
    { name: 'Bold Display', font_family: 'Impact, sans-serif', category: 'display', sort_order: 5 },
    { name: 'Retro Groovy', font_family: 'Cooper Black, display', category: 'display', sort_order: 6 },
    { name: 'Handwritten Script', font_family: 'Brush Script MT, cursive', category: 'script', sort_order: 7 },
    { name: 'Elegant Calligraphy', font_family: 'Edwardian Script ITC, cursive', category: 'script', sort_order: 8 },
  ];

  let created = 0;
  for (const font of fonts) {
    try {
      await apiClient.post('/api/font-styles', { data: font });
      created++;
      console.log(`  ✅ Created: ${font.name}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('unique')) {
        console.log(`  ⏭️  Skipped: ${font.name} (already exists)`);
      } else {
        console.error(`  ❌ Failed: ${font.name}`, error.response?.data?.error?.message || error.message);
      }
    }
  }

  console.log(`✅ Font Styles seeded: ${created}/${fonts.length} created\n`);
}

async function seedPreBaggingOptions() {
  console.log('📦 Seeding Pre-Bagging Options...');

  const options = [
    {
      name: 'Premium Mylar Bags',
      packaging_type: 'mylar_bag',
      description: 'Smell-proof, moisture-resistant mylar bags with custom branding space',
      available_weights: ['3.5g', '7g', '14g', '28g'],
      sort_order: 1
    },
    {
      name: 'Glass Jars with Metal Lid',
      packaging_type: 'glass_jar',
      description: 'Premium glass jars for maximum freshness and reusability',
      available_weights: ['3.5g', '7g', '14g', '28g'],
      sort_order: 2
    },
    {
      name: 'Pre-Roll Tubes',
      packaging_type: 'preroll_tube',
      description: 'Pop-top tubes for individual pre-roll packaging',
      available_weights: ['0.5g', '1g'],
      sort_order: 3
    },
    {
      name: 'Child-Resistant Containers',
      packaging_type: 'child_resistant_container',
      description: 'Compliant child-resistant packaging meeting all regulations',
      available_weights: ['3.5g', '7g', '14g', '28g'],
      sort_order: 4
    },
    {
      name: 'Tin Containers',
      packaging_type: 'tin_container',
      description: 'Durable, reusable tin containers with premium feel',
      available_weights: ['3.5g', '7g', '14g'],
      sort_order: 5
    },
  ];

  let created = 0;
  for (const option of options) {
    try {
      await apiClient.post('/api/prebagging-options', { data: option });
      created++;
      console.log(`  ✅ Created: ${option.name}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('unique')) {
        console.log(`  ⏭️  Skipped: ${option.name} (already exists)`);
      } else {
        console.error(`  ❌ Failed: ${option.name}`, error.response?.data?.error?.message || error.message);
      }
    }
  }

  console.log(`✅ Pre-Bagging Options seeded: ${created}/${options.length} created\n`);
}

async function main() {
  console.log('🚀 BC Flame Customization Data Seeder');
  console.log(`📡 Target: ${STRAPI_URL}\n`);

  try {
    await authenticate();

    await seedBudStyles();
    await seedBackgroundStyles();
    await seedFontStyles();
    await seedPreBaggingOptions();

    console.log('🎉 All customization data seeded successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Check Strapi admin panel to verify the data');
    console.log('  2. Add photos to a product via Strapi admin');
    console.log('  3. Set customization_enabled = true on products');
    console.log('  4. Test the customization wizard at http://localhost:3000/products');
  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
