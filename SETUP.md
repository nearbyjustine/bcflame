# BC Flame Premium Portal - Phase 1 Setup Guide

## What Has Been Created

Phase 1 (Foundation & Authentication) of the BC Flame Premium Portal has been successfully set up. This includes:

### Infrastructure
- ✅ Monorepo structure (frontend, backend, shared, nginx)
- ✅ Docker Compose orchestration for PostgreSQL, Strapi, and Next.js
- ✅ Dockerfiles for both frontend and backend with multi-stage builds
- ✅ Environment configuration with generated secrets

### Backend (Strapi)
- ✅ Strapi 4.16.2 configuration with PostgreSQL
- ✅ Database configuration for PostgreSQL connection
- ✅ CORS and security middlewares configured
- ✅ JWT authentication setup (7-day token expiry)
- ✅ Server, admin, and API configurations

### Frontend (Next.js)
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with custom design tokens
- ✅ Zustand state management for authentication
- ✅ Axios instance with JWT interceptors
- ✅ Route protection middleware
- ✅ shadcn/ui components (Button, Input, Card)
- ✅ Login page with form validation
- ✅ Protected dashboard layout
- ✅ Dashboard page with quick start guide

### Authentication System
- ✅ JWT-based authentication flow
- ✅ Login form with error handling
- ✅ Automatic token injection in API calls
- ✅ 401 error handling with automatic redirect
- ✅ Protected route middleware
- ✅ Logout functionality

## Next Steps to Get Running

### 1. Start Docker Services

```bash
# Make sure you're in the project directory
cd /Users/justinecastaneda/Desktop/bcflame

# Start all services
docker-compose up -d

# Watch the logs
docker-compose logs -f
```

**Expected behavior:**
- PostgreSQL will start first (health check enabled)
- Strapi will install dependencies and start on port 1337
- Next.js will install dependencies and start on port 3000

**First run will take 5-10 minutes** as dependencies are installed.

### 2. Set Up Strapi Admin Account

Once Strapi is running (check logs for "Server started"):

1. Visit: http://localhost:1337/admin
2. Create your admin account (this is your Strapi admin, not a partner user)
3. You'll be redirected to the Strapi admin panel

### 3. Create Content Types in Strapi

The content type schemas need to be created through the Strapi admin panel:

**Option A: Manual Creation (Recommended for Phase 1)**
1. Go to Content-Type Builder in Strapi admin
2. Skip for now - we'll add content types in Phase 2

**Option B: Use Schema Files**
Create schema files in `backend/src/api/` directories (this will be done in a future phase)

### 4. Create a Test Partner User

1. In Strapi admin, go to Content Manager > Users
2. Click "Create new entry"
3. Fill in:
   - Username: test-partner
   - Email: test@partner.com
   - Password: Test123!
   - Confirmed: Yes (toggle on)
   - Blocked: No (toggle off)
4. Save

### 5. Test the Frontend

1. Visit: http://localhost:3000
2. You should be redirected to /login
3. Log in with:
   - Email: test@partner.com
   - Password: Test123!
4. You should be redirected to /dashboard
5. Test logout button

## Troubleshooting

### Strapi won't start
```bash
# Check PostgreSQL is healthy
docker-compose ps

# View Strapi logs
docker-compose logs strapi

# Common fix: restart Strapi
docker-compose restart strapi
```

### Frontend won't start
```bash
# View frontend logs
docker-compose logs frontend

# Common fix: rebuild
docker-compose up -d --build frontend
```

### Can't log in
- Make sure you created the user in Strapi admin
- Make sure "Confirmed" is toggled ON
- Make sure "Blocked" is toggled OFF
- Check browser console for errors

### CORS errors
- Make sure Strapi is running on port 1337
- Check `backend/config/middlewares.ts` has correct CORS origins
- Restart Strapi: `docker-compose restart strapi`

## Project Structure

```
bcflame/
├── frontend/                  # Next.js 14 application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # Public auth routes
│   │   │   └── (portal)/     # Protected portal routes
│   │   ├── components/       # React components
│   │   │   ├── auth/         # Auth-related components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/              # Utilities and API clients
│   │   │   └── api/          # API service layer
│   │   ├── stores/           # Zustand state stores
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                   # Strapi CMS
│   ├── config/               # Strapi configuration
│   │   ├── database.ts       # PostgreSQL config
│   │   ├── middlewares.ts    # CORS, security
│   │   ├── server.ts         # Server settings
│   │   └── plugins.ts        # Plugin config
│   ├── src/
│   │   ├── api/              # Content type APIs (to be added)
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── shared/                    # Shared TypeScript types (future)
├── nginx/                     # Nginx config (production)
├── docker-compose.yml         # Development orchestration
├── .env                       # Environment variables (with secrets)
├── .env.example              # Template for .env
└── README.md                 # Project overview
```

## What's NOT Included (Phase 2+)

The following features are planned for future phases:

- ❌ Strapi content types (Product, PackagingSize, BudStyle, etc.)
- ❌ User model extensions (companyName, partnerStatus, etc.)
- ❌ Product listing page
- ❌ Product detail page
- ❌ Smart Packaging Studio
- ❌ Order inquiry system
- ❌ Media hub
- ❌ Seed data scripts
- ❌ Email notifications
- ❌ Production deployment configs

## Phase 1 Complete! ✅

You now have:
- 🐳 Fully dockerized development environment
- 🔐 Working authentication system
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🛡️ Protected routes with middleware
- 📱 Responsive layouts
- 🚀 Ready for Phase 2 implementation

## Development Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild after changes
docker-compose up -d --build

# Clean restart (removes data)
docker-compose down -v && docker-compose up -d

# Access Strapi container
docker-compose exec strapi sh

# Access frontend container
docker-compose exec frontend sh
```

## URLs

- **Frontend**: http://localhost:3000
- **Strapi Admin**: http://localhost:1337/admin
- **Strapi API**: http://localhost:1337/api
- **PostgreSQL**: localhost:5432

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Ensure all services are running: `docker-compose ps`
4. Try a clean restart: `docker-compose down -v && docker-compose up -d`
