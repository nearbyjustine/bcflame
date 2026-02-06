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
