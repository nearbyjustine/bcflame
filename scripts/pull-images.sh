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
GITHUB_USERNAME="${GITHUB_USERNAME:-YOUR_GITHUB_USERNAME}"  # UPDATE THIS
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
