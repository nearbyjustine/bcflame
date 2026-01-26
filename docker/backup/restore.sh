#!/bin/bash

###############################################################################
# PostgreSQL Restore Script for BC Flame
#
# This script restores a PostgreSQL backup with:
# - Interactive confirmation
# - Automatic backup before restore
# - Rollback on failure
# - Verification after restore
#
# Usage: /usr/local/bin/restore.sh <backup_file>
# Example: /usr/local/bin/restore.sh backup_20260127_020000.sql.gz
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-bcflame_db}"
POSTGRES_USER="${POSTGRES_USER:-bcflame}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"

# Backup file to restore
BACKUP_FILE="${1:-}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Pre-restore backup filename
PRE_RESTORE_BACKUP="pre_restore_${TIMESTAMP}.sql.gz"
PRE_RESTORE_BACKUP_PATH="${BACKUP_DIR}/${PRE_RESTORE_BACKUP}"

# Log file
LOG_FILE="/var/log/backups/restore_${DATE}.log"

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

usage() {
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Example:"
    echo "  $0 backup_20260127_020000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if backup file was provided
    if [[ -z "${BACKUP_FILE}" ]]; then
        log_error "Backup file not specified"
        usage
    fi

    # Check if backup file exists
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    if [[ ! -f "${backup_path}" ]]; then
        log_error "Backup file not found: ${backup_path}"
        log_info "Available backups:"
        ls -lh "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null || log_info "  No backups found"
        exit 1
    fi

    # Check if backup file is valid gzip
    if ! gzip -t "${backup_path}" 2>/dev/null; then
        log_error "Backup file is not a valid gzip file: ${backup_path}"
        exit 1
    fi

    # Check required environment variables
    if [[ -z "${POSTGRES_PASSWORD}" ]]; then
        log_error "POSTGRES_PASSWORD is required"
        exit 1
    fi

    # Check PostgreSQL connection
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; then
        log_error "Cannot connect to PostgreSQL database"
        log_error "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}, DB: ${POSTGRES_DB}, User: ${POSTGRES_USER}"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

confirm_restore() {
    log_warning "========================================="
    log_warning "WARNING: Database Restore Operation"
    log_warning "========================================="
    log_warning "This will REPLACE all data in the database!"
    log_warning ""
    log_warning "Database: ${POSTGRES_DB}"
    log_warning "Backup file: ${BACKUP_FILE}"
    log_warning ""
    log_warning "A backup of the current database will be created before restore."
    log_warning ""

    # In automated/non-interactive mode, skip confirmation
    if [[ "${RESTORE_AUTO_CONFIRM:-false}" == "true" ]]; then
        log_warning "Auto-confirm enabled, proceeding with restore"
        return 0
    fi

    read -p "Do you want to continue? (yes/no): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi

    log_info "User confirmed restore operation"
}

create_pre_restore_backup() {
    log_info "Creating backup of current database before restore..."

    # Perform backup with pg_dump
    if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists | gzip > "${PRE_RESTORE_BACKUP_PATH}"; then

        local backup_size=$(du -h "${PRE_RESTORE_BACKUP_PATH}" | cut -f1)
        log_info "Pre-restore backup created successfully (${backup_size})"
        log_info "Pre-restore backup: ${PRE_RESTORE_BACKUP}"
        return 0
    else
        log_error "Failed to create pre-restore backup"
        return 1
    fi
}

perform_restore() {
    log_info "Starting database restore..."
    log_info "Backup file: ${BACKUP_FILE}"

    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"

    # Restore database from backup
    if gunzip -c "${backup_path}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --single-transaction \
        --set ON_ERROR_STOP=on 2>&1 | tee -a "${LOG_FILE}"; then

        log_info "Database restore completed successfully"
        return 0
    else
        log_error "Database restore failed"
        return 1
    fi
}

verify_restore() {
    log_info "Verifying database after restore..."

    # Check if database is accessible
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; then
        log_error "Database is not accessible after restore"
        return 1
    fi

    # Count tables
    local table_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

    log_info "Database has ${table_count} tables"

    if [[ ${table_count} -eq 0 ]]; then
        log_warning "Database has no tables after restore"
        return 1
    fi

    log_info "Database verification passed"
    return 0
}

rollback_restore() {
    log_error "========================================="
    log_error "Restore Failed - Attempting Rollback"
    log_error "========================================="

    if [[ ! -f "${PRE_RESTORE_BACKUP_PATH}" ]]; then
        log_error "Pre-restore backup not found, cannot rollback"
        log_error "Database may be in an inconsistent state!"
        return 1
    fi

    log_info "Restoring from pre-restore backup: ${PRE_RESTORE_BACKUP}"

    if gunzip -c "${PRE_RESTORE_BACKUP_PATH}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --single-transaction \
        --set ON_ERROR_STOP=on 2>&1 | tee -a "${LOG_FILE}"; then

        log_info "Rollback completed successfully"
        log_info "Database has been restored to its previous state"
        return 0
    else
        log_error "Rollback failed!"
        log_error "Database may be in an inconsistent state!"
        log_error "Pre-restore backup is available at: ${PRE_RESTORE_BACKUP_PATH}"
        return 1
    fi
}

generate_restore_report() {
    log_info "Generating restore report..."

    cat << EOF >> "${LOG_FILE}"

========================================
Restore Report
========================================
Date: ${DATE}
Time: $(date +%H:%M:%S)
Database: ${POSTGRES_DB}
Backup File: ${BACKUP_FILE}
Pre-Restore Backup: ${PRE_RESTORE_BACKUP}
Status: SUCCESS
========================================

EOF

    log_info "Restore report generated"
}

###############################################################################
# Main Script
###############################################################################

main() {
    log_info "========================================="
    log_info "BC Flame Database Restore"
    log_info "========================================="

    # Check prerequisites
    check_prerequisites

    # Confirm restore operation
    confirm_restore

    # Create pre-restore backup
    if ! create_pre_restore_backup; then
        log_error "Failed to create pre-restore backup, aborting"
        exit 1
    fi

    # Perform restore
    if ! perform_restore; then
        log_error "Restore failed, attempting rollback..."
        rollback_restore
        exit 1
    fi

    # Verify restore
    if ! verify_restore; then
        log_error "Restore verification failed, attempting rollback..."
        rollback_restore
        exit 1
    fi

    # Generate restore report
    generate_restore_report

    log_info "========================================="
    log_info "Restore completed successfully"
    log_info "========================================="
    log_info ""
    log_info "Pre-restore backup saved at: ${PRE_RESTORE_BACKUP_PATH}"
    log_info "You can delete this backup if you don't need it anymore"

    exit 0
}

# Run main function
main
