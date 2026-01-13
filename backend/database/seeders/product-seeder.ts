/**
 * Product Seeder
 * Seeds products from bcflame-scrape.json into Strapi database
 */

import type { Strapi } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import {
  transformPricing,
  transformFeatures,
  isValidCategory,
  sanitizeSKU,
} from '../../src/utils/product-transformer';

/**
 * Sanitize product name for safe filesystem usage
 * Prevents path traversal attacks
 */
function sanitizeProductName(name: string): string {
  return name
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '')  // Remove parent directory references
    .replace(/\0/g, '')    // Remove null bytes
    .trim();
}

/**
 * Upload product images from local filesystem to Strapi
 * Returns array of uploaded file IDs
 */
async function uploadProductImages(
  strapi: Strapi,
  productName: string
): Promise<number[]> {
  const imageIds: number[] = [];

  // Sanitize product name to prevent path traversal
  const sanitizedName = sanitizeProductName(productName);

  // Path to product images (assuming they're in frontend/public/product_images)
  const imagesDir = path.join(
    strapi.dirs.app.root,
    '..',
    'frontend',
    'public',
    'product_images',
    sanitizedName
  );

  // Check if images directory exists
  if (!fs.existsSync(imagesDir)) {
    console.warn(`⚠️  No images found for product: ${sanitizedName}`);
    return imageIds;
  }

  // Read all image files from directory
  const imageFiles = fs.readdirSync(imagesDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  });

  if (imageFiles.length === 0) {
    console.warn(`⚠️  No valid image files found for product: ${sanitizedName}`);
    return imageIds;
  }

  // Sort images: single product images first (without -3b), then 3-piece images (with -3b)
  imageFiles.sort((a, b) => {
    const aHas3b = a.toLowerCase().includes('-3b');
    const bHas3b = b.toLowerCase().includes('-3b');

    // Files without '-3b' come first. Number(aHas3b) - Number(bHas3b) achieves this.
    const primarySort = Number(aHas3b) - Number(bHas3b);
    if (primarySort !== 0) return primarySort;

    // Otherwise, sort alphabetically
    return a.localeCompare(b);
  });

  console.log(`  📸 Found ${imageFiles.length} images for ${sanitizedName}`);

  // Upload each image
  for (const imageFile of imageFiles) {
    const imagePath = path.join(imagesDir, imageFile);
    const stats = fs.statSync(imagePath);

    try {
      // Create a file object that mimics a multipart upload
      const fileData = {
        path: imagePath,
        name: imageFile,
        type: `image/${path.extname(imageFile).slice(1).toLowerCase().replace('jpg', 'jpeg')}`,
        size: stats.size,
      };

      // Upload file to Strapi using the upload service
      const uploadedFiles = await strapi.plugins.upload.services.upload.upload({
        data: {
          fileInfo: {
            name: imageFile,
            alternativeText: `${sanitizedName} product image`,
            caption: sanitizedName,
          },
        },
        files: fileData,
      });

      // uploadedFiles is an array, get the first (and only) file
      const uploadedFile = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;

      if (uploadedFile && uploadedFile.id) {
        imageIds.push(uploadedFile.id);
        console.log(`    ✅ Uploaded: ${imageFile} (ID: ${uploadedFile.id})`);
      } else {
        console.error(`    ❌ Upload succeeded but no ID returned for ${imageFile}`);
      }
    } catch (error) {
      console.error(`    ❌ Failed to upload ${imageFile}:`, error);
    }
  }

  return imageIds;
}

interface ProductPricingComponent {
  weight: '7g' | '14g' | '28g';
  amount: number;
  currency: string;
}

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

export async function seedProducts(strapi: Strapi) {
  console.log('🌱 Starting product seeder...');

  try {
    // Read scraped data
    const scrapedDataPath = path.join(strapi.dirs.app.root, '..', 'bcflame-scrape.json');
    const scrapedData: ScrapedData = JSON.parse(
      fs.readFileSync(scrapedDataPath, 'utf-8')
    );

    console.log(`Found ${scrapedData.products.length} products to seed`);

    // Check if products already exist
    const productCount = await strapi.entityService.count(
      'api::product.product'
    );

    if (productCount > 0) {
      console.log('⚠️  Products already exist. Skipping seeding.');
      console.log(`Found ${productCount} existing products`);
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

      // Map pricing with proper types
      const pricingComponents: ProductPricingComponent[] = pricing.map(p => ({
        weight: p.weight as '7g' | '14g' | '28g',
        amount: p.amount,
        currency: p.currency,
      }));

      // Calculate base_price_per_gram from the smallest weight tier
      // This provides a reasonable per-gram price for any weight
      let basePricePerGram = 0;
      if (pricingComponents.length > 0) {
        // Find the 7g pricing (smallest tier) to calculate per-gram price
        const smallestTier = pricingComponents.find(p => p.weight === '7g');
        if (smallestTier) {
          basePricePerGram = parseFloat((smallestTier.amount / 7).toFixed(2));
        } else {
          // Fallback: use first available tier
          const firstTier = pricingComponents[0];
          const grams = parseInt(firstTier.weight.replace('g', ''));
          basePricePerGram = parseFloat((firstTier.amount / grams).toFixed(2));
        }
      }

      // Upload product images
      console.log(`  📦 Uploading images for ${product.name}...`);
      const imageIds = await uploadProductImages(strapi, product.name);

      // Create product entry
      // Note: Type assertion for pricing is necessary due to Strapi's complex component type system
      const createdProduct = await strapi.entityService.create(
        'api::product.product',
        {
          data: {
            name: product.name,
            sku: sanitizedSKU,
            // Category is validated above with isValidCategory(), safe to assert
            category: product.category as 'Indica' | 'Hybrid' | 'Sativa',
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
            pricing: pricingComponents as any,
            base_price_per_gram: basePricePerGram,
            pricing_model: 'per_gram',
            features,
            images: imageIds.length > 0 ? imageIds : undefined,
            customization_enabled: true,
            available_photos: imageIds.length > 0 ? imageIds : undefined,
            publishedAt: new Date(),
          },
        }
      );

      console.log(`✅ Created product: ${createdProduct.name} (ID: ${createdProduct.id}) with ${imageIds.length} images`);
    }

    console.log('🎉 Product seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

export default seedProducts;
