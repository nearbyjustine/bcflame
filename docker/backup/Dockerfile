FROM postgres:16-alpine

# Install necessary packages
RUN apk add --no-cache \
    dcron \
    bash \
    curl \
    aws-cli \
    gzip \
    && rm -rf /var/cache/apk/*

# Create backup directories
RUN mkdir -p /backups /var/log/backups

# Copy backup scripts
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/backup.sh \
    /usr/local/bin/restore.sh \
    /usr/local/bin/entrypoint.sh

# Set working directory
WORKDIR /backups

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (keep container running)
CMD ["crond", "-f", "-l", "2"]
