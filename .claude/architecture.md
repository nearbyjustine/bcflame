BC Flame Premium Client Portal - Technical Architecture Plan

## Executive Summary

I've created a complete technical architecture plan for your B2B partner portal. This greenfield project will use Next.js (frontend),
 Strapi (backend CMS), PostgreSQL (database), and Docker Compose for orchestration. The portal will serve as a "VIP lounge" for
approved partners to view products, check inventory, access marketing materials, and manage custom packaging orders.

---
1. PROJECT STRUCTURE - Monorepo Approach

**Recommended:** Use a monorepo structure for easier management:

bcflame/
├── frontend/          # Next.js application
├── backend/           # Strapi CMS
├── shared/            # Shared TypeScript types
├── nginx/             # Nginx config for production
├── docker-compose.xyml
├── docker-compose.prod.yml
├── .env.example
└── README.md

Why Monorepo:
- [ ] Single source of truth
- Easier Docker orchestration
- Simplified environment configuration
- Better for single development team
- Shared TypeScript types between frontend/backend

---
## 2. STRAPI CONTENT TYPES

### Core Content Types Required

### Product (Collection Type)

{
  name: string (required, unique)
  slug: string (required, unique, auto-generated)
  description: text (rich text)
  sku: string (unique)
  category: enumeration ['flower', 'pre-rolls', 'concentrates', 'edibles']

  // Inventory
  stockStatus: enumeration ['in-stock', 'low-stock', 'out-of-stock']
  stockCount: number (default: 0)
  lowStockThreshold: number (default: 10)

  // Media
  featuredImage: media (single, required)
  gallery: media (multiple, max: 5)

  // Relations
  availablePackagingSizes: relation (has-many: PackagingSize)
  budStyles: relation (has-many: BudStyle)

  // Admin
  isActive: boolean (default: true)
  isFeatured: boolean (default: false)
  displayOrder: number (default: 0)
}

### PackagingSize (Collection Type)

{
  name: string (required) // "3.5g", "7g", "14g", "28g"
  displayName: string // "Eighth", "Quarter", "Half", "Ounce"
  weightInGrams: number (required)
  description: text
  isActive: boolean (default: true)
  displayOrder: number
}

### BudStyle (Collection Type)

{
  name: string (required, unique) // "Dense Nugs", "Fluffy Premium"
  description: text
  previewImage: media (single, required)
  isActive: boolean (default: true)
  displayOrder: number
}

### BackgroundStyle (Collection Type)

{
  name: string (required, unique) // "Minimalist White", "Gradient Gold"
  description: text
  previewImage: media (single, required)
  thumbnailImage: media (single, required)
  hexCode: string // Primary color
  patternType: enumeration ['solid', 'gradient', 'pattern']
  isActive: boolean (default: true)
  displayOrder: number
}

### TypographyStyle (Collection Type)

{
  name: string (required, unique) // "Bold Modern", "Classic Serif"
  description: text
  previewImage: media (single, required)
  fontFamily: string // "Montserrat Bold"
  fontSize: string // "18px"
  fontWeight: string // "700"
  isActive: boolean (default: true)
  displayOrder: number
}

### OrderInquiry (Collection Type)

{
  // Auto-populated from logged-in user
  partner: relation (has-one: User) (required)
  partnerCompanyName: string
  partnerEmail: string

  // Order details
  product: relation (has-one: Product) (required)
  packagingSize: relation (has-one: PackagingSize)
  quantity: number (required)

  // Customization selections
  selectedBudStyle: relation (has-one: BudStyle)
  selectedBackground: relation (has-one: BackgroundStyle)
  selectedTypography: relation (has-one: TypographyStyle)
  customizationNotes: text

  // Message
  message: text (required)
  urgency: enumeration ['standard', 'urgent']

  // Status
  status: enumeration ['new', 'in-progress', 'quoted', 'completed', 'cancelled']
  adminNotes: text (rich text)
  submittedAt: datetime (auto)
  respondedAt: datetime
}

### User Extensions (Extend Strapi Users)

Add custom fields to the default User model:
{
  companyName: string (required)
  businessLicense: string
  phoneNumber: string
  partnerStatus: enumeration ['pending', 'active', 'suspended']
  partnerTier: enumeration ['standard', 'premium', 'elite']
  daysSinceJoined: number
  preferredContactMethod: enumeration ['email', 'phone', 'sms']
  notificationsEnabled: boolean (default: true)
  internalNotes: text (admin only)
}

### Strapi Role Permissions

Authenticated (Partners):
- Products: find, findOne
- PackagingSize: find, findOne
- BudStyle: find, findOne
- BackgroundStyle: find, findOne
- TypographyStyle: find, findOne
- OrderInquiry: create, find (own only), findOne (own only)

Admin:
- [ ] Full access to all content types

---
3. NEXT.JS ARCHITECTURE

### Tech Stack Details

- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui components
- State Management: Zustand (auth) + React Context (packaging)
- Forms: React Hook Form + Zod validation
- HTTP Client: Axios with interceptors

### Page Structure (App Router)

frontend/src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── layout.tsx             # Public auth layout
│
├── (portal)/                  # Protected routes
│   ├── dashboard/
│   │   └── page.tsx           # Partner dashboard
│   ├── products/
│   │   ├── page.tsx           # Product grid
│   │   └── [slug]/
│   │       └── page.tsx       # Product detail + customization
│   ├── media-hub/
│   │   └── page.tsx           # Marketing media gallery
│   ├── orders/
│   │   ├── page.tsx           # Order inquiry history
│   │   └── [id]/
│   │       └── page.tsx       # Order detail
│   ├── profile/
│   │   └── page.tsx           # Partner profile
│   └── layout.tsx             # Portal layout (with nav)
│
├── api/
│   └── auth/
│       └── refresh/
│           └── route.ts       # Token refresh (optional)
│
├── layout.tsx                 # Root layout
├── page.tsx                   # Home/redirect
├── globals.css
└── middleware.ts              # Auth protection

### Component Architecture

frontend/src/components/
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── MobileNav.tsx
│
├── auth/
│   ├── LoginForm.tsx
│   ├── AuthProvider.tsx
│   └── ProtectedRoute.tsx
│
├── products/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── ProductDetail.tsx
│   ├── ProductGallery.tsx
│   ├── StockBadge.tsx
│   └── ProductFilters.tsx
│
├── packaging/
│   ├── PackagingStudio.tsx          # Main customization interface
│   ├── BudStyleSelector.tsx
│   ├── BackgroundSelector.tsx
│   ├── TypographySelector.tsx
│   ├── PackagingPreview.tsx         # Live preview
│   └── PackagingSizeSelector.tsx
│
├── orders/
│   ├── OrderInquiryForm.tsx         # "Message to Order" form
│   ├── OrderInquiryCard.tsx
│   ├── OrderStatusBadge.tsx
│   └── OrderHistory.tsx
│
├── media/
│   ├── MediaCard.tsx
│   ├── MediaGallery.tsx
│   ├── MediaDownload.tsx
│   └── MediaLightbox.tsx
│
└── ui/                               # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    └── ... (other shadcn components)

### Key Implementation: Smart Packaging Studio

The packaging customization interface will be the centerpiece of the UX:

// frontend/src/components/packaging/PackagingStudio.tsx
export function PackagingStudio({
  product,
  budStyles,
  backgrounds,
  typographyStyles,
  packagingSizes
}) {
  const [selectedBudStyle, setSelectedBudStyle] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedTypography, setSelectedTypography] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Customization Controls */}
      <div className="space-y-6">
        <PackagingSizeSelector />
        <BudStyleSelector />
        <BackgroundSelector />
        <TypographySelector />
        <button onClick={() => openOrderForm()}>
          Message to Order
        </button>
      </div>

      {/* Right: Live Preview */}
      <div className="sticky top-4">
        <PackagingPreview
          product={product}
          budStyle={selectedBudStyle}
          background={selectedBackground}
          typography={selectedTypography}
        />
      </div>
    </div>
  );
}

---
## 4. DOCKER CONFIGURATION

### Main docker-compose.yml (Development)

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bcflame_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-bcflame}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-bcflame_dev_password}
      POSTGRES_DB: ${DB_NAME:-bcflame_db}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bcflame_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bcflame}"]
      interval: 10s
      timeout: 5s
      retries: 5

  strapi:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: bcflame_strapi
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DB_NAME:-bcflame_db}
      DATABASE_USERNAME: ${DB_USER:-bcflame}
      DATABASE_PASSWORD: ${DB_PASSWORD:-bcflame_dev_password}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      HOST: 0.0.0.0
      PORT: 1337
    ports:
      - "${STRAPI_PORT:-1337}:1337"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - strapi_uploads:/app/public/uploads
    networks:
      - bcflame_network
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run develop

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: bcflame_frontend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_STRAPI_URL: http://localhost:1337
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - bcflame_network
    depends_on:
      - strapi
    command: npm run dev

volumes:
  postgres_data:
  strapi_uploads:

networks:
  bcflame_network:
    driver: bridge

### Backend Dockerfile

FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 1337
CMD ["npm", "run", "develop"]

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
USER strapi
EXPOSE 1337
CMD ["npm", "run", "start"]

### Frontend Dockerfile

FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

### Production Override (docker-compose.prod.yml)

version: '3.8'

services:
  strapi:
    build:
      target: production
    environment:
      NODE_ENV: production
      DATABASE_SSL: true
    command: npm run start

  frontend:
    build:
      target: production
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_STRAPI_URL: ${NEXT_PUBLIC_STRAPI_URL}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
    command: node server.js

  nginx:
    image: nginx:alpine
    container_name: bcflame_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - bcflame_network
    depends_on:
      - frontend
      - strapi

---
## 5. AUTHENTICATION FLOW

### JWT Authentication Strategy

## 1. USER LOGIN
   ├─> Frontend: User enters email/password
   ├─> POST /api/auth/local (Strapi)
   ├─> Strapi validates credentials
   ├─> Strapi returns { jwt, user }
   └─> Frontend stores JWT in cookie + Zustand store

## 2. AUTHENTICATED REQUEST
   ├─> Frontend includes JWT in Authorization header
   ├─> Strapi validates JWT
   ├─> Strapi checks user role & permissions
   └─> Returns data or 401/403

## 3. LOGOUT
   ├─> Frontend clears JWT from cookie + store
   └─> Redirects to login page

### Frontend Auth Implementation

#### Zustand Auth Store
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (identifier, password) => {
        const response = await strapiApi.post('/api/auth/local', {
          identifier,
          password,
        });

        const { jwt, user } = response.data;
        Cookies.set('jwt', jwt, { expires: 7 });

        set({
          user,
          token: jwt,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        Cookies.remove('jwt');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = Cookies.get('jwt');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await strapiApi.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          Cookies.remove('jwt');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    { name: 'auth-storage' }
  )
);

#### Axios Instance with Interceptors
// frontend/src/lib/api/strapi.ts
import axios from 'axios';
import Cookies from 'js-cookie';

export const strapiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
});

// Add JWT to all requests
strapiApi.interceptors.request.use((config) => {
  const token = Cookies.get('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
strapiApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('jwt');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

####  Next.js Middleware (Route Protection)
// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;

  const protectedPaths = ['/dashboard', '/products', '/media-hub', '/orders', '/profile'];
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/products/:path*', '/media-hub/:path*',
            '/orders/:path*', '/profile/:path*', '/login'],
};

---
## 6. API INTEGRATION STRATEGY

### API Service Layer

Create dedicated API service files for each domain:

// frontend/src/lib/api/products.ts
import { strapiApi } from './strapi';

export async function getProducts(params?: {
  category?: string;
  featured?: boolean;
  inStock?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.category) {
    query.append('filters[category][$eq]', params.category);
  }
  if (params?.featured) {
    query.append('filters[isFeatured][$eq]', 'true');
  }
  if (params?.inStock) {
    query.append('filters[stockStatus][$ne]', 'out-of-stock');
  }

  query.append('populate', '*');
  query.append('sort', 'displayOrder:asc');

  const response = await strapiApi.get(`/api/products?${query}`);
  return response.data;
}

export async function getProductBySlug(slug: string) {
  const response = await strapiApi.get('/api/products', {
    params: {
      'filters[slug][$eq]': slug,
      'populate[0]': 'featuredImage',
      'populate[1]': 'gallery',
      'populate[2]': 'availablePackagingSizes',
      'populate[3]': 'budStyles',
    },
  });
  return response.data.data[0];
}

// frontend/src/lib/api/orders.ts
export async function createOrderInquiry(data: OrderInquiryData) {
  const response = await strapiApi.post('/api/order-inquiries', { data });
  return response.data;
}

export async function getMyOrderInquiries() {
  const response = await strapiApi.get('/api/order-inquiries', {
    params: {
      'populate[0]': 'product',
      'populate[1]': 'packagingSize',
      'populate[2]': 'selectedBudStyle',
      'sort': 'submittedAt:desc',
    },
  });
  return response.data;
}

### Strapi CORS Configuration

// backend/config/middlewares.ts
export default [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'https://portal-bcflame.vercel.app',
        'https://portal.bcflameonline.com',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  },
  // ... other middlewares
];

---
## 7. DETAILED FILE STRUCTURE

### Complete Directory Tree

bcflame/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env.local
│   │
│   ├── public/
│   │   ├── images/
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (portal)/
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── products/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [slug]/page.tsx
│       │   │   ├── media-hub/page.tsx
│       │   │   ├── orders/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── profile/page.tsx
│       │   │   └── layout.tsx
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   └── middleware.ts
│       │
│       ├── components/
│       │   ├── layout/
│       │   ├── auth/
│       │   ├── products/
│       │   ├── packaging/
│       │   ├── orders/
│       │   ├── media/
│       │   └── ui/ (shadcn)
│       │
│       ├── lib/
│       │   ├── api/
│       │   │   ├── strapi.ts
│       │   │   ├── products.ts
│       │   │   ├── packaging.ts
│       │   │   ├── orders.ts
│       │   │   └── media.ts
│       │   └── utils.ts
│       │
│       ├── stores/
│       │   └── authStore.ts
│       │
│       └── types/
│           ├── product.ts
│           ├── order.ts
│           └── user.ts
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   │
│   ├── config/
│   │   ├── admin.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   ├── middlewares.ts
│   │   ├── plugins.ts
│   │   └── server.ts
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── product/
│   │   │   ├── packaging-size/
│   │   │   ├── bud-style/
│   │   │   ├── background-style/
│   │   │   ├── typography-style/
│   │   │   └── order-inquiry/
│   │   │
│   │   ├── extensions/
│   │   │   └── users-permissions/
│   │   │
│   │   └── index.ts
│   │
│   └── public/
│       └── uploads/
│
└── nginx/
    ├── nginx.conf
    └── ssl/

---
## 8. ENVIRONMENT CONFIGURATION

### Root .env

# Project
COMPOSE_PROJECT_NAME=bcflame

# Database
DB_USER=bcflame
DB_PASSWORD=CHANGE_ME_IN_PRODUCTION
DB_NAME=bcflame_db
DB_PORT=5432

# Strapi
STRAPI_PORT=1337
JWT_SECRET=GENERATE_32_CHAR_SECRET
ADMIN_JWT_SECRET=GENERATE_32_CHAR_SECRET
APP_KEYS=key1,key2,key3,key4  # Generate 4 unique keys
API_TOKEN_SALT=GENERATE_SECRET

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=http://localhost:3000

### Backend .env

HOST=0.0.0.0
PORT=1337

DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=bcflame_db
DATABASE_USERNAME=bcflame
DATABASE_PASSWORD=CHANGE_ME
DATABASE_SSL=false

APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your_salt
ADMIN_JWT_SECRET=your_admin_secret
JWT_SECRET=your_jwt_secret

STRAPI_URL=http://localhost:1337
NODE_ENV=development

### Frontend .env.local

NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BC Flame Premium Portal

### Generate Secrets

# JWT Secret
openssl rand -base64 32

# APP_KEYS (4 keys)
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"

---
## 9. DEVELOPMENT WORKFLOW

### Initial Setup

# 1. Navigate to project directory
cd /Users/justinecastaneda/Desktop/bcflame

# 2. Create environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Edit .env files with your configuration

# 4. Start all services
docker-compose up -d

# 5. View logs
docker-compose logs -f

# 6. Access services:
# - Strapi Admin: http://localhost:1337/admin
# - Next.js Frontend: http://localhost:3000
# - PostgreSQL: localhost:5432

### Common Commands

# Restart specific service
docker-compose restart strapi

# Rebuild after Dockerfile changes
docker-compose up -d --build

# View logs for specific service
docker-compose logs -f strapi

# Stop all services
docker-compose down

# Stop and remove all data (DESTRUCTIVE)
docker-compose down -v

# Execute command in container
docker-compose exec strapi npm run strapi -- help

### Strapi First-Time Setup

1. Visit http://localhost:1337/admin
2. Create admin account
3. Use Content-Type Builder to create content types from Section 2
4. Configure role permissions in Settings > Users & Permissions
5. Create test partner user
6. Add sample products

---
## 10. DEPLOYMENT STRATEGY

### Phase 1: Hybrid Deployment (Recommended Initially)

**Architecture**
- Frontend: Vercel (for fast deployment, CDN, auto-scaling)
- Backend: VPS with Docker (Strapi + PostgreSQL)

**Why This Approach**
- [ ] Fastest time to market
- Leverage Vercel's infrastructure
- Full control over backend/database
- Easy to iterate on frontend

### VPS Backend Deployment

# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repository
git clone https://github.com/yourusername/bcflame.git
cd bcflame

# 4. Create production .env
cp .env.example .env.production
nano .env.production  # Edit with production values

# 5. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Setup SSL with Let's Encrypt
apt-get install certbot -y
certbot certonly --standalone -d api.portal.bcflameonline.com

# 7. Configure nginx with SSL
# Update nginx/nginx.conf with SSL paths
docker-compose restart nginx

### Vercel Frontend Deployment

# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. Import on Vercel
# - Visit vercel.com
# - New Project > Import from GitHub
# - Select bcflame-frontend repository

# 3. Configure Environment Variables in Vercel:
NEXT_PUBLIC_STRAPI_URL=https://api.portal.bcflameonline.com
NEXT_PUBLIC_SITE_URL=https://portal-bcflame.vercel.app

# 4. Deploy
# Vercel auto-deploys on every push to main

### Phase 2: Full VPS Migration (Later)

When ready for full control and cost optimization:

# Deploy all services on VPS
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Configure nginx to serve both frontend and backend
# Update DNS to point domain to VPS IP
# Generate SSL certificates for main domain

### Database Backup

# Create backup script
nano /opt/bcflame-backup.sh

#!/bin/bash
BACKUP_DIR="/opt/backups/bcflame"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec bcflame_postgres pg_dump -U bcflame bcflame_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./backend/public/uploads

# Keep last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

# Schedule daily backups
chmod +x /opt/bcflame-backup.sh
crontab -e
# Add: 0 2 * * * /opt/bcflame-backup.sh

---
## 11. IMPLEMENTATION ROADMAP

### Week 1: Foundation

- [ ] Set up monorepo structure
- Configure Docker Compose
- Initialize Strapi with PostgreSQL
- Initialize Next.js with TypeScript + Tailwind
- Test basic connectivity

### Week 2: Authentication & Data Models

- [ ] Create all Strapi content types
- Extend User model with partner fields
- Configure JWT and permissions
- Implement frontend auth (Zustand + Axios)
- Build login page and route protection

### Week 3: Product Gallery

- [ ] Add sample products with images
- Build product API service layer
- Create ProductCard and ProductGrid components
- Build StockBadge component
- Create products listing page
- Create product detail page with gallery

### Week 4: Smart Packaging Studio

- [ ] Add packaging customization options to Strapi
- Build PackagingStudio component
- Build selectors (BudStyle, Background, Typography, Size)
- Build PackagingPreview component
- Integrate with product detail page

### Week 5: Order Inquiry System

- [ ] Create OrderInquiry content type
- Build OrderInquiryForm component
- Integrate form with PackagingStudio
- Create orders listing page
- Create order detail page
- Add order status tracking

### Week 6: Media Hub & Dashboard

- [ ] Add marketing media to Strapi
- Build MediaGallery component
- Implement download functionality
- Create dashboard with stats and quick actions
- Add recent orders widget

### Week 7: Polish & Testing

- [ ] Customize Strapi admin panel
- Add loading states and error handling
- Improve responsive design
- Add animations
- Optimize images
- Cross-browser testing
- Bug fixes

### Week 8: Deployment

- [ ] Set up VPS with Docker
- Deploy Strapi + PostgreSQL to VPS
- Configure SSL with Let's Encrypt
- Deploy Next.js to Vercel
- Configure production environment variables
- Load production data
- Set up automated backups
- Soft launch to beta users
- Full launch

---
## SUMMARY & CRITICAL SUCCESS FACTORS

### Security Checklist

- Strong JWT secrets in production
- SSL certificates configured
- Database credentials secured
- Regular security updates
- Backup strategy in place

### User Experience

- Fast page loads (< 3 seconds)
- Mobile-responsive design
- Intuitive navigation
- Clear stock indicators
- Smooth customization flow

### Admin Experience

- Easy content management
- No developer needed for updates
- Clear admin documentation
- Order inquiry visibility

---
## Critical Files for Implementation

The 5 most critical files to create first:

1. /Users/justinecastaneda/Desktop/bcflame/docker-compose.yml - Orchestrates all services; defines the entire infrastructure; must be
 created before any container can run
2. /Users/justinecastaneda/Desktop/bcflame/backend/config/middlewares.ts - Configures CORS, security, and authentication for Strapi;
critical for frontend-backend communication
3. /Users/justinecastaneda/Desktop/bcflame/frontend/src/stores/authStore.ts - Manages authentication state; central to the entire
security model; used by every protected page
4. /Users/justinecastaneda/Desktop/bcflame/frontend/src/lib/api/strapi.ts - Axios instance with JWT interceptors; all API calls flow
through this; handles token injection and 401 errors
5. /Users/justinecastaneda/Desktop/bcflame/frontend/src/components/packaging/PackagingStudio.tsx - Core feature component for the
Smart Packaging Studio; primary differentiator of the portal

These files form the backbone of the application and should be implemented in this order during the initial setup phase.
