# BC Flame - Quick Start Guide

## For Production Deployment (VPS with Docker Compose)

### Prerequisites
- Ubuntu VPS (2GB+ RAM)
- Domain name
- Git, Docker, Docker Compose installed

### 1. Clone and Configure (5 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/bcflame.git
cd bcflame

# Create production environment file
cp .env.production.example .env.production

# Generate secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # ADMIN_JWT_SECRET
openssl rand -base64 32  # API_TOKEN_SALT
openssl rand -base64 32  # TRANSFER_TOKEN_SALT
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"  # APP_KEYS

# Edit .env.production with generated values and your domain
nano .env.production
```

### 2. SSL Certificates (5 minutes)

```bash
# Install certbot
sudo apt install certbot -y

# Generate Let's Encrypt certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

### 3. Update Nginx Config (2 minutes)

```bash
# Update domain in nginx config
nano nginx/conf.d/default.conf
# Replace 'yourdomain.com' with your actual domain
```

### 4. Deploy (5 minutes)

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker-compose -f docker-compose.prod.yml logs -f

# Wait for all services to be healthy (2-3 min)
# Press Ctrl+C when done watching logs
```

### 5. Access Your Application

- **Frontend:** https://yourdomain.com
- **Admin Panel:** https://api.yourdomain.com/admin
- Create your admin account on first visit

### 6. Disable Seeding (After First Deployment)

```bash
# Edit .env.production
nano .env.production
# Change: SEED_DATA=false

# Restart
docker-compose -f docker-compose.prod.yml restart strapi
```

---

## For Local Development

```bash
# Install dependencies
npm run install:all

# Start database
npm run db:setup

# Start all services
docker-compose up -d

# Or run locally without Docker
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Strapi Admin: http://localhost:1337/admin
- Database: localhost:5432

---

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down

# Update application
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Database backup
docker exec bcflame_postgres_prod pg_dump -U bcflame bcflame_db > backup.sql
```

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

---

**Total Setup Time:** ~20 minutes
