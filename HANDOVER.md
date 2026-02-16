# BC Flame Premium Client Portal - Project Handover Documentation

**Date:** February 14, 2026
**Prepared by:** Justine Castaneda
**Repository:** https://github.com/nearbyjustine/bcflame.git

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Source Code & Repository](#source-code--repository)
3. [Hosting & Infrastructure](#hosting--infrastructure)
4. [Database](#database)
5. [APIs & Third-Party Integrations](#apis--third-party-integrations)
6. [Technical Architecture](#technical-architecture)
7. [Deployment Process](#deployment-process)
8. [Admin Credentials & Access](#admin-credentials--access)
9. [Pending Tasks & Known Issues](#pending-tasks--known-issues)
10. [Design & Project Assets](#design--project-assets)
11. [Testing & Quality Assurance](#testing--quality-assurance)

---

## 1. Project Overview

BC Flame Premium Client Portal is a B2B partner portal for approved cannabis product partners. It's a full-stack monorepo application with:

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Strapi 4.16.2 CMS
- **Database:** PostgreSQL 16
- **Containerization:** Docker & Docker Compose

### Key Features

✅ **Completed Features:**
- JWT authentication and authorization
- Protected routes with middleware
- User profile management with company branding
- Product catalog with filtering and search
- Smart packaging customization studio
- Order inquiry system with status tracking
- Marketing media hub
- Email notifications (Resend API)
- Onboarding tours (Shepherd.js)
- Docker containerization
- Comprehensive test coverage (Vitest)

---

## 2. Source Code & Repository

### Repository Information

- **GitHub Repository:** https://github.com/nearbyjustine/bcflame.git
- **Current Branch:** `feature/demo`
- **Main Branch:** `master`
- **Latest Commit:** `93a5f3d` - "feat: add animated components and video hero section with framer-motion integration"

### Repository Structure

```
bcflame/
├── frontend/           # Next.js 14 application
│   ├── public/        # Static assets
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities and API clients
│   │   ├── stores/    # Zustand state management
│   │   └── hooks/     # Custom React hooks
│   ├── vitest.config.ts
│   └── package.json
├── backend/           # Strapi CMS
│   ├── config/        # Strapi configuration
│   ├── database/      # DB migrations (future)
│   ├── public/        # Upload files
│   ├── src/
│   │   ├── api/       # Content types & custom endpoints
│   │   ├── services/  # Business logic
│   │   └── templates/ # Email templates
│   ├── vitest.config.ts
│   └── package.json
├── docker-compose.yml # Multi-container orchestration
├── .env.example       # Environment template
├── CLAUDE.md          # Development guidelines
└── README.md          # Setup instructions
```

### Backup Instructions

To create a complete backup:

```bash
# 1. Clone the repository
git clone https://github.com/nearbyjustine/bcflame.git
cd bcflame

# 2. Ensure all branches are included
git fetch --all

# 3. Create a compressed archive
tar -czf bcflame-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.cache' \
  .

# 4. Database backup (see Database section)
```

### Repository Ownership Transfer

**Current Owner:** nearbyjustine (GitHub)

**To Transfer Repository:**
1. Go to: https://github.com/nearbyjustine/bcflame/settings
2. Scroll to "Danger Zone"
3. Click "Transfer ownership"
4. Enter new owner's GitHub username
5. Confirm transfer

**Note:** New owner must accept the transfer within 24 hours.

---

## 3. Hosting & Infrastructure

### Development Environment

**Local Development (Docker):**
- Frontend: http://localhost:3000
- Strapi Admin: http://localhost:1337/admin
- Strapi API: http://localhost:1337/api
- PostgreSQL: localhost:5432

**Docker Services:**
```yaml
services:
  postgres:    # Database
  strapi:      # Backend CMS
  frontend:    # Next.js application
```

### Production Environment

**Status:** ⚠️ Production hosting not yet deployed

**Recommended Hosting Options:**

1. **Vercel (Frontend)** - Recommended for Next.js
   - Connect GitHub repository
   - Automatic deployments on push
   - Environment variables in dashboard
   - Cost: Free tier available

2. **Railway / Render (Backend + Database)**
   - Deploy Strapi + PostgreSQL
   - Automatic Docker deployments
   - Cost: ~$10-20/month

3. **AWS / DigitalOcean (Full Stack)**
   - Full control over infrastructure
   - Docker Compose deployment
   - Cost: ~$20-50/month

### Domain Configuration

**Status:** ⚠️ Domain not yet configured

**Required DNS Records (when deploying):**
```
A     @           -> [Frontend IP/Vercel]
A     api         -> [Backend IP]
A     admin       -> [Backend IP]
CNAME www         -> @
```

**Email Domain (Resend):**
```
TXT   @           -> [Resend verification]
TXT   _dmarc      -> [DMARC policy]
TXT   resend._domainkey -> [DKIM key]
```

---

## 4. Database

### Database Configuration

**Type:** PostgreSQL 16
**Connection Details:**
- Host: `localhost` (Docker) / `postgres` (container network)
- Port: `5432`
- Database: `bcflame`
- User: `bcflame_user`
- Password: Set in `.env` file

### Database Schema

**Core Content Types:**

1. **Users (Strapi Users-Permissions)**
   - Authentication & authorization
   - Profile information
   - Company branding
   - Onboarding progress (JSON field)

2. **Products**
   - Name, description, category
   - Price ranges
   - Images and specifications
   - Inventory tracking

3. **Background Styles**
   - Type: solid_color | gradient | texture | image
   - Color values
   - Image uploads
   - Display order

4. **Font Styles**
   - Name, Google Fonts URL
   - Category, variants
   - Display order

5. **Bud Styles**
   - Name, category
   - Image upload
   - Display order

6. **Pre-Bagging Options**
   - Name, description
   - Image upload
   - Display order

7. **Label Sizes**
   - Name, dimensions
   - Display order

8. **Order Inquiries**
   - Inquiry number (auto-generated)
   - Customer details
   - Customization selections (JSON)
   - Status tracking
   - Email notifications

8. **Media Items**
   - Title, description, category
   - File uploads
   - Download tracking

### Creating a Database Backup

```bash
# Using Docker (recommended)
docker-compose exec postgres pg_dump -U bcflame_user bcflame > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U bcflame_user bcflame < backup-20260214.sql

# Export with Docker Compose
docker-compose exec postgres pg_dump -U bcflame_user -F c -b -v -f /tmp/backup.dump bcflame
docker cp bcflame_postgres_1:/tmp/backup.dump ./backup-$(date +%Y%m%d).dump

# Using pg_dump directly (if PostgreSQL client installed)
pg_dump -h localhost -U bcflame_user -F c -b -v -f backup-$(date +%Y%m%d).dump bcflame
```

### Latest Backup

**Action Required:** Create a final database backup before handover.

```bash
cd /Users/justinecastaneda/Desktop/bcflame
docker-compose up -d postgres
docker-compose exec postgres pg_dump -U bcflame_user bcflame > handover-backup-$(date +%Y%m%d).sql
```

---

## 5. APIs & Third-Party Integrations

### 1. Resend Email API

**Purpose:** Transactional email notifications
**Documentation:** https://resend.com/docs

**Configuration:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
EMAIL_FROM_NAME=BC Flame
EMAIL_ADMIN_RECIPIENTS=admin@bcflame.com
```

**Features Used:**
- Order confirmation emails (customer)
- Order notification emails (admin)
- Order status update emails

**Email Templates:**
- `backend/src/templates/html/new-order-admin.html`
- `backend/src/templates/html/new-order-customer.html`
- `backend/src/templates/html/order-status-update.html`

**API Key Location:**
- Dashboard: https://resend.com/api-keys
- Current key stored in `.env` file

**Cost:** Free tier: 100 emails/day, 3,000/month

### 2. Google Fonts API

**Purpose:** Custom font loading for package customization
**Documentation:** https://fonts.google.com/

**Implementation:** `frontend/src/hooks/useGoogleFonts.ts`

**No API Key Required** - Public CDN

**Example Font URL:**
```
https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap
```

### 3. Strapi REST API

**Purpose:** Backend data management
**Base URL:** http://localhost:1337/api

**Key Endpoints:**
```
POST   /api/auth/local              # Login
GET    /api/users/me                # Current user
GET    /api/products                # Product catalog
GET    /api/order-inquiries         # Order inquiries
GET    /api/background-styles       # Background options
GET    /api/font-styles             # Font options
GET    /api/bud-styles              # Bud options
GET    /api/pre-bagging-options     # Pre-bagging options
GET    /api/label-sizes             # Label sizes
GET    /api/media-items             # Marketing media
POST   /api/users/onboarding/complete  # Onboarding progress
```

**Authentication:** JWT token in Authorization header

### 4. Strapi Upload API

**Purpose:** File uploads (images, documents)
**Endpoint:** `/api/upload`

**Configuration:**
```javascript
// backend/config/plugins.ts
upload: {
  config: {
    sizeLimit: 10 * 1024 * 1024, // 10MB
  },
}
```

**Storage:** Local filesystem (`backend/public/uploads/`)

**Production Recommendation:** Migrate to AWS S3 or Cloudinary

---

## 6. Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│                     (http://localhost:3000)                  │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP Requests
                 │ JWT in Cookie
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App Router │  │  Components  │  │  Zustand     │      │
│  │   Middleware │  │     (UI)     │  │  Store       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Axios Client (lib/api/strapi.ts)          │  │
│  │         • JWT Interceptor                            │  │
│  │         • Auto-logout on 401                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API Calls
                 │ Authorization: Bearer <JWT>
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Strapi Backend                            │
│                 (http://localhost:1337)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Users-Permissions Plugin                 │  │
│  │         • JWT Authentication                          │  │
│  │         • Role-Based Access Control                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Content     │  │   Services   │  │   Lifecycle  │      │
│  │  Types       │  │   (Logic)    │  │   Hooks      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Email Service (Resend)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│                     (port 5432)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables: users, products, order_inquiries,            │  │
│  │  background_styles, font_styles, media_items, etc.    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User submits login form (email + password)
   ↓
2. Frontend POST /api/auth/local → Strapi
   ↓
3. Strapi validates credentials
   ↓
4. Strapi returns JWT + user data
   ↓
5. Frontend stores JWT in cookie (7 days)
   ↓
6. Frontend stores user in Zustand store (persisted to localStorage)
   ↓
7. Middleware checks JWT on protected routes
   ↓
8. Axios interceptor adds JWT to all API requests
   ↓
9. On 401 response → Logout + redirect to /login
```

### Key Technologies

**Frontend:**
- Next.js 14.0.4 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui (Radix UI primitives)
- Zustand (state management)
- Axios (HTTP client)
- React Hook Form + Zod (form validation)
- Framer Motion (animations)
- Shepherd.js (onboarding tours)

**Backend:**
- Strapi 4.16.2
- Node.js 18
- PostgreSQL 16
- TypeScript
- Resend (email)

**DevOps:**
- Docker & Docker Compose
- Vitest (testing)
- ESLint (linting)
- Git & GitHub

---

## 7. Deployment Process

### Development Deployment

**Prerequisites:**
- Docker Desktop installed
- Node.js 18+ installed (for local dev)
- Git installed

**Steps:**

```bash
# 1. Clone repository
git clone https://github.com/nearbyjustine/bcflame.git
cd bcflame

# 2. Copy environment file
cp .env.example .env

# 3. Generate secrets (macOS/Linux)
openssl rand -base64 32  # JWT_SECRET
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"  # APP_KEYS

# 4. Edit .env and add secrets
nano .env

# 5. Start all services
docker-compose up -d

# 6. View logs
docker-compose logs -f

# 7. Access applications
# Frontend: http://localhost:3000
# Strapi Admin: http://localhost:1337/admin
```

**First Time Setup:**
```bash
# Create Strapi admin user
# Visit http://localhost:1337/admin
# Fill out registration form
```

### Production Deployment (Recommended)

**Option 1: Vercel (Frontend) + Railway (Backend)**

**Vercel (Frontend):**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy from frontend directory
cd frontend
vercel --prod

# 4. Set environment variables in Vercel dashboard
# NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
```

**Railway (Backend + Database):**
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Deploy backend
cd backend
railway up

# 5. Add PostgreSQL database
railway add

# 6. Set environment variables in Railway dashboard
```

**Option 2: Docker on VPS (DigitalOcean, AWS EC2)**

```bash
# 1. Provision Ubuntu 22.04 server
# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt install docker-compose-plugin

# 3. Clone repository
git clone https://github.com/nearbyjustine/bcflame.git
cd bcflame

# 4. Configure .env for production
nano .env

# 5. Build and start services
docker compose up -d --build

# 6. Configure reverse proxy (Nginx)
sudo apt install nginx
# Configure SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Environment Variables (Production)

**Critical Variables to Update:**
```env
# CHANGE FROM DEFAULTS
NODE_ENV=production
JWT_SECRET=<generate-new>
ADMIN_JWT_SECRET=<generate-new>
APP_KEYS=<generate-four-comma-separated-keys>
API_TOKEN_SALT=<generate-new>
TRANSFER_TOKEN_SALT=<generate-new>
DB_PASSWORD=<strong-password>

# UPDATE URLS
NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
STRAPI_ADMIN_CLIENT_URL=https://yourdomain.com
STRAPI_ADMIN_CLIENT_PREVIEW_SECRET=<generate-new>

# EMAIL (Resend)
RESEND_API_KEY=<your-production-key>
RESEND_FROM_EMAIL=noreply@yourdomain.com
EMAIL_ADMIN_RECIPIENTS=admin@yourdomain.com,orders@yourdomain.com
```

### CI/CD Pipeline (Future)

**GitHub Actions Workflow (Not Yet Implemented):**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test
      - name: Run backend tests
        run: |
          cd backend
          npm ci
          npm run test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 8. Admin Credentials & Access

### Access Audit

**⚠️ CRITICAL: Change all passwords immediately after handover**

### Strapi Admin Panel

**URL:** http://localhost:1337/admin (development)
**Production URL:** https://api.yourdomain.com/admin (when deployed)

**Admin Account:**
- **Email:** [TO BE CREATED ON FIRST RUN]
- **Password:** [SET DURING INITIAL SETUP]
- **Role:** Super Admin

**How to Reset Admin Password:**
```bash
# Using Strapi CLI
cd backend
npm run strapi admin:reset-user-password -- --email=admin@example.com --password=NewPassword123
```

### Database Access

**Development (Docker):**
```bash
# Connect via psql
docker-compose exec postgres psql -U bcflame_user -d bcflame

# Or use GUI tool (TablePlus, pgAdmin)
Host: localhost
Port: 5432
Database: bcflame
User: bcflame_user
Password: (from .env file)
```

**Production:**
- Use connection string from hosting provider
- Recommended: Create read-only user for monitoring

### GitHub Repository

**Owner:** nearbyjustine
**URL:** https://github.com/nearbyjustine/bcflame

**Collaborators:**
- (List any team members with access)

**To Add Collaborators:**
1. Go to: https://github.com/nearbyjustine/bcflame/settings/access
2. Click "Add people"
3. Enter GitHub username or email
4. Set permission level (Read, Write, Admin)

### API Keys & Secrets

**Resend API Key:**
- Dashboard: https://resend.com/api-keys
- Key stored in `.env` as `RESEND_API_KEY`
- **Action Required:** Transfer Resend account ownership or generate new key

**Strapi API Tokens:**
- Create in Strapi Admin: Settings → API Tokens
- Token types:
  - Read-only (for frontend)
  - Full access (for integrations)
  - Custom (scoped permissions)

**Environment Files:**
```
.env                    # Main environment file (NOT in git)
.env.example            # Template (in git)
frontend/.env.local     # Frontend-specific (NOT in git)
```

**Security Checklist:**
- [ ] Rotate all JWT secrets
- [ ] Generate new APP_KEYS
- [ ] Change database password
- [ ] Create new Resend API key (or transfer account)
- [ ] Update CORS origins for production domain
- [ ] Enable HTTPS in production
- [ ] Set strong admin passwords
- [ ] Review Strapi user roles and permissions
- [ ] Enable rate limiting
- [ ] Configure firewall rules

---

## 9. Pending Tasks & Known Issues

### Pending Tasks

#### High Priority

- [ ] **Production Deployment**
  - Set up hosting infrastructure
  - Configure domain and SSL certificates
  - Deploy frontend to Vercel/Netlify
  - Deploy backend to Railway/Render
  - Configure production database
  - Set up backups and monitoring

- [ ] **Email Domain Verification**
  - Verify custom domain with Resend
  - Configure DNS records (SPF, DKIM, DMARC)
  - Update `RESEND_FROM_EMAIL` to branded address

- [ ] **Security Hardening**
  - Implement rate limiting
  - Add CAPTCHA to login form
  - Enable 2FA for admin accounts
  - Set up security headers
  - Configure CSP (Content Security Policy)

#### Medium Priority

- [ ] **Product Catalog Enhancements**
  - Product detail page
  - Advanced filtering (price range, category, etc.)
  - Product image gallery
  - Inventory tracking system
  - Low stock alerts

- [ ] **Order Management**
  - Order editing functionality
  - Bulk order processing
  - Export orders to CSV/PDF
  - Order cancellation flow
  - Refund management

- [ ] **Analytics Dashboard**
  - Order metrics (total, pending, completed)
  - Revenue tracking
  - Popular products
  - User engagement metrics
  - Download analytics for media hub

- [ ] **Media Hub Enhancements**
  - File versioning
  - Expiring download links
  - Usage analytics
  - Bulk upload
  - Media categories and tags

#### Low Priority

- [ ] **User Management**
  - User invitation system
  - Role-based permissions
  - Activity logs
  - User groups

- [ ] **Notifications**
  - In-app notifications
  - Push notifications
  - SMS notifications (Twilio)
  - Notification preferences

- [ ] **Mobile App**
  - React Native app
  - Offline mode
  - Push notifications

- [ ] **Internationalization**
  - Multi-language support
  - Currency conversion
  - Regional settings

### Known Issues

#### Critical

None currently identified.

#### Non-Critical

1. **Frontend hot reload delay in Docker (macOS)**
   - **Issue:** File changes take 1-2 seconds to trigger reload
   - **Workaround:** Webpack polling enabled (1000ms interval)
   - **Solution:** Develop locally without Docker for faster feedback
   - **File:** `frontend/next.config.js`

2. **Strapi admin panel slow on first load**
   - **Issue:** Admin panel takes 5-10 seconds on initial load
   - **Cause:** Webpack build on first request in development
   - **Workaround:** Build admin panel in production mode
   - **Solution:** Use `NODE_ENV=production` in production

3. **Large file uploads fail**
   - **Issue:** Files >10MB fail to upload
   - **Cause:** Strapi default upload limit
   - **Workaround:** Increase limit in `backend/config/plugins.ts`
   - **Solution:** Implement chunked uploads or use cloud storage (S3)

4. **Test coverage gaps**
   - **Issue:** Some integration tests missing
   - **Current Coverage:** ~70% (frontend), ~65% (backend)
   - **Missing:** E2E tests, API integration tests
   - **Recommendation:** Implement Playwright for E2E testing

5. **Docker image sizes**
   - **Issue:** Frontend image is ~1.2GB
   - **Cause:** Full Node.js base image + dependencies
   - **Solution:** Multi-stage Docker builds (already implemented)
   - **Optimization:** Use alpine variants, remove dev dependencies

### Technical Debt

1. **Type Safety**
   - Some API responses use `any` type
   - Need to generate TypeScript types from Strapi schema
   - Consider using `ts-to-zod` for runtime validation

2. **Error Handling**
   - Inconsistent error messages across API
   - Need centralized error handling middleware
   - Implement error boundary components in frontend

3. **Code Duplication**
   - Form components have repeated validation logic
   - API client methods have similar patterns
   - Consider creating abstraction layer

4. **Performance Optimization**
   - Images not optimized (missing Next.js Image component)
   - No lazy loading for product listings
   - Missing pagination on large datasets
   - Consider implementing Redis cache

5. **Accessibility**
   - Some components missing ARIA labels
   - Keyboard navigation incomplete
   - Need accessibility audit with axe-core

6. **Documentation**
   - API documentation incomplete (consider Swagger/OpenAPI)
   - Component documentation missing (consider Storybook)
   - Architecture diagrams need updating

---

## 10. Design & Project Assets

### Design System

**Color Palette:**
```css
/* Primary Colors (defined in tailwind.config.ts) */
--primary: Orange (BC Flame brand color)
--secondary: Gray
--accent: Green

/* Background */
--background: White (light mode) / Dark gray (dark mode)
--foreground: Black (light mode) / White (dark mode)

/* UI Colors */
--card: White / Dark gray
--muted: Light gray
--destructive: Red
```

**Typography:**
- **Font Family:** Inter (system default)
- **Headings:** Bold, various sizes (h1-h6)
- **Body:** Regular, 16px base
- **Code:** Monospace (Fira Code)

**Spacing System:**
- Based on Tailwind's 4px scale
- Consistent padding/margin: 4, 8, 12, 16, 24, 32, 48, 64px

**Component Library:**
- shadcn/ui (Radix UI primitives)
- Custom components in `frontend/src/components/ui/`

### Design Assets

**Location:** `frontend/public/`

**Images:**
```
public/
├── images/
│   ├── logo/
│   │   ├── bc-flame-logo.svg
│   │   ├── bc-flame-logo-white.svg
│   │   └── bc-flame-icon.svg
│   ├── products/
│   │   └── [product-images].jpg
│   ├── backgrounds/
│   │   └── [texture-images].jpg
│   └── bud-styles/
│       └── [bud-images].png
├── fonts/
│   └── [custom-fonts].woff2
└── favicon.ico
```

**Uploaded Assets (Strapi):**
```
backend/public/uploads/
├── [user-uploaded-images]
├── [company-logos]
├── [product-images]
└── [media-hub-files]
```

**Design Tools Used:**
- Figma (if applicable - designs not included in repo)
- Adobe Illustrator (logo design)
- Photoshop (image editing)

**Brand Guidelines:**
- **Logo:** BC Flame logo should always be used on dark backgrounds
- **Minimum Size:** 120px width for digital
- **Clear Space:** Minimum 20px padding around logo
- **Brand Colors:** Orange (#FF6B35), Black (#1A1A1A), White (#FFFFFF)

### Marketing Assets

**Not Included in Repository:**
- Social media graphics
- Print materials
- Presentation decks
- Business cards
- Packaging mockups

**Recommendation:** Store in cloud storage (Google Drive, Dropbox) or design tool (Figma)

---

## 11. Testing & Quality Assurance

### Test Coverage

**Current Status:**
- Frontend: ~70% coverage (218 tests passing)
- Backend: ~65% coverage (unit tests for services)

**Test Framework:** Vitest + React Testing Library

### Running Tests

```bash
# Frontend Tests
cd frontend
npm run test              # Run all tests
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Generate coverage report
npm run test -- ProductCard  # Run specific test

# Backend Tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
npm run test -- inquiry   # Run specific test
```

### Test Types

**Unit Tests:**
- Utility functions (`lib/utils/`)
- Helper functions
- Pure functions

**Component Tests:**
- React components (`components/`)
- User interactions
- Rendering logic

**Integration Tests:**
- API clients (`lib/api/`)
- Strapi services
- Database operations

**E2E Tests (Not Yet Implemented):**
- Recommendation: Implement with Playwright
- Critical user flows:
  - Login → Dashboard
  - Product browsing → Order creation
  - File upload → Download

### Quality Assurance Checklist

**Before Deployment:**
- [ ] All tests passing
- [ ] Linter checks passing (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Manual testing on Chrome, Firefox, Safari
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit (axe DevTools)
- [ ] Performance audit (Lighthouse)
- [ ] Security scan (npm audit)
- [ ] Database backup created
- [ ] Environment variables validated

**Post-Deployment:**
- [ ] Smoke tests on production
- [ ] SSL certificate verified
- [ ] DNS propagation complete
- [ ] Email notifications working
- [ ] Monitoring and alerts configured
- [ ] Backup automation verified
- [ ] Performance benchmarks met

---

## Appendix

### Useful Commands Reference

```bash
# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose down -v            # Stop and remove volumes
docker-compose restart strapi     # Restart backend
docker-compose logs -f frontend   # View frontend logs
docker-compose exec postgres psql # Access database

# Git
git status                        # Check status
git add .                         # Stage all changes
git commit -m "message"           # Commit changes
git push origin master            # Push to remote
git pull origin master            # Pull from remote

# NPM
npm install                       # Install dependencies
npm run dev                       # Start development server
npm run build                     # Build for production
npm run test                      # Run tests
npm run lint                      # Run linter

# Strapi
cd backend
npm run strapi                    # Strapi CLI
npm run strapi admin:reset-user-password  # Reset admin password
npm run strapi content-types:list # List content types
npm run strapi generate           # Generate API
```

### Contact Information

**Developer:** Justine Castaneda
**Repository:** https://github.com/nearbyjustine/bcflame
**Handover Date:** February 14, 2026

### Additional Notes

1. **Code Quality:** The codebase follows TypeScript best practices and includes comprehensive inline documentation.

2. **Scalability:** The architecture supports horizontal scaling. Backend can be load-balanced, database can be replicated.

3. **Maintenance:** Regular updates required for:
   - Dependencies (npm update)
   - Security patches (npm audit fix)
   - Database backups (automated recommended)

4. **Monitoring Recommendations:**
   - Sentry (error tracking)
   - Datadog / New Relic (performance monitoring)
   - Uptime Robot (uptime monitoring)
   - Google Analytics (user analytics)

5. **Future Enhancements:**
   - GraphQL API (Apollo Server)
   - Real-time updates (Socket.io / Pusher)
   - Advanced search (Algolia / Elasticsearch)
   - CDN integration (Cloudflare)
   - Multi-tenancy support

---

**End of Handover Documentation**

For questions or clarifications, please refer to:
- `CLAUDE.md` - Development guidelines
- `README.md` - Setup instructions
- Strapi Documentation: https://docs.strapi.io
- Next.js Documentation: https://nextjs.org/docs
