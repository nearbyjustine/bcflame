# BC Flame - Deployment Options Comparison

Choose the deployment method that best fits your infrastructure.

---

## Quick Comparison

| Feature | Traefik | Nginx (VPS) | Railway |
|---------|---------|-------------|---------|
| **Setup Time** | 10 min | 20 min | 15 min |
| **Cost** | Shared VPS | $12-24/month | $10-25/month |
| **SSL/TLS** | Traefik handles | nginx handles | Automatic |
| **Best For** | Multi-app server | Single app | Quick deploy |
| **Configuration** | Docker labels | nginx conf | Railway dashboard |
| **File** | `docker-compose.traefik.yml` | `docker-compose.prod.yml` | `railway.json` |
| **Containers** | 3 (no proxy) | 4 (includes nginx) | 3 (managed) |
| **Database** | Included | Included | Managed PostgreSQL |
| **Backup** | Manual | Manual | Automatic |
| **Scaling** | Manual | Manual | Automatic |

---

## Option 1: Traefik (Recommended for Multi-App Servers)

**Use when:**
- You already have Traefik running on your server
- You're hosting multiple applications on the same server
- You want centralized reverse proxy management

**Pros:**
- ✅ Share Traefik across multiple apps
- ✅ Automatic service discovery via labels
- ✅ Cost-effective (shared infrastructure)
- ✅ Easy to add more apps later

**Cons:**
- ❌ Requires existing Traefik setup
- ❌ More complex initial Traefik configuration

**Deploy:**
```bash
git checkout feat/traefik-deployment
cp .env.traefik.example .env.traefik
# Configure .env.traefik
docker-compose -f docker-compose.traefik.yml up -d --build
```

**Guide:** See [DEPLOYMENT_TRAEFIK.md](./DEPLOYMENT_TRAEFIK.md)

---

## Option 2: Nginx (VPS) (Recommended for Dedicated Server)

**Use when:**
- You have a dedicated VPS for this app only
- You want full control over the entire stack
- You don't have Traefik already running

**Pros:**
- ✅ Complete control over nginx configuration
- ✅ All services in one docker-compose file
- ✅ No external dependencies
- ✅ Great for learning nginx

**Cons:**
- ❌ Nginx container per application (if hosting multiple apps)
- ❌ Manual SSL certificate management

**Deploy:**
```bash
git checkout master
cp .env.production.example .env.production
# Configure .env.production
# Set up SSL certificates
docker-compose -f docker-compose.prod.yml up -d --build
```

**Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Option 3: Railway (Recommended for Quick Start)

**Use when:**
- You want the fastest deployment
- You don't have a VPS
- You prefer managed infrastructure

**Pros:**
- ✅ Fastest setup (no VPS needed)
- ✅ Automatic SSL/HTTPS
- ✅ Managed PostgreSQL with backups
- ✅ Auto-scaling
- ✅ Built-in monitoring

**Cons:**
- ❌ Can't use docker-compose (services deployed separately)
- ❌ Less control over infrastructure
- ❌ Potentially higher cost at scale

**Deploy:**
1. Push to GitHub
2. Create Railway project
3. Add PostgreSQL plugin
4. Add services (backend + frontend)
5. Configure environment variables

**Files:** `backend/railway.json`, `frontend/railway.json`

---

## Decision Tree

```
Do you already have a VPS?
│
├─ No
│  └─ Use Railway (easiest, managed)
│
└─ Yes
   │
   ├─ Do you have Traefik running?
   │  │
   │  ├─ Yes
   │  │  └─ Use Traefik deployment (most efficient)
   │  │
   │  └─ No
   │     │
   │     ├─ Hosting multiple apps?
   │     │  │
   │     │  ├─ Yes
   │     │  │  └─ Set up Traefik first, then use Traefik deployment
   │     │  │
   │     │  └─ No
   │     │     └─ Use Nginx deployment (simplest for single app)
   │     │
   │     └─ Just this app?
   │        └─ Use Nginx deployment
```

---

## Detailed Comparison

### Architecture

**Traefik:**
```
Traefik (external) → Frontend (3000)
                  → Strapi (1337) → PostgreSQL
```

**Nginx:**
```
Nginx → Frontend (3000)
      → Strapi (1337) → PostgreSQL
```

**Railway:**
```
Railway Platform
├── PostgreSQL (managed)
├── Strapi (container)
└── Frontend (container)
```

### Files Required

**Traefik:**
- `docker-compose.traefik.yml`
- `.env.traefik`

**Nginx:**
- `docker-compose.prod.yml`
- `.env.production`
- `nginx/nginx.conf`
- `nginx/conf.d/default.conf`
- SSL certificates

**Railway:**
- `backend/railway.json`
- `frontend/railway.json`
- Railway dashboard configuration

### Environment Variables

All three use similar environment variables:
- Database credentials
- JWT secrets (5 different secrets)
- CORS origins
- Email SMTP settings
- Domain names

---

## Migration Between Options

### From Nginx → Traefik

```bash
# Backup data
docker exec bcflame_postgres_prod pg_dump -U bcflame bcflame_db > backup.sql

# Stop Nginx deployment
docker-compose -f docker-compose.prod.yml down

# Switch branch
git checkout feat/traefik-deployment

# Copy environment
cp .env.production .env.traefik
# Update domains in .env.traefik

# Deploy with Traefik
docker-compose -f docker-compose.traefik.yml up -d --build

# Restore data if needed
cat backup.sql | docker exec -i bcflame_postgres psql -U bcflame bcflame_db
```

### From Traefik → Nginx

```bash
# Backup data
docker exec bcflame_postgres pg_dump -U bcflame bcflame_db > backup.sql

# Stop Traefik deployment
docker-compose -f docker-compose.traefik.yml down

# Switch branch
git checkout master

# Copy environment
cp .env.traefik .env.production
# Update for Nginx deployment

# Set up SSL certificates (see DEPLOYMENT.md)

# Deploy with Nginx
docker-compose -f docker-compose.prod.yml up -d --build

# Restore data if needed
cat backup.sql | docker exec -i bcflame_postgres_prod psql -U bcflame bcflame_db
```

---

## Recommendation

**For your use case (existing Traefik setup):**

✅ **Use Traefik deployment** (`feat/traefik-deployment` branch)

**Reasons:**
1. You already have Traefik running
2. Most efficient use of server resources
3. Easier to manage multiple apps
4. Consistent configuration across apps
5. No need for separate nginx container

---

## Cost Analysis (Monthly)

### Traefik
- **Shared VPS**: $0 (already running)
- **Incremental**: ~$0 (uses existing resources)
- **Total**: $0 additional

### Nginx
- **Dedicated VPS**: $12-24
- **Domain**: ~$1
- **Total**: $13-25

### Railway
- **Platform**: $10-25
- **Domain**: ~$1
- **Total**: $11-26

---

## Next Steps

1. **Choose your deployment method** from above
2. **Switch to appropriate branch:**
   - Traefik: `git checkout feat/traefik-deployment`
   - Nginx: `git checkout master`
3. **Follow the deployment guide:**
   - Traefik: [DEPLOYMENT_TRAEFIK.md](./DEPLOYMENT_TRAEFIK.md)
   - Nginx: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

*Last updated: January 14, 2026*
