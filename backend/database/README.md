# Database Seeders

## Overview

This directory contains database seeding scripts for the BC Flame Premium Client Portal. Seeders populate the database with initial data from the scraped product catalog.

## Available Seeders

### Product Seeder
**Location**: `seeders/product-seeder.ts`
**Source Data**: `/bcflame-scrape.json` (root directory)
**Content Type**: `api::product.product`

Seeds 6 cannabis products with:
- Product details (name, SKU, category, descriptions)
- Pricing tiers (7g, 14g, 28g)
- Product features
- Metadata (on_sale, tagline, warnings, etc.)

## Prerequisites

1. **Database Running**: Ensure PostgreSQL container is running
   ```bash
   npm run db:setup
   # or
   docker-compose up -d postgres
   ```

2. **Backend Dependencies Installed**:
   ```bash
   cd backend
   npm install
   ```

3. **Content Types Created**: The Product content type schema must exist in Strapi
   - Files created:
     - `src/api/product/content-types/product/schema.json`
     - `src/components/product/pricing.json`
     - `src/components/product/feature.json`
   - Strapi will auto-create database tables on first start

## Running Seeders

### Method 1: Using npm script (Recommended)
```bash
# From backend directory
npm run seed
```

### Method 2: Direct execution
```bash
# From backend directory
ts-node database/seed.ts
```

### Method 3: After Strapi is running
If you want to seed after Strapi is already running, you'll need to stop it first to avoid conflicts:
```bash
# Stop Strapi dev server
# Then run seeder
npm run seed
# Start Strapi again
npm run develop
```

## Seeder Behavior

- **Idempotent**: Seeders check if data already exists before inserting
- **Skip if exists**: If products already exist, seeding is skipped with a warning
- **Auto-publish**: All products are published immediately (not saved as drafts)
- **Error handling**: Detailed error messages for troubleshooting

## Expected Output

```
🚀 Starting database seeding...

🌱 Starting product seeder...
Found 6 products to seed
Seeding product: 9 Pound Hammer (SKU: 302)
✅ Created product: 9 Pound Hammer (ID: 1)
Seeding product: Gas Gummies (SKU: 402)
✅ Created product: Gas Gummies (ID: 2)
Seeding product: Gas Mask (SKU: 304)
✅ Created product: Gas Mask (ID: 3)
Seeding product: Kosher Kush (SKU: 301)
✅ Created product: Kosher Kush (ID: 4)
Seeding product: Platinum Bubba Kush (SKU: 303)
✅ Created product: Platinum Bubba Kush (ID: 5)
Seeding product: Tom Ford Pink Kush (SKU: 305)
✅ Created product: Tom Ford Pink Kush (ID: 6)
🎉 Product seeding completed successfully!

✅ All seeders completed successfully!
```

## Verifying Seeded Data

### Via Strapi Admin Panel
1. Start Strapi: `npm run develop`
2. Open http://localhost:1337/admin
3. Navigate to Content Manager → Products
4. You should see 6 products listed

### Via API
```bash
# Get all products
curl http://localhost:1337/api/products

# Get single product
curl http://localhost:1337/api/products/1

# Get products with populated relations
curl http://localhost:1337/api/products?populate=*
```

### Via psql
```bash
# Connect to database
docker exec -it bcflame_postgres psql -U strapi -d bcflame

# Check products
SELECT id, name, sku, category FROM products;

# Check pricing components
SELECT * FROM components_product_pricings;

# Check features components
SELECT * FROM components_product_features;
```

## Troubleshooting

### Error: "Cannot find module 'bcflame-scrape.json'"
**Solution**: Ensure `bcflame-scrape.json` exists in the project root directory (one level up from backend/)

### Error: "Product content type not found"
**Solution**:
1. Start Strapi dev server first: `npm run develop`
2. Strapi will auto-create database tables from schema files
3. Stop Strapi
4. Run seeder: `npm run seed`

### Error: "Database connection failed"
**Solution**: Ensure PostgreSQL container is running:
```bash
npm run db:setup
# Wait for health check to pass
docker ps | grep bcflame_postgres
```

### Products already exist
**Output**: `⚠️  Products already exist. Skipping seeding.`
**Solution**: This is expected behavior. If you want to re-seed:
1. Delete products via Strapi admin panel, OR
2. Reset database: `npm run db:reset` (WARNING: deletes ALL data)

## Resetting Database

To completely reset the database and re-seed:

```bash
# From project root
npm run db:reset  # Removes container and volume
npm run db:setup  # Creates fresh database

# From backend directory
npm run develop   # Start Strapi (creates tables)
# Stop Strapi (Ctrl+C)
npm run seed      # Run seeders
npm run develop   # Start Strapi again
```

## Adding New Seeders

1. Create new seeder file in `seeders/` directory
2. Export an async function that accepts `strapi` instance
3. Add seeder to `database/seed.ts` runner
4. Run `npm run seed`

Example:
```typescript
// seeders/my-seeder.ts
export async function seedMyData(strapi: any) {
  console.log('🌱 Seeding my data...');

  const existingData = await strapi.entityService.findMany(
    'api::my-content-type.my-content-type'
  );

  if (existingData && existingData.length > 0) {
    console.log('⚠️  Data already exists. Skipping.');
    return;
  }

  // Seed logic here

  console.log('✅ My data seeded successfully!');
}
```

## Next Steps

After seeding products:
1. Configure API permissions in Strapi admin (Settings → Roles → Public/Authenticated)
2. Test API endpoints
3. Seed product images (if available)
4. Proceed to frontend integration
