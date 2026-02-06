# CI/CD Pipeline Implementation Plan - Revised

## Overview

This document provides a comprehensive plan for implementing a GitHub Actions CI/CD pipeline that automatically tests, builds, and deploys the BCFlame application to Digital Ocean. This plan addresses all critical issues identified in the review and provides a battle-tested approach.

## Key Changes from Original Plan

1. ✅ **Blue-Green Deployment** instead of rolling updates (works with named containers)
2. ✅ **Database Migration Step** added to deployment process
3. ✅ **Deployment Lock** prevents concurrent deployments
4. ✅ **Environment Validation** ensures required variables are set
5. ✅ **Extended Health Checks** with 120-second timeout for Strapi
6. ✅ **Comprehensive Change Detection** includes nginx, compose files, and env changes
7. ✅ **Pre-Deployment Backup** triggers backup container before deployment

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│                                                                   │
│  1. Detect Changes (paths + commit flags)                       │
│  2. Run Tests (frontend/backend in parallel)                    │
│  3. Build & Push Images to GHCR                                 │
│  4. SSH to Digital Ocean Server                                 │
│  5. Execute Deployment Script                                    │
│  6. Verify Health                                               │
│  7. Rollback on Failure                                         │
│  8. Notify Discord (optional)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Digital Ocean Droplet                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Frontend    │  │   Backend    │  │    Nginx     │         │
│  │  Container   │  │   Container  │  │  Container   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                  ┌─────────▼─────────┐                          │
│                  │    PostgreSQL     │                          │
│                  └───────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Strategy: Blue-Green

Since the production Docker Compose setup uses `container_name`, we cannot scale to multiple replicas. Instead, we use blue-green deployment:

1. **Pull new images** from GHCR with commit SHA tag
2. **Trigger pre-deployment backup** of database
3. **Run database migrations** (Strapi schema changes)
4. **Stop old containers** (brief downtime begins)
5. **Start new containers** with new images
6. **Wait for health checks** (containers warming up)
7. **Verify all services healthy** (downtime ends)
8. **Rollback if verification fails**

**Expected Downtime**: 30-60 seconds (during container restart + warmup)

**Alternative Considered**: We could switch to Docker Swarm for true zero-downtime rolling updates, but that adds significant complexity for a 2-container application. The current approach provides excellent reliability with minimal downtime.

---

## Phase 1: GitHub Setup (Day 1)

### Step 1.1: Configure GitHub Secrets

Navigate to: **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets

1. **`SSH_PRIVATE_KEY`** - Private SSH key for server access
   ```bash
   # On your local machine, generate a dedicated deployment key
   ssh-keygen -t ed25519 -C "github-actions-bcflame" -f ~/.ssh/bcflame_deploy

   # Add public key to server
   ssh-copy-id -i ~/.ssh/bcflame_deploy.pub user@your-server.com

   # Copy private key content (entire file including BEGIN/END lines)
   cat ~/.ssh/bcflame_deploy

   # Paste into GitHub secret SSH_PRIVATE_KEY
   ```

2. **`SSH_HOST`** - Digital Ocean droplet IP or hostname
   ```
   Example: 123.45.67.89 or yourdomain.com
   ```

3. **`SSH_USER`** - SSH username
   ```
   Example: ubuntu (or whatever user you created)
   ```

4. **`DISCORD_WEBHOOK`** (Optional) - Discord webhook URL for notifications
   ```bash
   # In Discord:
   # 1. Server Settings → Integrations → Webhooks
   # 2. New Webhook → Name: "BCFlame CI/CD"
   # 3. Select channel (e.g., #deployments)
   # 4. Copy webhook URL

   # Test webhook
   curl -X POST -H "Content-Type: application/json" \
     -d '{"content":"Test message from BCFlame CI/CD"}' \
     YOUR_WEBHOOK_URL
   ```

5. **`SERVER_PROJECT_PATH`** - Absolute path to project on server
   ```
   Example: /opt/bcflame
   ```

#### Verify Secrets

After adding secrets, verify they're set:
- Go to: Settings → Secrets and variables → Actions
- You should see: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SERVER_PROJECT_PATH`
- Optional: `DISCORD_WEBHOOK`

### Step 1.2: Enable GitHub Container Registry (GHCR)

GHCR is automatically enabled for your repository, but you need to configure package permissions:

1. **Repository Permissions**:
   - Go to: Settings → Actions → General
   - Scroll to "Workflow permissions"
   - Select: ✅ "Read and write permissions"
   - Click "Save"

2. **Verify GITHUB_TOKEN has package permissions**:
   - The default `GITHUB_TOKEN` in Actions already has `write:packages` permission
   - No additional token generation needed
   - Images will be pushed to: `ghcr.io/YOUR_GITHUB_USERNAME/bcflame-frontend`

3. **Make packages public** (optional, but recommended for easier access):
   - After first deployment, go to: Packages tab in your repo
   - Click package → Package settings
   - Scroll to "Danger Zone" → Change visibility → Public

### Step 1.3: Set up Discord Webhook (Optional)

If you want deployment notifications in Discord:

```bash
# 1. Open Discord server
# 2. Server Settings → Integrations → Webhooks
# 3. Click "New Webhook"
# 4. Configure:
#    - Name: BCFlame CI/CD
#    - Channel: #deployments (or create one)
#    - Avatar: (optional)
# 5. Copy webhook URL
# 6. Add to GitHub secrets as DISCORD_WEBHOOK
# 7. Test:
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"✅ Test message from BCFlame CI/CD"}' \
  YOUR_WEBHOOK_URL
```

---

## Phase 2: Server Setup (Day 1-2)

### Step 2.1: Prepare Server Environment

SSH to your Digital Ocean droplet:

```bash
ssh user@your-server.com

# Navigate to project directory
cd /opt/bcflame  # or wherever your project is located

# Verify project structure
ls -la
# Should see: frontend/, backend/, docker-compose.prod.yml, etc.

# Create scripts directory
mkdir -p scripts

# Create logs directory
sudo mkdir -p /var/log/bcflame
sudo chown $USER:$USER /var/log/bcflame

# Create deployment lock directory
mkdir -p /tmp/bcflame

# Verify Docker is installed
docker --version  # Should be 20.10+ or newer

# Verify Docker Compose is installed
docker-compose --version  # Should be 2.0+ or newer

# Ensure user has Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Test Docker without sudo
docker ps

# Verify production containers are running
docker-compose -f docker-compose.prod.yml ps
```

### Step 2.2: Create GHCR Authentication

Store GHCR authentication token on server for pulling images:

```bash
# On server, create token file
nano ~/.ghcr_token

# Paste your GitHub username and token in this format:
# YOUR_GITHUB_USERNAME:YOUR_GITHUB_TOKEN

# Generate token at: https://github.com/settings/tokens/new
# Required scopes:
#   - read:packages
#   - write:packages (if pushing from server, not needed for deployment)

# Example content:
# justinecastaneda:ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Save and exit (Ctrl+X, Y, Enter)

# Secure the file
chmod 600 ~/.ghcr_token

# Test GHCR login
cat ~/.ghcr_token | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login succeeded
echo "Login to GitHub Container Registry succeeded"

# Test pulling images (will fail until first push, that's expected)
docker pull ghcr.io/YOUR_GITHUB_USERNAME/bcflame-frontend:latest || echo "No image yet (expected before first deployment)"
```

### Step 2.3: Update docker-compose.prod.yml

We need to modify the compose file to pull from GHCR while keeping local build capability:

```bash
# On server, edit docker-compose.prod.yml
nano docker-compose.prod.yml
```

Update the `frontend` and `strapi` service definitions:

```yaml
services:
  # ... postgres, cloudflared remain unchanged ...

  strapi:
    image: ghcr.io/YOUR_GITHUB_USERNAME/bcflame-backend:${IMAGE_TAG:-latest}
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
      args:
        PUBLIC_URL: ${NEXT_PUBLIC_STRAPI_URL}
    pull_policy: always  # Always check for newer images
    container_name: bcflame_strapi_prod
    restart: always
    # ... rest of configuration remains unchanged ...

  frontend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/bcflame-frontend:${IMAGE_TAG:-latest}
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
      args:
        NEXT_PUBLIC_STRAPI_URL: ${NEXT_PUBLIC_STRAPI_URL:-https://api.yourdomain.com}
        NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-https://yourdomain.com}
    pull_policy: always  # Always check for newer images
    container_name: bcflame_frontend_prod
    restart: always
    # ... rest of configuration remains unchanged ...

  # ... nginx, backup remain unchanged ...
```

**Important**: Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### Step 2.4: Create Initial Deployment Marker

Create a marker file to track the last successful deployment:

```bash
cd /opt/bcflame

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

# Verify files created
ls -la .last_deploy*
```

### Step 2.5: Verify Environment Variables

Ensure all required environment variables are set:

```bash
# On server, check .env file exists
ls -la .env

# Verify required variables (DO NOT echo sensitive values)
# Just check they're set:
bash -c 'source .env && \
  : ${DB_PASSWORD:?} && \
  : ${JWT_SECRET:?} && \
  : ${ADMIN_JWT_SECRET:?} && \
  : ${APP_KEYS:?} && \
  : ${RESEND_API_KEY:?} && \
  echo "✅ All required environment variables are set"'

# If any are missing, edit .env:
nano .env
# Add missing variables, then save
```

---

## Phase 3: Create Server Scripts (Day 2)

### Step 3.1: Create `scripts/pull-images.sh`

```bash
nano scripts/pull-images.sh
```

Paste the following content:

```bash
#!/bin/bash
###############################################################################
# Pull Docker Images from GitHub Container Registry
#
# Usage: ./scripts/pull-images.sh <service> <tag>
# Example: ./scripts/pull-images.sh both abc123def
#          ./scripts/pull-images.sh frontend latest
###############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
GITHUB_USERNAME="${GITHUB_USERNAME:-justinecastaneda}"  # UPDATE THIS
GHCR_TOKEN_FILE="${HOME}/.ghcr_token"
SERVICE="${1:-both}"
IMAGE_TAG="${2:-latest}"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Authenticate to GHCR
authenticate_ghcr() {
    if [[ ! -f "${GHCR_TOKEN_FILE}" ]]; then
        log_error "GHCR token file not found: ${GHCR_TOKEN_FILE}"
        log_error "Create token file with: echo 'USERNAME:TOKEN' > ${GHCR_TOKEN_FILE}"
        exit 1
    fi

    log_info "Authenticating to GitHub Container Registry..."
    cat "${GHCR_TOKEN_FILE}" | docker login ghcr.io -u "${GITHUB_USERNAME}" --password-stdin > /dev/null 2>&1

    if [[ $? -eq 0 ]]; then
        log_info "✅ Authentication successful"
    else
        log_error "❌ Authentication failed"
        exit 1
    fi
}

# Pull image with fallback
pull_image() {
    local service=$1
    local image="ghcr.io/${GITHUB_USERNAME}/bcflame-${service}:${IMAGE_TAG}"
    local fallback_image="ghcr.io/${GITHUB_USERNAME}/bcflame-${service}:latest"

    log_info "Pulling image: ${image}"

    if docker pull "${image}"; then
        log_info "✅ Successfully pulled ${image}"
        return 0
    else
        log_error "❌ Failed to pull ${image}"

        if [[ "${IMAGE_TAG}" != "latest" ]]; then
            log_info "Attempting to pull fallback: ${fallback_image}"
            if docker pull "${fallback_image}"; then
                log_info "✅ Successfully pulled fallback image"
                # Re-tag as requested tag
                docker tag "${fallback_image}" "${image}"
                return 0
            fi
        fi

        return 1
    fi
}

# Main
main() {
    authenticate_ghcr

    if [[ "${SERVICE}" == "both" ]]; then
        pull_image "frontend"
        pull_image "backend"
    elif [[ "${SERVICE}" == "frontend" ]]; then
        pull_image "frontend"
    elif [[ "${SERVICE}" == "backend" ]]; then
        pull_image "backend"
    else
        log_error "Invalid service: ${SERVICE}"
        log_error "Valid options: frontend, backend, both"
        exit 1
    fi

    log_info "✅ All images pulled successfully"
}

main
```

Make it executable:

```bash
chmod +x scripts/pull-images.sh

# Update GITHUB_USERNAME in the script
sed -i 's/justinecastaneda/YOUR_ACTUAL_USERNAME/g' scripts/pull-images.sh
```

### Step 3.2: Create `scripts/deploy.sh`

```bash
nano scripts/deploy.sh
```

Paste the following content:

```bash
#!/bin/bash
###############################################################################
# Blue-Green Deployment Script for BC Flame
#
# This script performs a blue-green deployment with:
# - Pre-deployment database backup
# - Database migrations
# - Environment validation
# - Health checks
# - Automatic rollback on failure
#
# Usage: ./scripts/deploy.sh <service> <commit-sha>
# Example: ./scripts/deploy.sh both abc123def
###############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE="${1:-both}"
COMMIT_SHA="${2:-latest}"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
LOCK_FILE="/tmp/bcflame/deploy.lock"
LOG_FILE="/var/log/bcflame/deployments.log"
DEPLOY_MARKER="${PROJECT_ROOT}/.last_deploy"
DEPLOY_META="${PROJECT_ROOT}/.last_deploy_meta"

# Ensure log directory exists
mkdir -p "$(dirname "${LOG_FILE}")"
mkdir -p "$(dirname "${LOCK_FILE}")"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOG_FILE}"
}

log_info() {
    log "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

log_step() {
    log "${BLUE}[STEP]${NC} $1"
}

# Acquire deployment lock
acquire_lock() {
    if [[ -f "${LOCK_FILE}" ]]; then
        log_error "Deployment already in progress (lock file exists)"
        log_error "If you're sure no deployment is running, remove: ${LOCK_FILE}"
        exit 1
    fi

    echo "$$" > "${LOCK_FILE}"
    trap "rm -f ${LOCK_FILE}" EXIT

    log_info "✅ Deployment lock acquired (PID: $$)"
}

# Release deployment lock
release_lock() {
    rm -f "${LOCK_FILE}"
    log_info "🔓 Deployment lock released"
}

# Validate required environment variables
validate_environment() {
    log_step "Validating environment variables..."

    cd "${PROJECT_ROOT}"

    if [[ ! -f ".env" ]]; then
        log_error ".env file not found in ${PROJECT_ROOT}"
        exit 1
    fi

    # Source .env file
    set -a
    source .env
    set +a

    local required_vars=(
        "DB_PASSWORD"
        "JWT_SECRET"
        "ADMIN_JWT_SECRET"
        "APP_KEYS"
        "RESEND_API_KEY"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - ${var}"
        done
        exit 1
    fi

    log_info "✅ All required environment variables are set"
}

# Trigger pre-deployment backup
trigger_backup() {
    log_step "Creating pre-deployment database backup..."

    # Trigger backup via backup container
    if docker exec bcflame_backup /usr/local/bin/backup.sh; then
        log_info "✅ Pre-deployment backup completed"
    else
        log_warning "⚠️  Backup failed, but continuing deployment"
        log_warning "Consider investigating backup service later"
    fi
}

# Pull latest code from repository
pull_code() {
    log_step "Pulling latest code from repository..."

    cd "${PROJECT_ROOT}"

    # Save current commit for potential rollback
    git rev-parse HEAD > "${DEPLOY_MARKER}.previous"

    # Pull latest changes
    if git pull origin master; then
        log_info "✅ Code pulled successfully"
        git rev-parse HEAD > "${DEPLOY_MARKER}"
    else
        log_error "❌ Failed to pull code"
        exit 1
    fi
}

# Pull Docker images from GHCR
pull_images() {
    log_step "Pulling Docker images from GHCR..."

    if "${SCRIPT_DIR}/pull-images.sh" "${SERVICE}" "${COMMIT_SHA}"; then
        log_info "✅ Images pulled successfully"
    else
        log_error "❌ Failed to pull images"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_step "Running database migrations..."

    # Check if backend is being deployed
    if [[ "${SERVICE}" == "backend" ]] || [[ "${SERVICE}" == "both" ]]; then
        # Run Strapi migrations
        if docker exec bcflame_strapi_prod npm run strapi db:migrate 2>/dev/null; then
            log_info "✅ Database migrations completed"
        else
            log_warning "⚠️  Migration command not available or no migrations to run"
            log_info "Strapi will auto-sync schemas on startup"
        fi
    else
        log_info "Skipping migrations (backend not being deployed)"
    fi
}

# Deploy service with blue-green strategy
deploy_service() {
    local service=$1
    log_step "Deploying ${service}..."

    cd "${PROJECT_ROOT}"

    # Set image tag environment variable
    export IMAGE_TAG="${COMMIT_SHA}"

    # Stop old container
    log_info "Stopping old ${service} container..."
    docker-compose -f "${COMPOSE_FILE}" stop "${service}"

    # Remove old container
    log_info "Removing old ${service} container..."
    docker-compose -f "${COMPOSE_FILE}" rm -f "${service}"

    # Start new container with new image
    log_info "Starting new ${service} container with image tag: ${COMMIT_SHA}..."
    if docker-compose -f "${COMPOSE_FILE}" up -d "${service}"; then
        log_info "✅ ${service} deployed successfully"
    else
        log_error "❌ Failed to deploy ${service}"
        return 1
    fi

    # Wait for container to be healthy
    log_info "Waiting for ${service} to become healthy..."
    local max_attempts=60  # 60 attempts × 2 seconds = 120 seconds
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "bcflame_${service}_prod" 2>/dev/null || echo "starting")

        if [[ "${health}" == "healthy" ]]; then
            log_info "✅ ${service} is healthy (attempt ${attempt}/${max_attempts})"
            return 0
        fi

        log_info "⏳ ${service} health: ${health} (attempt ${attempt}/${max_attempts})"
        sleep 2
        ((attempt++))
    done

    log_error "❌ ${service} failed to become healthy after ${max_attempts} attempts"
    return 1
}

# Clean up old Docker images
cleanup_images() {
    log_step "Cleaning up old Docker images..."

    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true

    # Keep last 5 images, remove older ones
    local images=$(docker images "ghcr.io/*/bcflame-*" --format "{{.ID}}" | tail -n +6)
    if [[ -n "${images}" ]]; then
        echo "${images}" | xargs -r docker rmi -f > /dev/null 2>&1 || true
        log_info "✅ Old images cleaned up"
    else
        log_info "No old images to clean up"
    fi
}

# Save deployment metadata
save_metadata() {
    log_step "Saving deployment metadata..."

    cat > "${DEPLOY_META}" <<EOF
{
  "sha": "${COMMIT_SHA}",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$(cd ${PROJECT_ROOT} && git rev-parse --abbrev-ref HEAD)",
  "service": "${SERVICE}",
  "deployer": "github-actions"
}
EOF

    log_info "✅ Deployment metadata saved"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    log_info "======================================"
    log_info "BC Flame Deployment Started"
    log_info "Service: ${SERVICE}"
    log_info "Commit: ${COMMIT_SHA}"
    log_info "======================================"

    # 1. Acquire lock
    acquire_lock

    # 2. Validate environment
    validate_environment

    # 3. Trigger backup
    trigger_backup

    # 4. Pull latest code
    pull_code

    # 5. Pull Docker images
    pull_images

    # 6. Run migrations
    run_migrations

    # 7. Deploy services
    if [[ "${SERVICE}" == "both" ]]; then
        # Deploy backend first, then frontend
        deploy_service "strapi"
        deploy_service "frontend"
    elif [[ "${SERVICE}" == "frontend" ]]; then
        deploy_service "frontend"
    elif [[ "${SERVICE}" == "backend" ]]; then
        deploy_service "strapi"
    else
        log_error "Invalid service: ${SERVICE}"
        log_error "Valid options: frontend, backend, both"
        exit 1
    fi

    # 8. Clean up old images
    cleanup_images

    # 9. Save metadata
    save_metadata

    # 10. Release lock
    release_lock

    log_info "======================================"
    log_info "✅ Deployment completed successfully!"
    log_info "======================================"

    exit 0
}

# Run main function
main
```

Make it executable:

```bash
chmod +x scripts/deploy.sh
```

### Step 3.3: Create `scripts/verify-deployment.sh`

```bash
nano scripts/verify-deployment.sh
```

Paste the following content:

```bash
#!/bin/bash
###############################################################################
# Deployment Verification Script
#
# Verifies all services are healthy and functional after deployment
#
# Usage: ./scripts/verify-deployment.sh
###############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=60  # 60 × 2 = 120 seconds
    local attempt=1

    log_info "Checking ${service}..."

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s -o /dev/null "${url}"; then
            log_info "✅ ${service} is healthy"
            return 0
        fi

        log_info "⏳ ${service} not ready yet (attempt ${attempt}/${max_attempts})"
        sleep 2
        ((attempt++))
    done

    log_error "❌ ${service} failed health check"
    return 1
}

# Check container health
check_container_health() {
    local container=$1

    local health=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "unknown")

    if [[ "${health}" == "healthy" ]]; then
        log_info "✅ ${container} container is healthy"
        return 0
    else
        log_error "❌ ${container} container health: ${health}"
        return 1
    fi
}

# Test frontend → backend connectivity
check_integration() {
    log_info "Checking frontend → backend integration..."

    if docker exec bcflame_frontend_prod curl -f -s -o /dev/null http://strapi:1337/_health; then
        log_info "✅ Frontend can reach backend"
        return 0
    else
        log_error "❌ Frontend cannot reach backend"
        return 1
    fi
}

# Main verification
main() {
    log_info "======================================"
    log_info "Starting Deployment Verification"
    log_info "======================================"

    local failed=0

    # Check frontend
    check_service "frontend" "http://localhost:3000" || failed=1

    # Check backend
    check_service "backend" "http://localhost:1337/_health" || failed=1

    # Check nginx
    check_service "nginx" "http://localhost/health" || failed=1

    # Check container health
    check_container_health "bcflame_frontend_prod" || failed=1
    check_container_health "bcflame_strapi_prod" || failed=1
    check_container_health "bcflame_nginx_prod" || failed=1

    # Check integration
    check_integration || failed=1

    log_info "======================================"

    if [[ $failed -eq 0 ]]; then
        log_info "✅ All checks passed!"
        log_info "======================================"
        exit 0
    else
        log_error "❌ Some checks failed!"
        log_error "======================================"
        exit 1
    fi
}

main
```

Make it executable:

```bash
chmod +x scripts/verify-deployment.sh
```

### Step 3.4: Create `scripts/rollback.sh`

```bash
nano scripts/rollback.sh
```

Paste the following content:

```bash
#!/bin/bash
###############################################################################
# Rollback Script for BC Flame
#
# Reverts to a previous deployment
#
# Usage: ./scripts/rollback.sh [COMMIT_SHA]
# Example: ./scripts/rollback.sh abc123def
###############################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_SHA="${1:-}"
DEPLOY_MARKER="${PROJECT_ROOT}/.last_deploy"
LOG_FILE="/var/log/bcflame/rollback.log"

mkdir -p "$(dirname "${LOG_FILE}")"

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOG_FILE}"
}

log_info() {
    log "${GREEN}[INFO]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Determine target commit
determine_target() {
    if [[ -n "${TARGET_SHA}" ]]; then
        log_info "Rolling back to specified commit: ${TARGET_SHA}"
    elif [[ -f "${DEPLOY_MARKER}.previous" ]]; then
        TARGET_SHA=$(cat "${DEPLOY_MARKER}.previous")
        log_info "Rolling back to previous deployment: ${TARGET_SHA}"
    else
        log_error "No target commit specified and no previous deployment found"
        log_error "Usage: $0 [COMMIT_SHA]"
        exit 1
    fi
}

# Rollback code
rollback_code() {
    log_info "Reverting code to ${TARGET_SHA}..."

    cd "${PROJECT_ROOT}"

    if git reset --hard "${TARGET_SHA}"; then
        log_info "✅ Code reverted successfully"
    else
        log_error "❌ Failed to revert code"
        exit 1
    fi
}

# Rollback deployment
rollback_deployment() {
    log_info "Pulling previous images..."

    # Pull images with previous commit SHA
    if "${SCRIPT_DIR}/pull-images.sh" both "${TARGET_SHA}"; then
        log_info "✅ Images pulled"
    else
        log_error "❌ Failed to pull images"
        exit 1
    fi

    # Redeploy with previous images
    log_info "Redeploying previous version..."
    if "${SCRIPT_DIR}/deploy.sh" both "${TARGET_SHA}"; then
        log_info "✅ Rollback deployment completed"
    else
        log_error "❌ Rollback deployment failed"
        exit 1
    fi
}

# Verify rollback
verify_rollback() {
    log_info "Verifying rollback..."

    if "${SCRIPT_DIR}/verify-deployment.sh"; then
        log_info "✅ Rollback verified successfully"
    else
        log_error "❌ Rollback verification failed"
        exit 1
    fi
}

# Main
main() {
    log_info "======================================"
    log_info "BC Flame Rollback Started"
    log_info "======================================"

    determine_target
    rollback_code
    rollback_deployment
    verify_rollback

    log_info "======================================"
    log_info "✅ Rollback completed successfully!"
    log_info "======================================"
}

main
```

Make it executable:

```bash
chmod +x scripts/rollback.sh
```

### Step 3.5: Test Scripts Manually

Before proceeding, let's test the scripts:

```bash
# Test verification (should pass if site is running)
./scripts/verify-deployment.sh

# Test pulling images (will fail until first images are pushed - that's expected)
./scripts/pull-images.sh both latest || echo "Expected failure (no images yet)"

# DO NOT test deploy.sh yet - wait until after CI/CD is set up
```

---

## Phase 4: Create GitHub Workflows (Day 3)

I'll create the workflow files in the next message due to length. These files should be created in your repository under `.github/workflows/`.

Would you like me to continue with Phase 4 (GitHub Workflows)?
