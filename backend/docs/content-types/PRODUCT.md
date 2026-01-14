# Product Content Type

## Overview
Content type for cannabis product catalog. Supports multiple pricing tiers, product features, and rich product information.

## Content Type Configuration

**API ID**: `product`
**Display Name**: Product
**Type**: Collection Type
**Draft & Publish**: Enabled

## Fields

### Basic Information
| Field Name | Type | Required | Unique | Default | Notes |
|------------|------|----------|--------|---------|-------|
| name | Text (Short) | Yes | No | - | Product name (e.g., "9 Pound Hammer") |
| sku | Text (Short) | Yes | Yes | - | Product SKU (e.g., "302") |
| category | Enumeration | Yes | No | - | Values: Indica, Hybrid |
| tagline | Text (Short) | No | No | - | Short marketing tagline |
| description | Text (Long) | Yes | No | - | Product description (paragraph) |
| full_description | Rich Text | No | No | - | Detailed product description with formatting |

### Product Details
| Field Name | Type | Required | Unique | Default | Notes |
|------------|------|----------|--------|---------|-------|
| best_for | Text (Long) | No | No | - | Best use cases (e.g., "Deep relaxation, evening use") |
| warning | Text (Long) | No | No | - | Product warning/note |
| thc_content | Text (Short) | No | No | - | THC percentage (e.g., "20%") |
| flavor_profile | Text (Long) | No | No | - | Flavor description |
| product_url | Text (Short) | No | No | - | External product URL |

### Flags
| Field Name | Type | Required | Unique | Default | Notes |
|------------|------|----------|--------|---------|-------|
| on_sale | Boolean | No | No | false | Is product currently on sale |
| featured | Boolean | No | No | false | Should display in featured section |
| sort_order | Number (integer) | No | No | 0 | Order for sorting (lower = first) |

### Media
| Field Name | Type | Required | Unique | Default | Notes |
|------------|------|----------|--------|---------|-------|
| images | Media (multiple) | No | No | - | Product images |

### Components
| Field Name | Type | Required | Repeatable | Notes |
|------------|------|----------|------------|-------|
| pricing | Component: product.pricing | Yes | Yes | Multiple price tiers (7g, 14g, 28g) |
| features | Component: product.feature | No | Yes | Product features (e.g., "Super Fast Shipping") |

## Components

### product.pricing (Repeatable)
**Display Name**: Product Pricing
**Category**: product

| Field Name | Type | Required | Default | Notes |
|------------|------|----------|---------|-------|
| weight | Enumeration | Yes | - | Values: 7g, 14g, 28g |
| amount | Decimal | Yes | - | Price amount (e.g., 55.00) |
| currency | Text (Short) | No | USD | Currency code (default: USD) |

### product.feature (Repeatable)
**Display Name**: Product Feature
**Category**: product

| Field Name | Type | Required | Default | Notes |
|------------|------|----------|---------|-------|
| label | Text (Short) | Yes | - | Feature text (e.g., "Satisfaction Guaranteed") |
| icon | Text (Short) | No | - | Icon name/class (optional) |

## API Permissions

### Public Role
- `find`: ✅ Enabled (list all products)
- `findOne`: ✅ Enabled (get single product)
- `create`: ❌ Disabled
- `update`: ❌ Disabled
- `delete`: ❌ Disabled

### Authenticated Role
- `find`: ✅ Enabled (list all products)
- `findOne`: ✅ Enabled (get single product)
- `create`: ❌ Disabled
- `update`: ❌ Disabled
- `delete`: ❌ Disabled

### Admin Role
- All actions: ✅ Enabled

## Example Data Structure

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "name": "9 Pound Hammer",
      "sku": "302",
      "category": "Indica",
      "tagline": "Heavy-Hitting Relief You Can Feel",
      "description": "Looking for the kind of chill that melts stress like butter? Nine Pound Hammer lives up to its name...",
      "full_description": "Crafted from a legendary trio of strains, Nine Pound Hammer carries a rich, fruity aroma...",
      "best_for": "Deep relaxation, evening use, stress & sleep support",
      "warning": "You might not want to get off the couch after this one.",
      "thc_content": null,
      "flavor_profile": null,
      "product_url": "https://bcflameonline.com/shop/9-pound-hammer/",
      "on_sale": true,
      "featured": false,
      "sort_order": 0,
      "pricing": [
        {
          "id": 1,
          "weight": "7g",
          "amount": 55.00,
          "currency": "USD"
        },
        {
          "id": 2,
          "weight": "14g",
          "amount": 110.00,
          "currency": "USD"
        },
        {
          "id": 3,
          "weight": "28g",
          "amount": 200.00,
          "currency": "USD"
        }
      ],
      "features": [
        {
          "id": 1,
          "label": "Satisfaction Guaranteed",
          "icon": null
        },
        {
          "id": 2,
          "label": "Super Fast Shipping",
          "icon": null
        },
        {
          "id": 3,
          "label": "Secure Payments",
          "icon": null
        }
      ],
      "images": {
        "data": []
      },
      "createdAt": "2026-01-08T13:00:00.000Z",
      "updatedAt": "2026-01-08T13:00:00.000Z",
      "publishedAt": "2026-01-08T13:00:00.000Z"
    }
  }
}
```

## API Endpoints

### List Products
```http
GET /api/products
GET /api/products?populate=*
GET /api/products?filters[category][$eq]=Indica
GET /api/products?filters[on_sale][$eq]=true
GET /api/products?sort=name:asc
GET /api/products?pagination[page]=1&pagination[pageSize]=10
```

### Get Single Product
```http
GET /api/products/:id
GET /api/products/:id?populate=*
```

### Filter Examples
```http
# Get only Indica products
GET /api/products?filters[category][$eq]=Indica

# Get featured products
GET /api/products?filters[featured][$eq]=true

# Get products on sale
GET /api/products?filters[on_sale][$eq]=true

# Search by name
GET /api/products?filters[name][$containsi]=kush

# Complex filter (Indica AND on sale)
GET /api/products?filters[category][$eq]=Indica&filters[on_sale][$eq]=true
```

## Test Checklist

### Manual Testing (Admin Panel)
- [ ] Create content type with all fields
- [ ] Create pricing component with correct fields
- [ ] Create features component with correct fields
- [ ] Add pricing and features to Product content type
- [ ] Configure API permissions for Public, Authenticated, Admin roles
- [ ] Create sample product entry
- [ ] Verify all fields save correctly
- [ ] Test Draft & Publish workflow

### API Testing
- [ ] GET /api/products returns array of products
- [ ] GET /api/products/:id returns single product with correct structure
- [ ] Filtering by category works
- [ ] Filtering by on_sale works
- [ ] Sorting by name works
- [ ] Pagination works
- [ ] Populate parameter includes pricing and features
- [ ] Unauthenticated users can read products (find, findOne)
- [ ] Authenticated users can read products (find, findOne)
- [ ] Non-admin users cannot create/update/delete products

## Seed Data

See `/bcflame-scrape.json` for 6 products to import:
1. 9 Pound Hammer (Indica) - SKU: 302
2. Gas Gummies (Hybrid) - SKU: 402
3. Gas Mask (Indica) - SKU: 304
4. Kosher Kush (Indica) - SKU: 301
5. Platinum Bubba Kush (Indica) - SKU: 303
6. Tom Ford Pink Kush (Indica) - SKU: 305

## Notes

- Images from bcflame-scrape.json are not included - use placeholders or scrape separately
- All pricing follows USD currency
- Pricing tiers are consistent: 7g, 14g, 28g
- Features are consistent across all products
- THC content is only provided for Gas Gummies (20%)
- Flavor profile is only provided for Gas Gummies
