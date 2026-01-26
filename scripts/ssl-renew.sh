#!/bin/bash

###############################################################################
# SSL Certificate Renewal Script for BC Flame
#
# This script automatically renews Let's Encrypt SSL certificates and
# reloads nginx if certificates were renewed.
#
# Usage: ./scripts/ssl-renew.sh
#
# Intended to be run via cron job:
# 15 2,14 * * * /path/to/bcflame/scripts/ssl-renew.sh >> /var/log/letsencrypt-renewal.log 2>&1
#
# This runs twice daily at 2:15 AM and 2:15 PM (Let's Encrypt recommends twice daily)
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SSL_DIR="${PROJECT_ROOT}/nginx/ssl"
NGINX_CONTAINER="bcflame_nginx_prod"
LOG_FILE="${LOG_FILE:-/var/log/letsencrypt-renewal.log}"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[ERROR]${NC} $1"
}

check_certbot() {
    if ! command -v certbot &> /dev/null; then
        log_error "certbot not found. Please install certbot first."
        exit 1
    fi
}

check_nginx_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
        log_error "Nginx container '${NGINX_CONTAINER}' is not running"
        exit 1
    fi
}

get_primary_domain() {
    # Get the primary domain from the first certificate found
    local cert_dirs=$(sudo find /etc/letsencrypt/live -maxdepth 1 -type d ! -name 'live' ! -name 'README')

    if [[ -z "${cert_dirs}" ]]; then
        log_error "No certificates found in /etc/letsencrypt/live"
        exit 1
    fi

    # Get the first directory name
    local primary_domain=$(basename $(echo "${cert_dirs}" | head -n 1))
    echo "${primary_domain}"
}

renew_certificates() {
    log_info "Checking for certificates that need renewal..."

    # Try to renew certificates
    # --quiet: Only output on errors or certificate renewals
    # --no-random-sleep-on-renew: Don't sleep, we control timing via cron
    if sudo certbot renew --quiet --no-random-sleep-on-renew --deploy-hook "$(pwd)/scripts/ssl-renew.sh --post-hook"; then
        log_info "Certificate renewal check completed"
        return 0
    else
        log_error "Certificate renewal failed"
        return 1
    fi
}

copy_certificates() {
    local primary_domain="$1"

    log_info "Copying renewed certificates to nginx/ssl directory..."

    local cert_dir="/etc/letsencrypt/live/${primary_domain}"

    if [[ ! -d "${cert_dir}" ]]; then
        log_error "Certificate directory not found: ${cert_dir}"
        return 1
    fi

    # Copy certificates
    sudo cp "${cert_dir}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
    sudo cp "${cert_dir}/privkey.pem" "${SSL_DIR}/privkey.pem"
    sudo cp "${cert_dir}/chain.pem" "${SSL_DIR}/chain.pem"

    # Set appropriate permissions
    sudo chmod 644 "${SSL_DIR}/fullchain.pem"
    sudo chmod 644 "${SSL_DIR}/chain.pem"
    sudo chmod 600 "${SSL_DIR}/privkey.pem"
    sudo chown -R $(whoami):$(whoami) "${SSL_DIR}"

    log_info "Certificates copied successfully"
}

reload_nginx() {
    log_info "Reloading nginx configuration..."

    if docker exec "${NGINX_CONTAINER}" nginx -t 2>&1; then
        if docker exec "${NGINX_CONTAINER}" nginx -s reload; then
            log_info "Nginx reloaded successfully"
            return 0
        else
            log_error "Failed to reload nginx"
            return 1
        fi
    else
        log_error "Nginx configuration test failed"
        return 1
    fi
}

verify_certificates() {
    local primary_domain="$1"

    log_info "Verifying certificate validity..."

    # Check certificate expiration
    local cert_file="${SSL_DIR}/fullchain.pem"

    if [[ ! -f "${cert_file}" ]]; then
        log_error "Certificate file not found: ${cert_file}"
        return 1
    fi

    local expiry_date=$(openssl x509 -enddate -noout -in "${cert_file}" | cut -d= -f2)
    local expiry_epoch=$(date -d "${expiry_date}" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "${expiry_date}" +%s)
    local now_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - now_epoch) / 86400 ))

    log_info "Certificate expires in ${days_until_expiry} days (${expiry_date})"

    if [[ ${days_until_expiry} -lt 30 ]]; then
        log_warning "Certificate expires in less than 30 days!"
    fi

    if [[ ${days_until_expiry} -lt 7 ]]; then
        log_error "CRITICAL: Certificate expires in less than 7 days!"
        # Send notification (could integrate with email/Slack here)
    fi
}

send_failure_notification() {
    local error_message="$1"

    # Log the error
    log_error "Certificate renewal failed: ${error_message}"

    # TODO: Implement notification system (email, Slack, etc.)
    # For now, just ensure it's logged
    echo "CERTIFICATE RENEWAL FAILURE: ${error_message}" >> "${LOG_FILE}"
}

###############################################################################
# Main Script
###############################################################################

main() {
    # Check if this is a post-hook execution
    if [[ "${1:-}" == "--post-hook" ]]; then
        log_info "Running post-renewal hook..."

        # Get primary domain
        local primary_domain=$(get_primary_domain)

        # Copy certificates and reload nginx
        if copy_certificates "${primary_domain}"; then
            reload_nginx
        else
            log_error "Failed to copy certificates in post-hook"
            exit 1
        fi

        exit 0
    fi

    # Regular renewal process
    log_info "Starting SSL certificate renewal process..."

    # Validation
    check_certbot
    check_nginx_container

    # Get primary domain
    local primary_domain=$(get_primary_domain)
    log_info "Primary domain: ${primary_domain}"

    # Attempt renewal
    if renew_certificates; then
        # Verify the certificates after renewal
        verify_certificates "${primary_domain}"
        log_info "SSL certificate renewal completed successfully"
    else
        send_failure_notification "certbot renew command failed"
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
