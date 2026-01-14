# BC Flame - Traefik Deployment Guide

This guide covers deploying BC Flame to a server with an existing Traefik reverse proxy.

## Prerequisites

- Server with Traefik already running
- Traefik configured with a `proxy` network
- Docker and Docker Compose installed
- Domain(s) configured in DNS

---

## Architecture

```
Traefik (existing)
    ├── bcflame.com → Frontend (Next.js on port 3000)
    ├── www.bcflame.com → Frontend (Next.js on port 3000)
    └── api.bcflame.com → Strapi (API on port 1337)
         └── postgres (internal network only)
```

---

## Quick Start

### 1. Clone Repository

```bash
cd /path/to/your/apps
git clone https://github.com/yourusername/bcflame.git
cd bcflame
git checkout feat/traefik-deployment
```

### 2. Configure Environment

```bash
# Copy Traefik environment template
cp .env.traefik.example .env.traefik

# Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "APP_KEYS=$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"

# Edit environment file
nano .env.traefik
```

### 3. Update Configuration

**Required changes in `.env.traefik`:**

```bash
# Database
DB_PASSWORD=<strong-password>

# Secrets (from generated values above)
JWT_SECRET=<generated>
ADMIN_JWT_SECRET=<generated>
APP_KEYS=<generated>
API_TOKEN_SALT=<generated>
TRANSFER_TOKEN_SALT=<generated>

# Domains (update with your actual domains)
FRONTEND_DOMAIN=bcflame.com
API_DOMAIN=api.bcflame.com

# CORS Origins (must match exactly)
CORS_ORIGINS=https://bcflame.com,https://www.bcflame.com,https://api.bcflame.com

# Frontend URLs
NEXT_PUBLIC_STRAPI_URL=https://api.bcflame.com
NEXT_PUBLIC_SITE_URL=https://bcflame.com

# Email settings
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_ADDRESS=noreply@bcflame.com
EMAIL_ADMIN_RECIPIENTS=admin@bcflame.com

# First deployment only
SEED_DATA=true
```

### 4. Verify Traefik Network

```bash
# Check if 'proxy' network exists
docker network ls | grep proxy

# If not exists, create it
docker network create proxy
```

### 5. Deploy Application

```bash
# Load environment variables
export $(cat .env.traefik | xargs)

# Build and start services
docker-compose -f docker-compose.traefik.yml up -d --build

# Watch logs
docker-compose -f docker-compose.traefik.yml logs -f

# Wait for all services to be healthy (~2-3 minutes)
# Press Ctrl+C when done watching
```

### 6. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.traefik.yml ps

# Should show:
# bcflame_postgres   Up (healthy)
# bcflame_strapi     Up (healthy)
# bcflame_frontend   Up (healthy)
```

### 7. Access Application

- **Frontend:** https://bcflame.com (or your domain)
- **Admin Panel:** https://api.bcflame.com/admin
- **API Health:** https://api.bcflame.com/_health

Create your Strapi admin account on first visit to the admin panel.

### 8. Disable Seeding (After First Deployment)

```bash
# Edit .env.traefik
nano .env.traefik

# Change:
SEED_DATA=false

# Restart Strapi
docker-compose -f docker-compose.traefik.yml restart strapi
```

---

## DNS Configuration

Configure these DNS records for your domain:

```
Type    Name    Value                   TTL
A       @       your-server-ip          3600
A       www     your-server-ip          3600
A       api     your-server-ip          3600
```

---

## Traefik Labels Explained

### Frontend Service

```yaml
labels:
  - "traefik.enable=true"
  # Route requests to bcflame.com and www.bcflame.com
  - "traefik.http.routers.bcflame-web.rule=Host(`bcflame.com`) || Host(`www.bcflame.com`)"
  # Use 'web' entrypoint (port 80/443)
  - "traefik.http.routers.bcflame-web.entrypoints=web"
  # Forward to port 3000 (Next.js)
  - "traefik.http.services.bcflame-web.loadbalancer.server.port=3000"
  # Force HTTPS headers for proper redirects
  - "traefik.http.middlewares.bcflame-web-https.headers.customrequestheaders.X-Forwarded-Proto=https"
  - "traefik.http.middlewares.bcflame-web-https.headers.customrequestheaders.X-Forwarded-Port=443"
  - "traefik.http.routers.bcflame-web.middlewares=bcflame-web-https"
```

### Strapi API Service

```yaml
labels:
  - "traefik.enable=true"
  # Route requests to api.bcflame.com
  - "traefik.http.routers.bcflame-api.rule=Host(`api.bcflame.com`)"
  - "traefik.http.routers.bcflame-api.entrypoints=web"
  # Forward to port 1337 (Strapi)
  - "traefik.http.services.bcflame-api.loadbalancer.server.port=1337"
  # Force HTTPS headers
  - "traefik.http.middlewares.bcflame-api-https.headers.customrequestheaders.X-Forwarded-Proto=https"
  - "traefik.http.middlewares.bcflame-api-https.headers.customrequestheaders.X-Forwarded-Port=443"
  - "traefik.http.routers.bcflame-api.middlewares=bcflame-api-https"
```

---

## Local Development with Traefik

For local testing with Traefik on your development machine:

```bash
# Update .env.traefik for localhost
FRONTEND_DOMAIN=bcflame.localhost
API_DOMAIN=api.bcflame.localhost
CORS_ORIGINS=http://bcflame.localhost,http://www.bcflame.localhost,http://api.bcflame.localhost
NEXT_PUBLIC_STRAPI_URL=http://api.bcflame.localhost
NEXT_PUBLIC_SITE_URL=http://bcflame.localhost

# Deploy
docker-compose -f docker-compose.traefik.yml up -d --build

# Access at:
# - http://bcflame.localhost
# - http://api.bcflame.localhost/admin
```

---

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.traefik.yml logs -f

# Specific service
docker-compose -f docker-compose.traefik.yml logs -f strapi
docker-compose -f docker-compose.traefik.yml logs -f frontend
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.traefik.yml restart

# Specific service
docker-compose -f docker-compose.traefik.yml restart strapi
```

### Update Application

```bash
# Pull latest code
git pull origin feat/traefik-deployment

# Reload environment
export $(cat .env.traefik | xargs)

# Rebuild and restart
docker-compose -f docker-compose.traefik.yml up -d --build
```

### Stop Services

```bash
# Stop all (keeps data)
docker-compose -f docker-compose.traefik.yml down

# Stop all and remove volumes (DESTRUCTIVE)
docker-compose -f docker-compose.traefik.yml down -v
```

### Database Backup

```bash
# Backup
docker exec bcflame_postgres pg_dump -U bcflame bcflame_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_YYYYMMDD.sql | docker exec -i bcflame_postgres psql -U bcflame bcflame_db
```

---

## Troubleshooting

### Services Not Accessible via Domain

**Check Traefik Dashboard:**
```bash
# Verify routes are registered
docker exec traefik cat /etc/traefik/traefik.yml
# Check if bcflame-web and bcflame-api routers appear
```

**Check Traefik Labels:**
```bash
# Inspect frontend labels
docker inspect bcflame_frontend | grep -A 20 Labels

# Inspect strapi labels
docker inspect bcflame_strapi | grep -A 20 Labels
```

**Verify Network:**
```bash
# Both services should be on 'proxy' network
docker network inspect proxy
```

### CORS Errors

**Issue:** Frontend can't communicate with API

**Solution:**
```bash
# Verify CORS_ORIGINS matches exactly
# Must include protocol (https://) and all domains
CORS_ORIGINS=https://bcflame.com,https://www.bcflame.com,https://api.bcflame.com

# Restart Strapi after changing
docker-compose -f docker-compose.traefik.yml restart strapi
```

### Database Connection Errors

```bash
# Check postgres is healthy
docker-compose -f docker-compose.traefik.yml ps postgres

# Check connection from Strapi
docker exec bcflame_strapi wget --spider http://postgres:5432

# Check logs
docker-compose -f docker-compose.traefik.yml logs postgres
```

### Health Checks Failing

```bash
# Check Strapi health endpoint
docker exec bcflame_strapi wget --spider http://localhost:1337/_health

# Check Frontend health
docker exec bcflame_frontend wget --spider http://localhost:3000

# View health check logs
docker inspect bcflame_strapi | grep -A 10 Health
```

---

## Network Architecture

```
┌─────────────────────────────────────┐
│ Traefik (External Proxy Network)   │
│ - Handles SSL/TLS termination       │
│ - Routes by hostname                │
│ - Automatic HTTPS redirect          │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────┐  ┌───────▼────────┐
│   Frontend   │  │    Strapi      │
│  (port 3000) │  │  (port 1337)   │
│              │  │                │
│ Networks:    │  │ Networks:      │
│ - proxy      │  │ - proxy        │
│ - internal   │  │ - internal     │
└──────────────┘  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │   PostgreSQL   │
                  │  (port 5432)   │
                  │                │
                  │ Networks:      │
                  │ - internal     │
                  │   (only)       │
                  └────────────────┘
```

**Security Notes:**
- PostgreSQL is **NOT** exposed to Traefik (internal network only)
- Only Frontend and Strapi are accessible via Traefik
- All inter-service communication uses internal network

---

## Differences from Nginx Deployment

| Feature | Traefik | Nginx |
|---------|---------|-------|
| Reverse Proxy | External Traefik instance | Included nginx container |
| SSL/TLS | Handled by Traefik | Handled by nginx |
| Configuration | Docker labels | nginx conf files |
| Auto-discovery | Yes (via labels) | No (manual config) |
| Containers | 3 (no nginx) | 4 (includes nginx) |
| Best for | Multi-app server | Single app deployment |

---

## Production Checklist

- [ ] Update all domains in `.env.traefik`
- [ ] Generate new production secrets
- [ ] Configure email SMTP settings
- [ ] Set strong database password
- [ ] Verify DNS records point to server
- [ ] Verify Traefik `proxy` network exists
- [ ] Set `SEED_DATA=true` for first deployment
- [ ] Deploy with `docker-compose -f docker-compose.traefik.yml up -d --build`
- [ ] Verify all containers are healthy
- [ ] Access frontend and create admin account
- [ ] Set `SEED_DATA=false` after first deployment
- [ ] Set up database backups (cron job)
- [ ] Test full application flow

---

## Support

**Traefik Documentation:** https://doc.traefik.io/traefik/
**Strapi Documentation:** https://docs.strapi.io
**Next.js Documentation:** https://nextjs.org/docs

---

*Last updated: January 14, 2026*
