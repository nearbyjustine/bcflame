#!/bin/bash

###############################################################################
# SSL Certificate Setup Script for BC Flame
#
# This script automates the generation of Let's Encrypt SSL certificates
# for the BC Flame production environment.
#
# Usage: ./scripts/ssl-setup.sh domain1.com domain2.com domain3.com
# Example: ./scripts/ssl-setup.sh yourdomain.com www.yourdomain.com api.yourdomain.com
#
# Requirements:
# - Docker and docker-compose installed
# - Nginx container running with certbot webroot volume mounted
# - Domains pointing to this server
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
WEBROOT_DIR="${PROJECT_ROOT}/nginx/certbot"
NGINX_CONTAINER="bcflame_nginx_prod"
EMAIL="${SSL_EMAIL:-}"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "Usage: $0 domain1.com [domain2.com domain3.com ...]"
    echo ""
    echo "Environment variables:"
    echo "  SSL_EMAIL    Email address for Let's Encrypt notifications (required)"
    echo "  SSL_STAGING  Set to 'true' to use Let's Encrypt staging environment (default: false)"
    echo ""
    echo "Example:"
    echo "  SSL_EMAIL=admin@example.com $0 example.com www.example.com"
    exit 1
}

validate_email() {
    if [[ -z "${EMAIL}" ]]; then
        log_error "SSL_EMAIL environment variable is required"
        echo "Please set SSL_EMAIL to your email address for Let's Encrypt notifications"
        echo "Example: SSL_EMAIL=admin@example.com $0 $*"
        exit 1
    fi

    if ! [[ "${EMAIL}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_error "Invalid email address: ${EMAIL}"
        exit 1
    fi
}

validate_domains() {
    local domains=("$@")

    if [[ ${#domains[@]} -eq 0 ]]; then
        log_error "No domains specified"
        usage
    fi

    log_info "Validating domains..."
    for domain in "${domains[@]}"; do
        # Basic domain format validation
        if ! [[ "${domain}" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
            log_error "Invalid domain format: ${domain}"
            exit 1
        fi
        log_info "  ✓ ${domain}"
    done
}

check_certbot() {
    log_info "Checking for certbot installation..."

    if ! command -v certbot &> /dev/null; then
        log_warning "certbot not found. Installing certbot..."

        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot
            elif command -v yum &> /dev/null; then
                sudo yum install -y certbot
            else
                log_error "Unable to install certbot. Please install it manually."
                exit 1
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install certbot
            else
                log_error "Homebrew not found. Please install certbot manually."
                exit 1
            fi
        else
            log_error "Unsupported OS. Please install certbot manually."
            exit 1
        fi
    fi

    log_info "  ✓ certbot is installed"
}

check_nginx_container() {
    log_info "Checking nginx container..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
        log_error "Nginx container '${NGINX_CONTAINER}' is not running"
        log_info "Please start the production environment first:"
        log_info "  docker-compose -f docker-compose.prod.yml up -d"
        exit 1
    fi

    log_info "  ✓ Nginx container is running"
}

create_directories() {
    log_info "Creating necessary directories..."

    mkdir -p "${SSL_DIR}"
    mkdir -p "${WEBROOT_DIR}"

    log_info "  ✓ Directories created"
}

generate_certificates() {
    local domains=("$@")
    local staging_flag=""

    # Build domain arguments
    local domain_args=""
    for domain in "${domains[@]}"; do
        domain_args="${domain_args} -d ${domain}"
    done

    # Use staging environment if requested
    if [[ "${SSL_STAGING:-false}" == "true" ]]; then
        staging_flag="--staging"
        log_warning "Using Let's Encrypt STAGING environment (certificates will not be trusted)"
    fi

    log_info "Generating SSL certificates..."
    log_info "Domains: ${domains[*]}"
    log_info "Email: ${EMAIL}"

    # Generate certificates using certbot standalone mode
    # We temporarily stop nginx to free port 80
    log_info "Stopping nginx temporarily..."
    docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" stop nginx

    # Run certbot
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        ${staging_flag} \
        ${domain_args}; then
        log_info "  ✓ Certificates generated successfully"
    else
        log_error "Failed to generate certificates"
        log_info "Restarting nginx..."
        docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" start nginx
        exit 1
    fi

    # Start nginx again
    log_info "Starting nginx..."
    docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" start nginx
}

copy_certificates() {
    local primary_domain="$1"

    log_info "Copying certificates to nginx/ssl directory..."

    local cert_dir="/etc/letsencrypt/live/${primary_domain}"

    if [[ ! -d "${cert_dir}" ]]; then
        log_error "Certificate directory not found: ${cert_dir}"
        exit 1
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

    log_info "  ✓ Certificates copied"
}

reload_nginx() {
    log_info "Reloading nginx configuration..."

    if docker exec "${NGINX_CONTAINER}" nginx -t; then
        docker exec "${NGINX_CONTAINER}" nginx -s reload
        log_info "  ✓ Nginx reloaded successfully"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
}

verify_ssl() {
    local domain="$1"

    log_info "Verifying SSL certificate..."

    if openssl s_client -connect "${domain}:443" -servername "${domain}" </dev/null 2>/dev/null | openssl x509 -noout -dates; then
        log_info "  ✓ SSL certificate is valid"
    else
        log_warning "Could not verify SSL certificate. This is normal if the domain is not accessible yet."
    fi
}

###############################################################################
# Main Script
###############################################################################

main() {
    local domains=("$@")

    log_info "BC Flame SSL Certificate Setup"
    log_info "==============================="
    echo ""

    # Validation
    validate_email
    validate_domains "${domains[@]}"
    check_certbot
    check_nginx_container

    echo ""

    # Setup
    create_directories
    generate_certificates "${domains[@]}"
    copy_certificates "${domains[0]}"
    reload_nginx

    echo ""

    # Verification
    verify_ssl "${domains[0]}"

    echo ""
    log_info "==============================="
    log_info "SSL setup completed successfully!"
    log_info ""
    log_info "Your certificates are located at:"
    log_info "  ${SSL_DIR}/"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Verify SSL at https://${domains[0]}"
    log_info "  2. Test with SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=${domains[0]}"
    log_info "  3. Set up auto-renewal with: ./scripts/ssl-renew.sh"
    log_info "  4. Add to crontab: 15 2,14 * * * $(pwd)/scripts/ssl-renew.sh >> /var/log/letsencrypt-renewal.log 2>&1"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
