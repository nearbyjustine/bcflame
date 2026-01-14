# Nginx Configuration

This directory contains nginx reverse proxy configuration for production deployment.

## Directory Structure

```
nginx/
├── nginx.conf           # Main nginx configuration
├── conf.d/
│   └── default.conf    # Server blocks (virtual hosts)
└── ssl/
    ├── fullchain.pem   # SSL certificate (not in git)
    └── privkey.pem     # SSL private key (not in git)
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install certbot -y

# Generate certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/
```

### Option 2: Self-Signed (Testing)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## Configuration

### Update Domain Names

Before deployment, update `conf.d/default.conf`:

1. Replace all `yourdomain.com` with your actual domain
2. Replace `api.yourdomain.com` with your API subdomain

### Test Configuration

```bash
# Test nginx config inside container
docker exec bcflame_nginx nginx -t

# Reload nginx after config changes
docker exec bcflame_nginx nginx -s reload
```

## URLs

After deployment:

- **Frontend:** https://yourdomain.com
- **API/Admin:** https://api.yourdomain.com
- **API Admin Panel:** https://api.yourdomain.com/admin

## Features

- HTTP to HTTPS redirect
- SSL/TLS termination
- Reverse proxy to Next.js (port 3000)
- Reverse proxy to Strapi (port 1337)
- Security headers
- Gzip compression
- 100MB file upload limit

## Security Headers

- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-XSS-Protection` - XSS protection

## Monitoring

Health check endpoint: `http://your-server/health`

```bash
curl http://your-server/health
# Returns: healthy
```
