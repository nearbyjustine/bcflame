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

    # Check nginx first (main entry point)
    check_service "nginx" "http://localhost/health" || failed=1

    # Check frontend through nginx (production routes through nginx)
    check_service "frontend (via nginx)" "http://localhost/" || failed=1

    # Check backend through internal network
    log_info "Checking backend (internal)..."
    if docker exec bcflame_nginx_prod wget -q -O /dev/null http://strapi:1337/_health 2>/dev/null; then
        log_info "✅ backend is healthy (internal)"
    else
        log_error "❌ backend failed internal health check"
        failed=1
    fi

    # Check container health (relaxed - only fail if container is stopped)
    log_info "Checking container status..."
    local frontend_status=$(docker inspect --format='{{.State.Status}}' "bcflame_frontend_prod" 2>/dev/null || echo "unknown")
    local strapi_status=$(docker inspect --format='{{.State.Status}}' "bcflame_strapi_prod" 2>/dev/null || echo "unknown")
    local nginx_status=$(docker inspect --format='{{.State.Status}}' "bcflame_nginx_prod" 2>/dev/null || echo "unknown")

    if [[ "${frontend_status}" == "running" ]]; then
        log_info "✅ bcflame_frontend_prod container is running"
    else
        log_error "❌ bcflame_frontend_prod container status: ${frontend_status}"
        failed=1
    fi

    if [[ "${strapi_status}" == "running" ]]; then
        log_info "✅ bcflame_strapi_prod container is running"
    else
        log_error "❌ bcflame_strapi_prod container status: ${strapi_status}"
        failed=1
    fi

    if [[ "${nginx_status}" == "running" ]]; then
        log_info "✅ bcflame_nginx_prod container is running"
    else
        log_error "❌ bcflame_nginx_prod container status: ${nginx_status}"
        failed=1
    fi

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
