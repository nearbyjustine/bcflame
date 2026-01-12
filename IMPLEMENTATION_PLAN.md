# BC Flame Implementation Plan

**Last Updated:** 2026-01-13
**Current Phase:** Product Catalog (Phase 2.1)

---

## Project Overview

BC Flame Premium Client Portal is a B2B cannabis partner portal with:
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Strapi 4.16.2 CMS + PostgreSQL 16
- **Deployment:** Docker containerized
- **Testing:** Vitest (TDD approach)

**Live Services:**
- Frontend: http://localhost:3000
- Strapi Admin: http://localhost:1337/admin
- Strapi API: http://localhost:1337/api
- PostgreSQL: localhost:5432

---

## Recent Session Summary (2026-01-13)

### ✅ Completed: Email Notification System Status Report

**Status:** NOT IMPLEMENTED (infrastructure ready)

**Key Findings:**
- Strapi email plugin already installed (`@strapi/plugin-email` v4.16.2)
- Sendmail provider available but not configured
- TODO placeholders exist in order inquiry lifecycle (`backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts:12`)
- Missing: SMTP environment variables, email templates, email service implementation

**Files with Email TODOs:**
- `backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts` - afterCreate hook
- `backend/src/api/order-inquiry/controllers/order-inquiry.ts` - Batch email notification

**Required for Implementation:**
1. Configure Strapi email plugin in `backend/config/plugins.ts`
2. Add SMTP credentials to `.env`
3. Create email templates (customer confirmation, admin notification)
4. Implement email service in lifecycle hooks
5. Add email notification preferences UI

---

### ✅ Completed: Product Search and Filtering (Phase 2.1)

**Implementation Details:**

#### 1. Enhanced Product API
**File:** `frontend/src/lib/api/products.ts`

**New Parameters:**
```typescript
interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: 'Indica' | 'Hybrid' | 'Sativa';
  featured?: boolean;
  onSale?: boolean;
  search?: string;           // NEW: Text search
  minPrice?: number;         // NEW: Price range
  maxPrice?: number;
  minTHC?: number;          // NEW: THC content range
  maxTHC?: number;
}
```

**Strapi Filters Used:**
- `$containsi` - Case-insensitive product name search
- `$eq` - Exact match for category, featured, on_sale
- `$gte` / `$lte` - Range queries for pricing and THC content

**Test Coverage:** 11 tests (all passing)
- Default/custom pagination
- Category filtering
- Featured/on sale filtering
- Search by name
- Price range filtering
- THC content filtering
- Combined multiple filters
- Error handling

#### 2. FilterPanel Component
**File:** `frontend/src/components/products/FilterPanel.tsx` (238 lines)

**Features:**
- Search bar with icon for product name search
- Category buttons (All, Indica, Hybrid, Sativa) with color-coded styling
- Quick filters: Featured Only, On Sale Only (checkboxes)
- Price range inputs (Min/Max $/g)
- THC content range inputs (Min/Max %)
- Clear Filters button (appears when filters active)
- Responsive design

**Test Coverage:** 10 tests (all passing)
- All filter controls render
- Search input changes
- Category toggles
- Checkbox toggles
- Price/THC range inputs
- Active styling
- Clear filters

#### 3. Updated Products Page
**File:** `frontend/src/app/(portal)/products/page.tsx`

**Changes:**
- Integrated FilterPanel as sidebar (4-column grid layout)
- Replaced old category buttons with FilterPanel
- Added product count display
- Updated empty state messages
- Maintains existing functionality (loading, errors, customization modal)

#### 4. New UI Component
**File:** `frontend/src/components/ui/label.tsx`

Created Label component using Radix UI primitives for form accessibility.

**Dependencies Added:**
- `@radix-ui/react-label`
- `class-variance-authority`

---

## Phase 2.1 Status: Product Catalog

### ✅ Completed Features (9/13)

1. ✅ Product content type in Strapi with full schema
2. ✅ TypeScript type definitions for products
3. ✅ Product API client (getProducts, getProductById)
4. ✅ Product API client unit tests
5. ✅ ProductCard component with image carousel & size selector
6. ✅ ProductCard component tests
7. ✅ Products listing page with grid layout
8. ✅ **Product search and filtering** (text search, price, THC, category, featured, on sale)
9. ✅ **FilterPanel component with comprehensive tests**

### 🚧 Remaining Features (4/13)

10. ⏳ Product detail/individual product page
11. ⏳ Advanced image gallery (lightbox with zoom)
12. ⏳ Inventory tracking schema in Strapi
13. ⏳ Stock availability indicators in ProductCard

---

## Next Implementation Priority

### Option 1: Product Detail Page (RECOMMENDED)

**Why First:**
- Natural progression from listing page
- Users need to see full product information
- Enables better product discovery
- Provides context for advanced gallery

**Scope:**
- Dynamic route: `/products/[id]`
- Full product details display
- All pricing options
- Complete feature list
- Full description and warnings
- Image gallery integration
- "Customize & Order" CTA
- Breadcrumb navigation
- Related products section (optional)

**Files to Create/Modify:**
- `frontend/src/app/(portal)/products/[id]/page.tsx` - Dynamic product detail page
- `frontend/src/app/(portal)/products/[id]/page.test.tsx` - Page tests
- `frontend/src/components/products/ProductDetail.tsx` - Detail component (optional)
- Update existing ProductCard to link to detail page

**TDD Approach:**
1. Write tests for product detail page rendering
2. Write tests for dynamic routing with product ID
3. Write tests for "Product not found" state
4. Implement the component to pass tests
5. Add navigation from ProductCard

---

### Option 2: Advanced Image Gallery

**Why Second:**
- Enhances both ProductCard and Product Detail page
- Better visual product presentation
- Common e-commerce feature

**Scope:**
- Lightbox/modal image viewer
- Zoom functionality
- Keyboard navigation (arrow keys, ESC)
- Touch gestures for mobile
- Image thumbnails
- Current image indicator
- Full-screen mode

**Files to Create/Modify:**
- `frontend/src/components/products/ImageGallery.tsx` - Gallery component
- `frontend/src/components/products/ImageGallery.test.tsx` - Gallery tests
- `frontend/src/components/products/Lightbox.tsx` - Lightbox modal
- `frontend/src/components/products/Lightbox.test.tsx` - Lightbox tests
- Update ProductCard to use enhanced gallery
- Update Product Detail page to use enhanced gallery

**Dependencies Needed:**
- Consider: `react-image-lightbox` or `yet-another-react-lightbox`
- Or build custom with Radix Dialog + transforms

---

### Option 3: Inventory Tracking System

**Why Third:**
- More complex feature requiring backend + frontend
- Useful for operations management
- Requires admin permissions

**Scope:**

**Backend (Strapi):**
- Create Inventory content type with fields:
  - product (relation to Product)
  - weight (enum: 7g/14g/28g)
  - quantity_available (integer)
  - quantity_reserved (integer)
  - low_stock_threshold (integer)
  - last_restocked_at (datetime)
  - notes (text)
- Add lifecycle hooks for inventory updates
- Create inventory management API endpoints
- Add admin-only permissions

**Frontend:**
- Display stock status on ProductCard (In Stock, Low Stock, Out of Stock)
- Display stock status on Product Detail page
- Create admin inventory management UI:
  - View inventory levels by product/weight
  - Update inventory quantities
  - Set low stock alerts
  - View inventory history
- Add stock badges with color coding

**Files to Create/Modify:**

Backend:
- `backend/src/api/inventory/content-types/inventory/schema.json`
- `backend/src/api/inventory/controllers/inventory.ts`
- `backend/src/api/inventory/services/inventory.ts`
- `backend/src/api/inventory/routes/inventory.ts`
- `backend/src/api/inventory/content-types/inventory/lifecycles.ts`

Frontend:
- `frontend/src/types/inventory.ts` - TypeScript types
- `frontend/src/lib/api/inventory.ts` - API client
- `frontend/src/lib/api/inventory.test.ts` - API tests
- `frontend/src/components/products/StockBadge.tsx` - Stock indicator
- `frontend/src/components/products/StockBadge.test.tsx` - Badge tests
- `frontend/src/app/(portal)/inventory/page.tsx` - Admin inventory page (new route)
- Update ProductCard to show stock status
- Update Product Detail page to show stock availability

---

## Implementation Guidelines

### TDD Workflow (ALWAYS FOLLOW)

1. **RED:** Write failing tests first
2. **GREEN:** Write minimal code to pass tests
3. **REFACTOR:** Improve code while keeping tests green
4. **COMMIT:** Commit code with tests

### Test Requirements

- **Coverage Target:** 70%+ for all modules
- **Test File Naming:** `filename.test.ts` or `filename.test.tsx`
- **Test Location:** Next to implementation file
- **Testing Library:** Vitest + React Testing Library

### Code Quality Standards

- Avoid over-engineering - implement only what's requested
- No speculative features or "improvements"
- Use existing UI components from shadcn/ui
- Follow TypeScript strict mode
- Use proper error handling
- Add loading states for async operations
- Maintain accessibility (ARIA labels, keyboard navigation)

### Git Workflow

- Only commit when requested by user
- Write descriptive commit messages focusing on "why"
- Include Co-Author: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Never force push to main/master
- Don't skip git hooks

---

## File Structure Reference

### Frontend Structure
```
frontend/src/
├── app/(portal)/
│   ├── products/
│   │   ├── page.tsx                    # Products listing (UPDATED)
│   │   └── [id]/                       # TODO: Product detail pages
│   │       └── page.tsx
│   ├── orders/
│   ├── media-hub/
│   ├── dashboard/
│   └── profile/
├── components/
│   ├── products/
│   │   ├── ProductCard.tsx             # Card component (212 lines)
│   │   ├── ProductCard.test.tsx        # Card tests (181 lines)
│   │   ├── FilterPanel.tsx             # NEW: Filter sidebar (238 lines)
│   │   ├── FilterPanel.test.tsx        # NEW: Filter tests (10 tests)
│   │   ├── CustomizationModal.tsx      # 4-step wizard (337 lines)
│   │   └── [other customization components]
│   └── ui/                             # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── checkbox.tsx
│       ├── label.tsx                   # NEW
│       └── [other UI components]
├── lib/
│   └── api/
│       ├── products.ts                 # UPDATED: Search & filters
│       ├── products.test.ts            # UPDATED: 11 tests
│       ├── customization.ts
│       └── strapi.ts                   # Axios instance
├── stores/
│   ├── authStore.ts                    # Zustand auth
│   └── customizationStore.ts           # Customization state
└── types/
    └── product.ts                      # Product TypeScript types
```

### Backend Structure
```
backend/src/
├── api/
│   ├── product/                        # Product content type
│   │   ├── content-types/product/schema.json
│   │   ├── controllers/product.ts
│   │   ├── services/product.ts
│   │   └── routes/product.ts
│   ├── order-inquiry/                  # Order inquiry with email TODOs
│   │   ├── content-types/order-inquiry/
│   │   │   ├── schema.json
│   │   │   └── lifecycles.ts          # TODO: Email notifications
│   │   ├── controllers/order-inquiry.ts
│   │   └── services/order-inquiry.ts
│   ├── bud-style/                      # Customization options
│   ├── background-style/
│   ├── font-style/
│   └── prebagging-option/
├── components/                          # Strapi components
│   ├── product/
│   │   ├── pricing.json
│   │   └── feature.json
│   └── customization/
│       └── selection-limits.json
├── utils/
│   └── product-transformer.ts          # Product data transformers
├── index.ts                            # Strapi bootstrap
└── config/
    ├── database.ts                     # PostgreSQL config
    ├── server.ts
    ├── middlewares.ts                  # CORS config
    └── plugins.ts                      # TODO: Add email plugin config
```

---

## Environment Variables

**Current Status:** Email variables missing

**Required for Email Implementation:**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=user@example.com
SMTP_PASSWORD=secretpassword
SMTP_FROM_NAME=BC Flame
SMTP_FROM_EMAIL=noreply@bcflame.com
ADMIN_EMAIL=admin@bcflame.com
```

**Existing Variables:**
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
JWT_SECRET=<generated>
ADMIN_JWT_SECRET=<generated>
APP_KEYS=<4 comma-separated keys>
DB_PASSWORD=<database password>
```

---

## Testing Commands

```bash
# Frontend tests
cd frontend
npm run test                    # Run all tests
npm run test:ui                 # Vitest UI mode
npm run test:coverage           # Coverage report
npm run test -- ProductCard     # Specific test file

# Backend tests
cd backend
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f strapi
docker-compose logs -f frontend

# Restart after changes
docker-compose restart strapi
docker-compose restart frontend

# Rebuild after Dockerfile changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Clean reset (removes all data)
docker-compose down -v
```

---

## Known Issues & Considerations

### Search & Filtering
- ✅ No debouncing on search input (could add for better UX)
- ✅ Price filtering uses pricing.amount (first matching price)
- ✅ THC content assumes numeric storage in Strapi
- ✅ All filters trigger immediate API calls

### Product Schema
- THC content stored as text in schema, may need parsing
- Product images use Strapi media relations
- Customization uses separate available_photos relation

### Authentication
- JWT stored in cookies (7-day expiration)
- Middleware protects all (portal) routes
- Axios interceptor auto-injects JWT

---

## Recommended Next Steps

**Session Start Checklist:**
1. Check Docker services status: `docker-compose ps`
2. Verify frontend/backend are running
3. Review this plan file
4. Choose implementation priority
5. Follow TDD approach (tests first!)

**Immediate Next Task:**
Implement **Product Detail Page** with dynamic routing

**After Product Detail:**
1. Advanced Image Gallery with lightbox
2. Inventory Tracking System

**Future Phases:**
- Email notification system implementation
- Marketing media hub
- Analytics dashboard
- Additional features per user requirements

---

## Contact & Resources

- **Project Path:** `/Users/justinecastaneda/Desktop/bcflame`
- **CLAUDE.md:** Project instructions and guidelines
- **Docker Compose:** `docker-compose.yml` in project root
- **Environment:** `.env` and `.env.example` files

---

**End of Implementation Plan**
