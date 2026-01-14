# BC Flame Production Deployment Guide

## VPS Deployment with Docker Compose

This guide covers deploying BC Flame to a VPS (DigitalOcean, Linode, Vultr, etc.) using Docker Compose.

---

## Prerequisites

- VPS with Ubuntu 22.04 LTS (minimum 2GB RAM, 2 vCPUs)
- Domain name with DNS configured
- SSH access to your VPS

---

## Part 1: VPS Setup

### 1. Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create deployment user
adduser bcflame
usermod -aG sudo bcflame

# Switch to deployment user
su - bcflame
```

### 2. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
su - bcflame
```

### 3. Install and Configure Firewall

```bash
# Install ufw
sudo apt install ufw -y

# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 2: SSL Certificate Setup

### Option A: Let's Encrypt (Recommended - Free)

```bash
# Install Certbot
sudo apt install certbot -y

# Stop any services using port 80
sudo systemctl stop nginx 2>/dev/null || true

# Generate certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option B: Self-Signed Certificate (Testing Only)

```bash
# Create SSL directory
mkdir -p ~/bcflame/nginx/ssl

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ~/bcflame/nginx/ssl/privkey.pem \
  -out ~/bcflame/nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

---

## Part 3: Application Deployment

### 1. Clone Repository

```bash
# Install git if needed
sudo apt install git -y

# Clone your repository
cd ~
git clone https://github.com/yourusername/bcflame.git
cd bcflame
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "APP_KEYS=$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"

# Edit .env.production with generated values and your domain
nano .env.production
```

**Update these values in .env.production:**
- `DB_PASSWORD` - Strong database password
- `JWT_SECRET` - Copy from generated value above
- `ADMIN_JWT_SECRET` - Copy from generated value above
- `APP_KEYS` - Copy from generated value above
- `API_TOKEN_SALT` - Copy from generated value above
- `TRANSFER_TOKEN_SALT` - Copy from generated value above
- `CORS_ORIGINS` - Your actual domain (https://yourdomain.com)
- `NEXT_PUBLIC_STRAPI_URL` - Your API domain (https://api.yourdomain.com)
- `NEXT_PUBLIC_SITE_URL` - Your frontend domain (https://yourdomain.com)
- Email SMTP settings
- `SEED_DATA=true` (for first deployment only)

### 3. Configure Nginx

```bash
# Update nginx configuration with your domain
nano nginx/conf.d/default.conf

# Replace all instances of 'yourdomain.com' with your actual domain
```

### 4. Copy SSL Certificates

**For Let's Encrypt:**
```bash
# Copy Let's Encrypt certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl
```

**For Self-Signed:**
```bash
# Certificates already in nginx/ssl/ from earlier step
```

### 5. Deploy Application

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Wait for all services to be healthy (2-3 minutes)
docker-compose -f docker-compose.prod.yml ps
```

---

## Part 4: DNS Configuration

Configure your domain's DNS records:

```
Type    Name    Value               TTL
A       @       your-server-ip      3600
A       www     your-server-ip      3600
A       api     your-server-ip      3600
```

Wait 5-10 minutes for DNS propagation.

---

## Part 5: Verification

### 1. Check Service Health

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# bcflame_postgres_prod   Up (healthy)
# bcflame_strapi_prod     Up (healthy)
# bcflame_frontend_prod   Up (healthy)
# bcflame_nginx           Up (healthy)
```

### 2. Test Endpoints

```bash
# Test nginx
curl http://localhost/health

# Test Strapi health
curl http://localhost:1337/_health

# Test frontend
curl http://localhost:3000
```

### 3. Access Application

1. **Frontend:** https://yourdomain.com
2. **Strapi Admin:** https://api.yourdomain.com/admin
3. **Create Strapi Admin Account** on first visit

---

## Part 6: Post-Deployment

### 1. Disable Database Seeding

After first successful deployment:

```bash
# Edit .env.production
nano .env.production

# Change:
SEED_DATA=false

# Restart Strapi
docker-compose -f docker-compose.prod.yml restart strapi
```

### 2. Set Up SSL Auto-Renewal (Let's Encrypt only)

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet --post-hook "docker-compose -f /home/bcflame/bcflame/docker-compose.prod.yml restart nginx"
```

### 3. Set Up Automatic Backups

```bash
# Create backup script
nano ~/backup-database.sh
```

**backup-database.sh:**
```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker exec bcflame_postgres_prod pg_dump -U bcflame bcflame_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x ~/backup-database.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add:
0 2 * * * /home/bcflame/backup-database.sh
```

---

## Common Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f strapi
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart strapi
```

### Update Application
```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build strapi
```

### Stop/Start Services
```bash
# Stop all
docker-compose -f docker-compose.prod.yml down

# Start all
docker-compose -f docker-compose.prod.yml up -d

# Stop but keep data
docker-compose -f docker-compose.prod.yml stop

# Start after stop
docker-compose -f docker-compose.prod.yml start
```

### Database Management
```bash
# Database backup
docker exec bcflame_postgres_prod pg_dump -U bcflame bcflame_db > backup.sql

# Database restore
cat backup.sql | docker exec -i bcflame_postgres_prod psql -U bcflame bcflame_db

# Access database shell
docker exec -it bcflame_postgres_prod psql -U bcflame bcflame_db
```

---

## Monitoring

### Check Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Health Checks
```bash
# Check all health statuses
docker-compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Containers Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs strapi
```

### SSL Certificate Issues
```bash
# Verify certificates exist
ls -la nginx/ssl/

# Check nginx config syntax
docker exec bcflame_nginx nginx -t

# Regenerate Let's Encrypt
sudo certbot renew --force-renewal
```

### Database Connection Issues
```bash
# Check postgres is healthy
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify credentials in .env.production
```

### Port Already in Use
```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or nginx, etc.
```

---

## Security Best Practices

1. **Change default passwords** - Never use default credentials
2. **Keep system updated** - `sudo apt update && sudo apt upgrade` weekly
3. **Monitor logs regularly** - Check for suspicious activity
4. **Limit SSH access** - Use SSH keys, disable password auth
5. **Use firewall** - Only allow necessary ports
6. **Regular backups** - Automate database backups
7. **SSL certificates** - Keep certificates up to date

---

## Cost Estimate

**VPS (DigitalOcean/Linode):**
- 2GB RAM, 2 vCPUs: ~$12/month
- 4GB RAM, 2 vCPUs: ~$24/month (recommended for production)

**Domain:**
- ~$10-15/year

**SSL Certificate:**
- Let's Encrypt: Free

**Total:** ~$12-24/month + domain

---

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this guide
3. Check Strapi documentation: https://docs.strapi.io
4. Check Next.js documentation: https://nextjs.org/docs

---

*Last updated: January 14, 2026*
