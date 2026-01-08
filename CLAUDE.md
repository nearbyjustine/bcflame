# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BC Flame Premium Client Portal is a B2B partner portal for approved cannabis product partners. It's a full-stack monorepo with a Next.js frontend, Strapi CMS backend, and PostgreSQL database, all containerized with Docker.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Strapi 4.16.2 + PostgreSQL 16

## Essential Commands

### Development

```bash
# Start all services with Docker
docker-compose up -d

# View logs (all services or specific service)
docker-compose logs -f
docker-compose logs -f strapi
docker-compose logs -f frontend

# Restart services after code changes
docker-compose restart strapi    # Backend changes
docker-compose restart frontend  # Frontend changes

# Rebuild after Dockerfile changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Clean reset (removes all data including database)
docker-compose down -v
```

### Local Development (Without Docker)

```bash
# Install all dependencies
npm run install:all

# Start backend (Strapi on port 1337)
npm run dev:backend

# Start frontend (Next.js on port 3000)
npm run dev:frontend

# Start both (runs in parallel)
npm run dev
```

### Database Management

```bash
# Setup database container
npm run db:setup

# Start/stop database
npm run db:start
npm run db:stop

# Reset database (destructive - removes all data)
npm run db:reset
```

### Testing & Building

```bash
# Frontend
cd frontend
npm run test       # Run Vitest unit tests
npm run test:ui    # Run Vitest with UI
npm run test:coverage  # Run tests with coverage report
npm run build      # Production build
npm run lint       # ESLint

# Backend
cd backend
npm run test       # Run Vitest unit tests
npm run test:watch # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run build      # TypeScript compilation
npm run strapi     # Strapi CLI commands
```

## Architecture

### Frontend (`/frontend`)

**Next.js 14 App Router Structure:**
- `app/(auth)/login/` - Public login page
- `app/(portal)/dashboard/` - Protected main dashboard route (other protected portal routes like `products`, `orders`, `media-hub`, and `profile` are separate sibling directories under `app/(portal)/`)
- `components/ui/` - shadcn/ui components (button, card, input)
- `components/auth/LoginForm.tsx` - Login form component
- `lib/api/strapi.ts` - Axios instance with JWT interceptor
- `stores/authStore.ts` - Zustand auth store with localStorage persistence
- `middleware.ts` - Route protection (checks JWT, redirects unauthenticated users)

**Key Frontend Files:**
- `next.config.js` - Webpack polling enabled for Docker on macOS, standalone output mode
- `tailwind.config.ts` - CSS variable-based color system, dark mode support
- `middleware.ts` - Protects routes: /dashboard, /products, /media-hub, /orders, /profile

**Authentication Flow:**
1. User logs in via LoginForm → POST to `/api/auth/local`
2. JWT stored in cookie (7 days) and Zustand store
3. Middleware checks JWT on protected routes
4. Axios interceptor auto-injects JWT header on API calls
5. 401 responses trigger logout and redirect to /login

### Backend (`/backend`)

**Strapi CMS Structure:**
- `config/database.ts` - PostgreSQL connection (supports env vars and SSL)
- `config/server.ts` - Server config (port 1337, webhooks, app keys)
- `config/middlewares.ts` - CORS enabled for localhost:3000, security headers
- `config/api.ts` - REST API config (default limit: 25, max: 100)
- `src/api/` - Custom API endpoints (future content types)
- `src/index.ts` - Bootstrap hooks

**Built-in Features:**
- Strapi Users-Permissions plugin for JWT authentication
- Admin panel at `/admin`
- REST API at `/api/*`
- Default roles: Admin, Authenticated, Public

### Docker Services

Three services defined in `docker-compose.yml`:

1. **postgres** (postgres:16-alpine) - Port 5432, named volume `postgres_data`, health checks
2. **strapi** - Port 1337, depends on postgres, uploads volume `strapi_uploads`
3. **frontend** - Port 3000, depends on strapi

All services use custom network `bcflame_network`.

## Important Configuration

### Environment Variables

Copy `.env.example` to `.env` and generate secrets:

```bash
# JWT Secret
openssl rand -base64 32

# APP_KEYS (4 comma-separated keys)
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"

# API Token Salt & Transfer Token Salt
openssl rand -base64 32
```

**Critical ENV vars:**
- `NEXT_PUBLIC_STRAPI_URL` - Backend API URL (default: http://localhost:1337)
- `JWT_SECRET`, `ADMIN_JWT_SECRET` - Strapi JWT signing
- `APP_KEYS` - Strapi session keys (4 required)
- `DB_PASSWORD` - Change in production
- All secrets must be generated, never use defaults in production

### Service URLs

- Frontend: http://localhost:3000
- Strapi Admin: http://localhost:1337/admin
- Strapi API: http://localhost:1337/api
- PostgreSQL: localhost:5432

## Testing Strategy

This project follows **Test-Driven Development (TDD)** principles. Write tests before implementation.

### Test Framework: Vitest

Both frontend and backend use **Vitest** for unit and integration testing.

**Why Vitest:**
- Fast execution with native ESM support
- Compatible with Vite and Next.js
- Jest-compatible API
- Built-in coverage with c8
- UI mode for debugging tests

### Frontend Testing (`/frontend`)

**Test Structure:**
```
frontend/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── strapi.ts
│   │   │   └── strapi.test.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── formatters.test.ts
│   ├── components/
│   │   └── products/
│   │       ├── ProductCard.tsx
│   │       └── ProductCard.test.tsx
│   └── stores/
│       ├── authStore.ts
│       └── authStore.test.ts
├── vitest.config.ts
└── package.json
```

**Testing Patterns:**
- **Unit Tests**: Test individual functions, utilities, and components in isolation
- **Integration Tests**: Test API services with mocked axios responses
- **Component Tests**: Test React components with @testing-library/react
- **Store Tests**: Test Zustand stores with state transitions

**Coverage Target**: 70%+ for all modules

**Example Unit Test:**
```typescript
// frontend/src/lib/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate } from './formatters'

describe('formatPrice', () => {
  it('formats USD currency correctly', () => {
    expect(formatPrice(55.00, 'USD')).toBe('$55.00')
  })

  it('handles zero price', () => {
    expect(formatPrice(0, 'USD')).toBe('$0.00')
  })
})
```

**Example Component Test:**
```typescript
// frontend/src/components/products/ProductCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('renders product name and price', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price_range: '$50.00 - $100.00',
      category: 'Indica'
    }

    render(<ProductCard product={product} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$50.00 - $100.00')).toBeInTheDocument()
  })
})
```

**Running Tests:**
```bash
cd frontend
npm run test              # Run all tests
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Generate coverage report
npm run test -- ProductCard  # Run specific test file
```

### Backend Testing (`/backend`)

**Test Structure:**
```
backend/
├── src/
│   ├── api/
│   │   └── product/
│   │       ├── controllers/
│   │       │   ├── product.ts
│   │       │   └── product.test.ts
│   │       ├── services/
│   │       │   ├── product.ts
│   │       │   └── product.test.ts
│   │       └── routes/
│   │           └── product.ts
│   └── utils/
│       ├── inquiry-number.ts
│       └── inquiry-number.test.ts
├── tests/
│   ├── helpers/
│   │   └── strapi.ts
│   └── integration/
│       └── product.test.ts
├── vitest.config.ts
└── package.json
```

**Testing Patterns:**
- **Unit Tests**: Test services, controllers, and utilities in isolation
- **Integration Tests**: Test API endpoints with test database
- **Lifecycle Tests**: Test Strapi lifecycle hooks (beforeCreate, afterCreate, etc.)
- **Permission Tests**: Test role-based access control

**Coverage Target**: 70%+ for services and controllers

**Example Service Test:**
```typescript
// backend/src/api/order-inquiry/services/inquiry-number.test.ts
import { describe, it, expect } from 'vitest'
import { generateInquiryNumber } from './inquiry-number'

describe('generateInquiryNumber', () => {
  it('generates inquiry number with correct format', () => {
    const inquiryNumber = generateInquiryNumber()
    expect(inquiryNumber).toMatch(/^INQ-\d{8}-\d{4}$/)
  })

  it('includes current date in YYYYMMDD format', () => {
    const inquiryNumber = generateInquiryNumber()
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    expect(inquiryNumber).toContain(today)
  })
})
```

**Example Integration Test:**
```typescript
// backend/tests/integration/product.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupStrapi, cleanupStrapi } from '../helpers/strapi'

describe('Product API', () => {
  beforeAll(async () => {
    await setupStrapi()
  })

  afterAll(async () => {
    await cleanupStrapi()
  })

  it('GET /api/products returns all products', async () => {
    const response = await request(strapi.server.httpServer)
      .get('/api/products')
      .expect(200)

    expect(response.body.data).toBeInstanceOf(Array)
  })

  it('GET /api/products/:id returns single product', async () => {
    const response = await request(strapi.server.httpServer)
      .get('/api/products/1')
      .expect(200)

    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data).toHaveProperty('attributes')
  })
})
```

**Running Tests:**
```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test -- inquiry   # Run specific test file
```

### TDD Workflow

**Red-Green-Refactor Cycle:**

1. **RED**: Write a failing test first
   ```typescript
   // Write the test
   it('should format price correctly', () => {
     expect(formatPrice(50)).toBe('$50.00')
   })
   // Test fails - formatPrice doesn't exist yet
   ```

2. **GREEN**: Write minimal code to make the test pass
   ```typescript
   // Implement the function
   export function formatPrice(amount: number): string {
     return `$${amount.toFixed(2)}`
   }
   // Test passes
   ```

3. **REFACTOR**: Improve code while keeping tests green
   ```typescript
   // Refactor with currency support
   export function formatPrice(amount: number, currency = 'USD'): string {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency
     }).format(amount)
   }
   // Tests still pass
   ```

**Development Flow:**
1. Create `.test.ts` or `.test.tsx` file next to implementation file
2. Write test cases for the feature you're about to implement
3. Run tests (they should fail)
4. Implement the feature
5. Run tests (they should pass)
6. Refactor code
7. Commit code with tests

**Best Practices:**
- One test file per implementation file
- Test file naming: `filename.test.ts` or `filename.test.tsx`
- Group related tests with `describe` blocks
- Use descriptive test names: `it('should do something when condition')`
- Mock external dependencies (axios, Strapi SDK, etc.)
- Avoid testing implementation details, test behavior
- Keep tests simple and readable
- Aim for fast test execution (<5 seconds for unit tests)

### Configuration

**Frontend Vitest Config** (`frontend/vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
      ],
    },
  },
})
```

**Backend Vitest Config** (`backend/vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        'config/',
      ],
    },
  },
})
```

## Development Patterns

### Frontend

**Route Groups:**
- `(auth)` - Public routes without navbar
- `(portal)` - Protected routes with portal layout and navigation

**State Management:**
- Zustand for global auth state
- Persisted to localStorage (user, isAuthenticated)
- JWT token stored separately in cookie

**API Integration:**
- Use `strapi` axios instance from `lib/api/strapi.ts`
- JWT automatically injected on requests
- Handles 401 responses (logout + redirect)

**Component Patterns:**
- Most components use `'use client'` for interactivity
- shadcn/ui for base UI components
- React Hook Form + Zod for form validation

### Backend

**Strapi Development:**
- Content types defined in `src/api/` (future)
- Use Strapi admin panel to create/modify content types during development
- Generated files should be committed to git
- Restart backend after schema changes

**Database:**
- Migrations not used (Strapi auto-syncs schemas in development)
- Use `npm run db:reset` for clean slate
- PostgreSQL uses named volume - data persists across container restarts

## Common Issues & Solutions

### Frontend hot reload not working in Docker on macOS
- Webpack polling already enabled in `next.config.js`
- If still issues, increase poll interval: `poll: 2000`

### Backend changes not reflecting
- Restart backend: `docker-compose restart strapi`
- Check logs: `docker-compose logs -f strapi`
- Strapi caches aggressively in production mode

### Database connection errors
- Ensure postgres service is healthy: `docker-compose ps`
- Wait for health check to pass before Strapi starts
- Check DB credentials in `.env`

### 401 errors on protected routes
- JWT may be expired (7 day expiration)
- Check cookie is present in browser DevTools
- Verify `NEXT_PUBLIC_STRAPI_URL` matches running backend

### CORS errors
- Verify frontend URL in `backend/config/middlewares.ts` CORS config
- Check origin header matches allowed origins
- Restart backend after CORS config changes

## Project Status

**Phase 1 (Complete):**
- ✅ JWT authentication and authorization
- ✅ Protected routes with middleware
- ✅ Docker containerization
- ✅ Basic portal UI with navigation
- ✅ Vitest test infrastructure (frontend & backend)
- ✅ Test coverage reporting configured

**Phase 2.1 (In Progress - Product Catalog):**
- ✅ Product content type in Strapi
- ✅ TypeScript type definitions for products
- ✅ Product API client with unit tests
- ✅ Products listing page with grid layout
- ✅ ProductCard component with tests
- 🚧 Product search and filtering
- 🚧 Product detail page
- 🚧 Product images and media gallery
- 🚧 Inventory tracking

**Phase 2.2 (Future):**
- Smart Packaging Customization Studio
- Order inquiry system
- Marketing media hub
- Analytics dashboard

## File Watching Note

Frontend uses webpack polling (1000ms) for Docker compatibility on macOS. If developing locally without Docker, this can be disabled in `next.config.js` for better performance.
