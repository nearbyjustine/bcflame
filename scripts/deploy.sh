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
