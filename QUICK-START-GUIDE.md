# BC Flame - Quick Start Guide for New Developer

**For:** New developer taking over the project
**Read this first:** This is a condensed version of HANDOVER.md to get you up and running quickly.

---

## 🚀 Getting Started (5 minutes)

### Prerequisites
```bash
# Check you have these installed:
docker --version        # Docker 20+
docker compose version  # Docker Compose 2+
node --version         # Node.js 18+
git --version          # Git 2+
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/nearbyjustine/bcflame.git
cd bcflame

# 2. Copy environment file
cp .env.example .env

# 3. Generate secrets (macOS/Linux)
# JWT_SECRET
openssl rand -base64 32

# APP_KEYS (you need 4 keys, comma-separated)
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"

# API_TOKEN_SALT
openssl rand -base64 32

# TRANSFER_TOKEN_SALT
openssl rand -base64 32

# 4. Edit .env and paste the generated secrets
nano .env  # or use your preferred editor

# 5. Start all services
docker-compose up -d

# 6. Wait for services to be ready (~30 seconds)
docker-compose logs -f
# Press Ctrl+C when you see "Server started on port 3000" and "Server started on port 1337"
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Strapi Admin:** http://localhost:1337/admin
- **Strapi API:** http://localhost:1337/api

**First time?** Create admin account at http://localhost:1337/admin

---

## 📂 Project Structure

```
bcflame/
├── frontend/          # Next.js 14 application (Port 3000)
│   ├── src/
│   │   ├── app/       # Pages (App Router)
│   │   ├── components/# React components
│   │   ├── lib/       # API clients & utilities
│   │   └── stores/    # Zustand state management
│   └── package.json
│
├── backend/           # Strapi CMS (Port 1337)
│   ├── src/
│   │   ├── api/       # Content types & endpoints
│   │   ├── services/  # Business logic
│   │   └── templates/ # Email templates
│   ├── config/        # Strapi configuration
│   └── package.json
│
├── docker-compose.yml # 3 services: postgres, strapi, frontend
└── .env               # Environment variables (NOT in git)
```

---

## 🛠️ Common Commands

### Docker (Primary workflow)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f strapi    # Backend only
docker-compose logs -f frontend  # Frontend only

# Restart after code changes
docker-compose restart strapi    # Backend changes
docker-compose restart frontend  # Frontend changes

# Stop everything
docker-compose down

# Clean reset (removes database data!)
docker-compose down -v

# Rebuild after Dockerfile changes
docker-compose up -d --build
```

### Local Development (Without Docker)

```bash
# Install dependencies (first time only)
npm run install:all

# Start backend (Terminal 1)
npm run dev:backend
# Access: http://localhost:1337/admin

# Start frontend (Terminal 2)
npm run dev:frontend
# Access: http://localhost:3000
```

### Testing

```bash
# Frontend tests
cd frontend
npm run test              # Run all tests
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Coverage report

# Backend tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
```

### Database

```bash
# Backup database
docker-compose exec postgres pg_dump -U bcflame_user bcflame > backup.sql

# Restore database
docker-compose exec -T postgres psql -U bcflame_user bcflame < backup.sql

# Connect to database
docker-compose exec postgres psql -U bcflame_user bcflame

# Reset database (destructive!)
docker-compose down -v
docker-compose up -d
```

---

## 🔑 Key Concepts

### Authentication Flow

1. User logs in at `/login`
2. Frontend sends credentials to `/api/auth/local` (Strapi)
3. Strapi returns JWT token + user data
4. JWT stored in cookie (7 days)
5. Middleware checks JWT on protected routes
6. Axios automatically adds JWT to API requests

### Protected Routes

These routes require authentication (see `frontend/src/middleware.ts`):
- `/dashboard`
- `/products`
- `/orders`
- `/media-hub`
- `/profile`

### Content Types (Strapi)

- **Users** - Authentication & profiles
- **Products** - Product catalog
- **Order Inquiries** - Customer orders
- **Background Styles** - Package customization options
- **Font Styles** - Font customization options
- **Bud Styles** - Bud image options
- **Pre-Bagging Options** - Pre-bagging selections
- **Label Sizes** - Label size options
- **Media Items** - Marketing materials

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start, then try again
docker-compose up -d
```

### "Port already in use"
```bash
# Find what's using the port
lsof -i :3000  # Frontend
lsof -i :1337  # Backend
lsof -i :5432  # Database

# Kill the process
kill -9 <PID>
```

### "Database connection error"
```bash
# Check postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### "401 Unauthorized" errors
```bash
# JWT may be expired or invalid
# Clear cookies and login again
# Or check that JWT_SECRET matches between .env and database
```

### Frontend changes not reflecting
```bash
# Webpack polling is enabled for Docker on macOS
# Changes should appear in 1-2 seconds
# If not, restart frontend:
docker-compose restart frontend
```

### Backend changes not reflecting
```bash
# Restart backend
docker-compose restart strapi

# Or rebuild
docker-compose up -d --build strapi
```

---

## 📧 Email Configuration

**Current Setup:** Resend API

```env
# In .env file
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev  # Default (no verification needed)
EMAIL_FROM_NAME=BC Flame
EMAIL_ADMIN_RECIPIENTS=admin@example.com
```

**Emails sent automatically:**
- New order confirmation (customer)
- New order notification (admin)
- Order status updates

**Test emails:**
1. Create an order inquiry in the app
2. Check inbox (or spam folder)
3. View logs: `docker-compose logs strapi | grep email`

---

## 🚢 Deployment (Future)

**Not yet deployed to production.**

**Recommended Stack:**
- **Frontend:** Vercel (free tier)
- **Backend:** Railway or Render ($10-20/month)
- **Database:** Railway PostgreSQL (included)

**See HANDOVER.md section 7** for detailed deployment instructions.

---

## 📚 Important Files

### Must Read
- **HANDOVER.md** - Complete project documentation
- **CLAUDE.md** - Development guidelines
- **README.md** - Setup instructions

### Configuration
- **.env** - Environment variables (create from .env.example)
- **docker-compose.yml** - Multi-container setup
- **frontend/next.config.js** - Next.js configuration
- **backend/config/** - Strapi configuration

### Entry Points
- **frontend/src/app/layout.tsx** - Root layout
- **frontend/src/app/(portal)/dashboard/page.tsx** - Main dashboard
- **frontend/src/middleware.ts** - Route protection
- **backend/src/index.ts** - Strapi bootstrap

---

## 🆘 Getting Help

### Documentation
- **Project Docs:** See HANDOVER.md
- **Next.js:** https://nextjs.org/docs
- **Strapi:** https://docs.strapi.io
- **Docker:** https://docs.docker.com

### Common Questions

**Q: How do I add a new page?**
```bash
# Create new file in frontend/src/app/
# Example: frontend/src/app/(portal)/new-page/page.tsx

'use client'

export default function NewPage() {
  return <div>New Page</div>
}
```

**Q: How do I add a new API endpoint in Strapi?**
```bash
# Use Strapi admin panel:
# 1. Go to Content-Type Builder
# 2. Create new Collection Type
# 3. Add fields
# 4. Save and restart backend
# 5. API endpoint auto-generated at /api/[type-name]
```

**Q: How do I add a new environment variable?**
```bash
# 1. Add to .env file
NEW_VAR=value

# 2. Restart services
docker-compose restart

# 3. Access in code:
# Backend: process.env.NEW_VAR
# Frontend: process.env.NEXT_PUBLIC_NEW_VAR (must start with NEXT_PUBLIC_)
```

**Q: Tests are failing, what do I do?**
```bash
# Run tests in watch mode to see errors
cd frontend
npm run test:watch

# Or check coverage
npm run test:coverage

# Common issues:
# - Missing mocks
# - Outdated snapshots (press 'u' to update)
# - Import path issues
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Docker services are running: `docker-compose ps`
- [ ] Frontend loads: http://localhost:3000
- [ ] Strapi admin loads: http://localhost:1337/admin
- [ ] Can create admin account
- [ ] Can login to frontend
- [ ] Dashboard loads after login
- [ ] Products page shows products
- [ ] Can create order inquiry
- [ ] Email notification sent (check logs)
- [ ] Frontend tests pass: `cd frontend && npm run test`
- [ ] Backend tests pass: `cd backend && npm run test`

---

## 🎯 Next Steps

1. **Read full documentation:** Open HANDOVER.md and read sections 1-6
2. **Explore the code:** Start with key files listed above
3. **Run tests:** Ensure all tests pass
4. **Make a small change:** Try editing a component
5. **Review pending tasks:** See HANDOVER.md section 9

---

## 📞 Contact

**Previous Developer:** Justine Castaneda
**Repository:** https://github.com/nearbyjustine/bcflame
**Handover Date:** February 14, 2026

---

**You're all set! 🎉**

This project uses **Test-Driven Development (TDD)** - write tests before implementation.

For detailed information, see **HANDOVER.md**.
