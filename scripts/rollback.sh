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
