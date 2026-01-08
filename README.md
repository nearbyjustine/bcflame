# BC Flame Premium Client Portal

B2B partner portal for approved cannabis product partners featuring product browsing, inventory tracking, and custom packaging orders.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Strapi CMS
- **Database**: PostgreSQL 16
- **Orchestration**: Docker Compose

## Project Structure

```
bcflame/
├── frontend/          # Next.js application
├── backend/           # Strapi CMS
├── shared/            # Shared TypeScript types
├── nginx/             # Nginx config for production
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Prerequisites

- Docker Desktop installed
- Node.js 18+ (for local development)
- Git

### Initial Setup

1. Clone the repository and navigate to the project directory:
```bash
cd /Users/justinecastaneda/Desktop/bcflame
```

2. Create environment files:
```bash
cp .env.example .env
```

3. Generate secure secrets for .env:
```bash
# JWT Secret
openssl rand -base64 32

# APP_KEYS (generate 4 keys)
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"

# API Token Salt
openssl rand -base64 32

# Transfer Token Salt
openssl rand -base64 32
```

4. Update the `.env` file with the generated secrets

5. Start all services with Docker Compose:
```bash
docker-compose up -d
```

6. View logs to monitor startup:
```bash
docker-compose logs -f
```

### Access Services

- **Strapi Admin**: http://localhost:1337/admin
- **Next.js Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### First-Time Strapi Setup

1. Visit http://localhost:1337/admin
2. Create your admin account
3. Content types will be configured automatically via the schema files

## Development Workflow

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f strapi
docker-compose logs -f frontend
```

### Restart After Changes
```bash
# Restart specific service
docker-compose restart strapi

# Rebuild after Dockerfile changes
docker-compose up -d --build
```

### Clean Reset (removes all data)
```bash
docker-compose down -v
```

## Features (Phase 1)

- ✅ JWT-based authentication
- ✅ Partner user management
- ✅ Protected routes with middleware
- ✅ Strapi CMS with PostgreSQL
- ✅ Docker containerization
- ✅ Vitest test infrastructure with coverage reporting
- ✅ Product content type and TypeScript definitions
- ✅ Product catalog page with API integration
- ✅ Product listing and filtering UI

## Recent Progress

**Product Catalog Foundation (Phase 2.1)**
- Added Product content type in Strapi with fields: name, sku, description, category, price_range, thc_content, cbd_content, strain_type, product_image
- Created TypeScript type definitions (`frontend/src/types/product.ts`)
- Implemented products API client (`frontend/src/lib/api/products.ts`) with unit tests
- Built products page with grid layout (`frontend/src/app/(portal)/products/page.tsx`)
- Created ProductCard component (`frontend/src/components/products/ProductCard.tsx`) with tests
- Set up Vitest testing infrastructure with jsdom environment
- Configured test coverage reporting (target: 70%+)

## What's Next

**Immediate Next Steps:**
1. Add product search and advanced filtering (by category, strain type, THC/CBD levels)
2. Implement product detail page with full specifications
3. Add product images and media gallery support
4. Create inventory tracking system with stock levels
5. Build product comparison feature

**Phase 2 Remaining Features:**
- Smart Packaging Customization Studio
- Order inquiry system with inquiry number generation
- Marketing media hub for downloadable assets
- Analytics dashboard for product performance

## Support

For questions or issues, contact the development team.
