#!/bin/bash

###############################################################################
# Backup Verification Script
#
# Manually verify that backups are being created and are valid
#
# Usage: ./scripts/backup-verify.sh
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
BACKUP_CONTAINER="bcflame_backup"

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

check_backup_container() {
    log_info "Checking backup container status..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${BACKUP_CONTAINER}$"; then
        log_error "Backup container '${BACKUP_CONTAINER}' is not running"
        log_info "Start the production environment first:"
        log_info "  docker-compose -f docker-compose.prod.yml up -d"
        return 1
    fi

    log_info "  ✓ Backup container is running"
    return 0
}

list_backups() {
    log_info "Listing backups..."

    local backup_count=$(docker exec "${BACKUP_CONTAINER}" find /backups -name "backup_*.sql.gz" -type f 2>/dev/null | wc -l)

    if [[ ${backup_count} -eq 0 ]]; then
        log_warning "No backups found"
        log_info "You can create a manual backup with:"
        log_info "  docker exec ${BACKUP_CONTAINER} /usr/local/bin/backup.sh"
        return 1
    fi

    echo ""
    echo "Daily backups:"
    docker exec "${BACKUP_CONTAINER}" ls -lh /backups/backup_*.sql.gz 2>/dev/null || echo "  None"

    echo ""
    echo "Weekly backups:"
    docker exec "${BACKUP_CONTAINER}" ls -lh /backups/weekly/backup_week_*.sql.gz 2>/dev/null || echo "  None"

    echo ""
    echo "Monthly backups:"
    docker exec "${BACKUP_CONTAINER}" ls -lh /backups/monthly/backup_month_*.sql.gz 2>/dev/null || echo "  None"

    echo ""
    log_info "Total backups: ${backup_count}"
    return 0
}

verify_latest_backup() {
    log_info "Verifying latest backup..."

    # Get latest backup file
    local latest_backup=$(docker exec "${BACKUP_CONTAINER}" find /backups -name "backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

    if [[ -z "${latest_backup}" ]]; then
        log_error "No backups found to verify"
        return 1
    fi

    log_info "Latest backup: ${latest_backup}"

    # Test that the backup file is a valid gzip file
    if docker exec "${BACKUP_CONTAINER}" gzip -t "${latest_backup}" 2>/dev/null; then
        log_info "  ✓ Backup file is a valid gzip file"
    else
        log_error "  ✗ Backup file is corrupted or invalid"
        return 1
    fi

    # Get backup size
    local backup_size=$(docker exec "${BACKUP_CONTAINER}" du -h "${latest_backup}" | cut -f1)
    log_info "  Size: ${backup_size}"

    # Get backup age
    local backup_age=$(docker exec "${BACKUP_CONTAINER}" find "${latest_backup}" -printf '%Td days %Th hours ago\n')
    log_info "  Age: ${backup_age}"

    log_info "  ✓ Latest backup is valid"
    return 0
}

check_backup_logs() {
    log_info "Checking backup logs..."

    # Check cron log
    if docker exec "${BACKUP_CONTAINER}" test -f /var/log/backups/cron.log 2>/dev/null; then
        log_info "Recent cron activity:"
        docker exec "${BACKUP_CONTAINER}" tail -n 5 /var/log/backups/cron.log 2>/dev/null || echo "  No recent activity"
    else
        log_warning "Cron log not found"
    fi

    echo ""

    # Check latest backup log
    local latest_log=$(docker exec "${BACKUP_CONTAINER}" find /var/log/backups -name "backup_*.log" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

    if [[ -n "${latest_log}" ]]; then
        log_info "Latest backup log: ${latest_log}"
        echo ""
        docker exec "${BACKUP_CONTAINER}" tail -n 20 "${latest_log}" 2>/dev/null || echo "  Cannot read log"
    else
        log_warning "No backup logs found"
    fi

    return 0
}

check_cron_schedule() {
    log_info "Checking backup schedule..."

    local cron_schedule=$(docker exec "${BACKUP_CONTAINER}" cat /etc/crontabs/root 2>/dev/null || echo "")

    if [[ -z "${cron_schedule}" ]]; then
        log_error "Cron schedule not configured"
        return 1
    fi

    echo "  Cron schedule:"
    echo "  ${cron_schedule}"

    log_info "  ✓ Backup schedule is configured"
    return 0
}

test_backup_creation() {
    log_info "Testing backup creation..."
    log_info "Creating a test backup (this may take a moment)..."

    if docker exec "${BACKUP_CONTAINER}" /usr/local/bin/backup.sh; then
        log_info "  ✓ Test backup created successfully"
        return 0
    else
        log_error "  ✗ Failed to create test backup"
        return 1
    fi
}

###############################################################################
# Main Script
###############################################################################

main() {
    echo "========================================="
    echo "BC Flame Backup Verification"
    echo "========================================="
    echo ""

    local checks_passed=0
    local checks_failed=0

    # Check backup container
    if check_backup_container; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
        echo ""
        log_error "Backup container is not running. Exiting."
        exit 1
    fi

    echo ""

    # Check cron schedule
    if check_cron_schedule; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi

    echo ""

    # List backups
    if list_backups; then
        checks_passed=$((checks_passed + 1))
    else
        checks_failed=$((checks_failed + 1))
    fi

    echo ""

    # Verify latest backup (if any exist)
    if docker exec "${BACKUP_CONTAINER}" find /backups -name "backup_*.sql.gz" -type f 2>/dev/null | grep -q .; then
        if verify_latest_backup; then
            checks_passed=$((checks_passed + 1))
        else
            checks_failed=$((checks_failed + 1))
        fi
        echo ""
    fi

    # Check backup logs
    check_backup_logs

    echo ""
    echo "========================================="

    # Ask if user wants to test backup creation
    read -p "Do you want to test backup creation? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        if test_backup_creation; then
            checks_passed=$((checks_passed + 1))
        else
            checks_failed=$((checks_failed + 1))
        fi
    fi

    echo ""
    echo "========================================="
    echo "Verification Summary"
    echo "========================================="
    echo "Checks passed: ${checks_passed}"
    echo "Checks failed: ${checks_failed}"
    echo ""

    if [[ ${checks_failed} -eq 0 ]]; then
        log_info "✓ All checks passed!"
        echo ""
        log_info "Next steps:"
        log_info "  • Backups will run automatically based on the schedule"
        log_info "  • Monitor logs: docker exec ${BACKUP_CONTAINER} tail -f /var/log/backups/cron.log"
        log_info "  • List backups: docker exec ${BACKUP_CONTAINER} ls -lh /backups"
        log_info "  • Restore backup: docker exec -it ${BACKUP_CONTAINER} /usr/local/bin/restore.sh <backup_file>"
        return 0
    else
        log_error "✗ Some checks failed"
        echo ""
        log_info "Troubleshooting:"
        log_info "  • Check container logs: docker logs ${BACKUP_CONTAINER}"
        log_info "  • Check environment variables in docker-compose.prod.yml"
        log_info "  • Ensure database is accessible from backup container"
        return 1
    fi
}

# Run main function
main
