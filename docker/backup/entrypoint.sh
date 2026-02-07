#!/bin/bash

###############################################################################
# Backup Container Entrypoint
#
# Sets up the cron job for automated backups and starts crond
###############################################################################

set -euo pipefail

echo "==========================================="
echo "BC Flame Backup Container"
echo "==========================================="
echo "Starting backup service..."
echo ""

# Configuration - ensure schedule is properly quoted
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"
BACKUP_SCRIPT="/usr/local/bin/backup.sh"

# Create log directory if it doesn't exist
mkdir -p /var/log/backups

# Log configuration
echo "Configuration:"
echo "  Schedule: ${BACKUP_SCHEDULE}"
echo "  Backup directory: ${BACKUP_DIR:-/backups}"
echo "  Retention (days): ${BACKUP_RETENTION_DAYS:-7}"
echo "  S3 upload: ${BACKUP_S3_ENABLED:-false}"
echo ""

# Create cron job - use printf to avoid word splitting issues
echo "Setting up cron job..."
printf '%s %s >> /var/log/backups/cron.log 2>&1\n' "${BACKUP_SCHEDULE}" "${BACKUP_SCRIPT}" > /etc/crontabs/root

# Verify cron job
echo "Cron job configured:"
cat /etc/crontabs/root
echo ""

# Run initial backup if BACKUP_ON_START is true
if [[ "${BACKUP_ON_START:-false}" == "true" ]]; then
    echo "Running initial backup..."
    ${BACKUP_SCRIPT}
    echo ""
fi

echo "Backup service started successfully"
echo "==========================================="
echo ""

# Execute the CMD from Dockerfile (start crond)
exec "$@"
