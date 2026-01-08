/**
 * Product Seeder
 * Seeds products from bcflame-scrape.json into Strapi database
 */

import fs from 'fs';
import path from 'path';
import {
  transformPricing,
  transformFeatures,
  isValidCategory,
  sanitizeSKU,
} from '../../src/utils/product-transformer';

interface ProductData {
  id: number;
  name: string;
  sku: string;
  category: string;
  url: string;
  on_sale: boolean;
  tagline?: string;
  description?: string;
  full_description?: string;
  best_for?: string;
  warning?: string;
  thc_content?: string;
  flavor_profile?: string;
  pricing: {
    [key: string]: {
      amount: number;
      currency: string;
    };
  };
  quantity_options: string[];
  features: string[];
}

interface ScrapedData {
  products: ProductData[];
}

export async function seedProducts(strapi: any) {
  console.log('🌱 Starting product seeder...');

  try {
    // Read scraped data
    const scrapedDataPath = path.join(process.cwd(), '..', 'bcflame-scrape.json');
    const scrapedData: ScrapedData = JSON.parse(
      fs.readFileSync(scrapedDataPath, 'utf-8')
    );

    console.log(`Found ${scrapedData.products.length} products to seed`);

    // Check if products already exist
    const existingProducts = await strapi.entityService.findMany(
      'api::product.product',
      {
        filters: {},
      }
    );

    if (existingProducts && existingProducts.length > 0) {
      console.log('⚠️  Products already exist. Skipping seeding.');
      console.log(`Found ${existingProducts.length} existing products`);
      return;
    }

    // Seed each product
    for (const product of scrapedData.products) {
      console.log(`Seeding product: ${product.name} (SKU: ${product.sku})`);

      // Validate category
      if (!isValidCategory(product.category)) {
        console.warn(
          `⚠️  Invalid category for ${product.name}: ${product.category}. Skipping.`
        );
        continue;
      }

      // Transform pricing data
      const pricing = transformPricing(product.quantity_options, product.pricing);

      // Transform features data
      const features = transformFeatures(product.features);

      // Sanitize SKU
      const sanitizedSKU = sanitizeSKU(product.sku);

      // Create product entry
      const createdProduct = await strapi.entityService.create(
        'api::product.product',
        {
          data: {
            name: product.name,
            sku: sanitizedSKU,
            category: product.category,
            tagline: product.tagline || null,
            description: product.description || '',
            full_description: product.full_description || null,
            best_for: product.best_for || null,
            warning: product.warning || null,
            thc_content: product.thc_content || null,
            flavor_profile: product.flavor_profile || null,
            product_url: product.url,
            on_sale: product.on_sale,
            featured: false,
            sort_order: 0,
            pricing,
            features,
            publishedAt: new Date(),
          },
        }
      );

      console.log(`✅ Created product: ${createdProduct.name} (ID: ${createdProduct.id})`);
    }

    console.log('🎉 Product seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

export default seedProducts;
