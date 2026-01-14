#!/bin/bash

# BC Flame - Traefik Environment Setup Script
# This script helps you generate and populate .env.traefik

set -e

echo "=========================================="
echo "BC Flame - Traefik Environment Setup"
echo "=========================================="
echo ""

# Check if .env.traefik already exists
if [ -f .env.traefik ]; then
    echo "⚠️  .env.traefik already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

# Copy from example
cp .env.traefik.example .env.traefik
echo "✅ Created .env.traefik from template"
echo ""

# Generate secrets
echo "🔐 Generating secrets..."
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
APP_KEY1=$(openssl rand -base64 16)
APP_KEY2=$(openssl rand -base64 16)
APP_KEY3=$(openssl rand -base64 16)
APP_KEY4=$(openssl rand -base64 16)
APP_KEYS="$APP_KEY1,$APP_KEY2,$APP_KEY3,$APP_KEY4"

echo "✅ Secrets generated"
echo ""

# Get user input for configuration
echo "📝 Configuration Questions"
echo "=========================================="
echo ""

# Database password
read -sp "Database password (strong password): " DB_PASSWORD
echo ""
echo ""

# Frontend domain
read -p "Frontend domain (default: bcflame.hows-tine.com): " FRONTEND_DOMAIN
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-bcflame.hows-tine.com}

# API domain
read -p "API domain (default: api-bcflame.hows-tine.com): " API_DOMAIN
API_DOMAIN=${API_DOMAIN:-api-bcflame.hows-tine.com}

# Email configuration
echo ""
echo "Email Configuration (SMTP)"
read -p "SMTP User (email address): " SMTP_USER
read -sp "SMTP Password (app password): " SMTP_PASS
echo ""
read -p "Email From Address (default: noreply@hows-tine.com): " EMAIL_FROM_ADDRESS
EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS:-noreply@hows-tine.com}
read -p "Admin Email Recipients (default: admin@hows-tine.com): " EMAIL_ADMIN_RECIPIENTS
EMAIL_ADMIN_RECIPIENTS=${EMAIL_ADMIN_RECIPIENTS:-admin@hows-tine.com}

# Database seeding
echo ""
read -p "Seed database on first deployment? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SEED_DATA="true"
else
    SEED_DATA="false"
fi

# Generate CORS origins
CORS_ORIGINS="https://${FRONTEND_DOMAIN},https://www.${FRONTEND_DOMAIN},https://${API_DOMAIN}"
NEXT_PUBLIC_STRAPI_URL="https://${API_DOMAIN}"
NEXT_PUBLIC_SITE_URL="https://${FRONTEND_DOMAIN}"

echo ""
echo "🔧 Updating .env.traefik..."

# Update the .env.traefik file with sed
sed -i.bak \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" \
    -e "s|^ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}|" \
    -e "s|^APP_KEYS=.*|APP_KEYS=${APP_KEYS}|" \
    -e "s|^API_TOKEN_SALT=.*|API_TOKEN_SALT=${API_TOKEN_SALT}|" \
    -e "s|^TRANSFER_TOKEN_SALT=.*|TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}|" \
    -e "s|^FRONTEND_DOMAIN=.*|FRONTEND_DOMAIN=${FRONTEND_DOMAIN}|" \
    -e "s|^API_DOMAIN=.*|API_DOMAIN=${API_DOMAIN}|" \
    -e "s|^CORS_ORIGINS=.*|CORS_ORIGINS=${CORS_ORIGINS}|" \
    -e "s|^NEXT_PUBLIC_STRAPI_URL=.*|NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL}|" \
    -e "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}|" \
    -e "s|^SMTP_USER=.*|SMTP_USER=${SMTP_USER}|" \
    -e "s|^SMTP_PASS=.*|SMTP_PASS=${SMTP_PASS}|" \
    -e "s|^EMAIL_FROM_ADDRESS=.*|EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}|" \
    -e "s|^EMAIL_ADMIN_RECIPIENTS=.*|EMAIL_ADMIN_RECIPIENTS=${EMAIL_ADMIN_RECIPIENTS}|" \
    -e "s|^SEED_DATA=.*|SEED_DATA=${SEED_DATA}|" \
    .env.traefik

# Remove backup file
rm -f .env.traefik.bak

echo "✅ .env.traefik configured successfully!"
echo ""
echo "=========================================="
echo "📋 Configuration Summary"
echo "=========================================="
echo "Frontend URL: https://${FRONTEND_DOMAIN}"
echo "API URL: https://${API_DOMAIN}"
echo "Database User: bcflame"
echo "SMTP User: ${SMTP_USER}"
echo "Seed Data: ${SEED_DATA}"
echo ""
echo "✅ You can now deploy with:"
echo "   docker-compose -f docker-compose.traefik.yml up -d --build"
echo ""
echo "⚠️  Remember to configure DNS records:"
echo "   A record: ${FRONTEND_DOMAIN} → your-server-ip"
echo "   A record: ${API_DOMAIN} → your-server-ip"
echo ""
