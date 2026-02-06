# Phase 2.1: Server Setup Guide

This guide walks you through setting up your Digital Ocean server for CI/CD deployment.

## Prerequisites

- Digital Ocean droplet with Docker and Docker Compose installed
- SSH access to the server
- GitHub account with repository access
- Project deployed and running on the server

## Step 1: Connect to Your Server

```bash
ssh user@your-server-ip
```

Replace `user` with your SSH username and `your-server-ip` with your server's IP address.

## Step 2: Navigate to Project Directory

```bash
cd /opt/bcflame  # or wherever your project is located
pwd  # Verify you're in the right directory
```

## Step 3: Create Required Directories

```bash
# Create logs directory
sudo mkdir -p /var/log/bcflame
sudo chown $USER:$USER /var/log/bcflame

# Create deployment lock directory
mkdir -p /tmp/bcflame

# Verify directories were created
ls -la /var/log/bcflame
ls -la /tmp/bcflame
```

## Step 4: Set Up GHCR Authentication

### 4.1 Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Token name: `bcflame-ghcr-deploy`
3. Expiration: Custom (1 year recommended)
4. Select scopes:
   - ✅ `read:packages` (required)
   - ✅ `write:packages` (required)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### 4.2 Create Token File on Server

```bash
# Create token file
nano ~/.ghcr_token

# Paste this format (replace with your actual values):
YOUR_GITHUB_USERNAME:ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Example:
# justinecastaneda:ghp_1234567890abcdefghijklmnopqrstuvwxyz

# Save and exit: Ctrl+X, Y, Enter
```

### 4.3 Secure and Test Token

```bash
# Secure the file (read/write for owner only)
chmod 600 ~/.ghcr_token

# Test GHCR login
cat ~/.ghcr_token | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# You should see: "Login Succeeded"
```

## Step 5: Update Environment Variables

```bash
# Edit .env file
nano .env

# Add these new variables at the bottom:
```

Add the following to your `.env`:

```bash
# CI/CD Configuration
GITHUB_USERNAME=YOUR_GITHUB_USERNAME
IMAGE_TAG=latest
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

Save and exit: `Ctrl+X`, `Y`, `Enter`

## Step 6: Update docker-compose.prod.yml

The compose file has already been updated in your local repository. Pull the latest changes:

```bash
# Pull latest changes from repository
git pull origin master

# Verify the changes
grep "image: ghcr.io" docker-compose.prod.yml

# You should see lines like:
# image: ghcr.io/${GITHUB_USERNAME:-YOUR_GITHUB_USERNAME}/bcflame-backend:${IMAGE_TAG:-latest}
# image: ghcr.io/${GITHUB_USERNAME:-YOUR_GITHUB_USERNAME}/bcflame-frontend:${IMAGE_TAG:-latest}
```

## Step 7: Update GitHub Username in Scripts

```bash
# Update pull-images.sh with your GitHub username
sed -i "s/YOUR_GITHUB_USERNAME/YOUR_ACTUAL_USERNAME/g" scripts/pull-images.sh

# Verify the change
grep "GITHUB_USERNAME=" scripts/pull-images.sh

# Should show: GITHUB_USERNAME="${GITHUB_USERNAME:-YOUR_ACTUAL_USERNAME}"
```

Replace `YOUR_ACTUAL_USERNAME` with your GitHub username (e.g., `justinecastaneda`).

## Step 8: Create Initial Deployment Marker

```bash
# Create deployment marker with current commit
git rev-parse HEAD > .last_deploy

# Create deployment metadata file
cat > .last_deploy_meta <<EOF
{
  "sha": "$(git rev-parse HEAD)",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$(git rev-parse --abbrev-ref HEAD)",
  "deployer": "manual"
}
EOF

# Verify files were created
ls -la .last_deploy*
cat .last_deploy_meta
```

## Step 9: Verify Environment Variables

```bash
# Check that all required variables are set
# (This will not display values, only verify they exist)
bash -c 'source .env && \
  : ${DB_PASSWORD:?} && \
  : ${JWT_SECRET:?} && \
  : ${ADMIN_JWT_SECRET:?} && \
  : ${APP_KEYS:?} && \
  : ${RESEND_API_KEY:?} && \
  : ${GITHUB_USERNAME:?} && \
  echo "✅ All required environment variables are set"'

# If any are missing, edit .env and add them:
# nano .env
```

## Step 10: Verify Docker Permissions

```bash
# Ensure your user has Docker permissions
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Test Docker without sudo
docker ps

# You should see your running containers
```

## Step 11: Test Verification Script

```bash
# Make sure all services are healthy first
docker-compose -f docker-compose.prod.yml ps

# Run verification script
./scripts/verify-deployment.sh

# You should see:
# ✅ All checks passed!
```

## Step 12: Test Image Pull Script (Optional)

```bash
# This will fail until images are pushed from GitHub Actions
# That's expected at this stage
./scripts/pull-images.sh both latest || echo "Expected failure (no images yet)"

# You should see an authentication success message, but pull will fail:
# ✅ Authentication successful
# ❌ Failed to pull image (expected until first CI/CD run)
```

## Verification Checklist

Before proceeding to Phase 3, verify:

- ✅ `/var/log/bcflame` directory exists and is writable
- ✅ `/tmp/bcflame` directory exists
- ✅ `~/.ghcr_token` file exists with correct permissions (600)
- ✅ Docker login to GHCR succeeds
- ✅ `.env` file has `GITHUB_USERNAME` and `IMAGE_TAG` variables
- ✅ `docker-compose.prod.yml` has GHCR image references
- ✅ `.last_deploy` and `.last_deploy_meta` files exist
- ✅ All deployment scripts exist in `scripts/` and are executable
- ✅ `verify-deployment.sh` passes all checks
- ✅ User has Docker permissions (can run `docker ps` without sudo)

## Troubleshooting

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

### GHCR Authentication Failed

```bash
# Verify token file format (should be USERNAME:TOKEN)
cat ~/.ghcr_token

# Verify token has correct permissions
ls -la ~/.ghcr_token  # Should show: -rw-------

# Test login manually
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN
```

### Environment Variable Missing

```bash
# Check which variables are set
grep -E "^[A-Z_]+=" .env | cut -d= -f1

# Edit .env to add missing variables
nano .env
```

### Scripts Not Executable

```bash
# Make all scripts executable
chmod +x scripts/*.sh

# Verify
ls -la scripts/
```

## Next Steps

Once Phase 2.1 is complete and all checks pass, proceed to **Phase 3: Create Server Scripts** (already done) and then **Phase 4: Create GitHub Workflows**.

The server is now ready for automated deployments!

## Important Notes

- **Never commit `.ghcr_token` to git** - it contains sensitive credentials
- **Never commit production `.env` files** - they contain secrets
- Keep the GitHub token in a secure location (password manager)
- Rotate the token every 6-12 months for security
- The `IMAGE_TAG` environment variable will be overridden by the deployment script with the actual commit SHA

## Summary

Your server is now configured with:
- ✅ GHCR authentication for pulling images
- ✅ Deployment scripts (`deploy.sh`, `pull-images.sh`, `verify-deployment.sh`, `rollback.sh`)
- ✅ Log directories for deployment tracking
- ✅ Deployment lock mechanism to prevent concurrent deployments
- ✅ Deployment markers for tracking releases
- ✅ Updated docker-compose.prod.yml for GHCR images

**Phase 2.1 Complete!** 🎉
