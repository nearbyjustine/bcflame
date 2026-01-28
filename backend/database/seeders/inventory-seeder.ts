/**
 * Inventory Seeder
 * Seeds inventory records for existing products
 */

import type { Strapi } from '@strapi/strapi';
import { WEIGHT_UNIT } from '../../src/constants/units';

interface InventoryData {
  product: number | string;
  quantity_in_stock: number;
  unit: typeof WEIGHT_UNIT;
  reorder_point: number;
  reorder_quantity: number;
  location?: string;
  batch_number?: string;
}

interface ProductWithFields {
  id: number | string;
  name: string;
  sku: string;
}

export async function seedInventory(strapi: Strapi) {
  console.log('🌱 Starting inventory seeder...');

  try {
    // Check if inventory already exists
    const inventoryCount = await strapi.entityService.count(
      'api::inventory.inventory'
    );

    if (inventoryCount > 0) {
      console.log('⚠️  Inventory already exists. Skipping seeding.');
      console.log(`Found ${inventoryCount} existing inventory records`);
      return;
    }

    // Get all products
    const products = await strapi.entityService.findMany(
      'api::product.product',
      {
        fields: ['id', 'name', 'sku'],
      }
    ) as ProductWithFields[];

    if (!products || products.length === 0) {
      console.log('⚠️  No products found. Run product seeder first.');
      return;
    }

    console.log(`Found ${products.length} products to create inventory for`);

    // Create inventory for each product with varied stock levels
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Vary stock levels for testing:
      // - Some products: well stocked (50+ P)
      // - Some products: low stock (near reorder point)
      // - Some products: out of stock (0 P)
      let quantity: number;
      const stockType = i % 5; // Cycle through 5 patterns

      switch (stockType) {
        case 0:
          quantity = 75; // Well stocked
          break;
        case 1:
          quantity = 100; // Very well stocked
          break;
        case 2:
          quantity = 15; // Low stock (at reorder point)
          break;
        case 3:
          quantity = 0; // Out of stock
          break;
        case 4:
        default:
          quantity = 50; // Normal stock
          break;
      }

      const inventoryData: InventoryData = {
        product: product.id,
        quantity_in_stock: quantity,
        unit: WEIGHT_UNIT,
        reorder_point: 15,
        reorder_quantity: 50,
        location: `Warehouse ${String.fromCharCode(65 + (i % 3))}`, // A, B, or C
        batch_number: `BATCH-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      };

      await strapi.entityService.create(
        'api::inventory.inventory',
        {
          data: inventoryData,
        }
      );

      const stockLabel = quantity === 0 ? 'OUT OF STOCK' :
                         quantity <= 15 ? 'LOW STOCK' :
                         'IN STOCK';

      console.log(`✅ Created inventory for ${product.name}: ${quantity} ${WEIGHT_UNIT} (${stockLabel})`);
    }

    console.log('🎉 Inventory seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
    throw error;
  }
}

export default seedInventory;
