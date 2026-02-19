#!/bin/bash
# BC Flame Project - Handover Backup Script
# This script creates a complete backup package for project handover

set -e  # Exit on error

BACKUP_DIR="bcflame-handover-$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR=$(pwd)

echo "🔄 Starting BC Flame handover backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Create database backup
echo ""
echo "📊 Creating database backup..."
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U bcflame_user bcflame > "$BACKUP_DIR/database-backup.sql"
    echo "✅ Database backup created: database-backup.sql"
else
    echo "⚠️  PostgreSQL container not running. Starting it..."
    docker-compose up -d postgres
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    docker-compose exec -T postgres pg_dump -U bcflame_user bcflame > "$BACKUP_DIR/database-backup.sql"
    echo "✅ Database backup created: database-backup.sql"
fi

# 2. Copy source code (excluding node_modules, build artifacts)
echo ""
echo "📦 Copying source code..."
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.cache' \
    --exclude='.turbo' \
    --exclude='coverage' \
    --exclude='.git' \
    ./ "$BACKUP_DIR/source-code/"
echo "✅ Source code copied"

# 3. Export Git information
echo ""
echo "🌿 Exporting Git information..."
cd "$CURRENT_DIR"
git log --oneline --graph --all -20 > "$BACKUP_DIR/git-history.txt"
git remote -v > "$BACKUP_DIR/git-remotes.txt"
git branch -a > "$BACKUP_DIR/git-branches.txt"
git status > "$BACKUP_DIR/git-status.txt"
echo "✅ Git information exported"

# 4. Copy Strapi uploads
echo ""
echo "🖼️  Copying uploaded files..."
if [ -d "backend/public/uploads" ]; then
    mkdir -p "$BACKUP_DIR/uploads"
    cp -r backend/public/uploads/* "$BACKUP_DIR/uploads/" 2>/dev/null || echo "ℹ️  No uploads found"
    echo "✅ Uploaded files copied"
else
    echo "ℹ️  No uploads directory found"
fi

# 5. Create environment file template
echo ""
echo "🔐 Creating environment template..."
cp .env.example "$BACKUP_DIR/env-template.txt"
echo "✅ Environment template created"

# 6. Export Docker configuration
echo ""
echo "🐳 Exporting Docker configuration..."
cp docker-compose.yml "$BACKUP_DIR/"
cp frontend/Dockerfile "$BACKUP_DIR/Dockerfile.frontend" 2>/dev/null || true
cp backend/Dockerfile "$BACKUP_DIR/Dockerfile.backend" 2>/dev/null || true
echo "✅ Docker configuration exported"

# 7. Export package information
echo ""
echo "📋 Exporting package information..."
cd "$CURRENT_DIR"
cat > "$BACKUP_DIR/dependencies.txt" << EOF
=== Frontend Dependencies ===
$(cd frontend && npm list --depth=0 2>/dev/null || echo "Run 'npm install' in frontend directory")

=== Backend Dependencies ===
$(cd backend && npm list --depth=0 2>/dev/null || echo "Run 'npm install' in backend directory")
EOF
echo "✅ Package information exported"

# 8. Copy documentation
echo ""
echo "📚 Copying documentation..."
cp HANDOVER.md "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  HANDOVER.md not found"
cp CLAUDE.md "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  CLAUDE.md not found"
cp README.md "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Documentation copied"

# 9. Create backup summary
echo ""
echo "📄 Creating backup summary..."
cat > "$BACKUP_DIR/BACKUP-INFO.txt" << EOF
BC Flame Project - Handover Backup
===================================

Backup Date: $(date)
Backup Created By: $(git config user.name) <$(git config user.email)>
Current Branch: $(git branch --show-current)
Latest Commit: $(git log -1 --oneline)
Repository: $(git config --get remote.origin.url)

Contents:
---------
1. database-backup.sql       - PostgreSQL database dump
2. source-code/              - Complete source code (excluding node_modules)
3. uploads/                  - Strapi uploaded files
4. git-history.txt           - Recent Git commit history
5. git-remotes.txt           - Git remote URLs
6. git-branches.txt          - Git branch list
7. git-status.txt            - Current Git status
8. env-template.txt          - Environment variables template
9. docker-compose.yml        - Docker configuration
10. dependencies.txt         - NPM package list
11. HANDOVER.md              - Complete handover documentation
12. CLAUDE.md                - Development guidelines
13. README.md                - Setup instructions

Restore Instructions:
---------------------
1. Extract this backup to a new directory
2. Copy 'source-code/' contents to project root
3. Copy '.env.example' to '.env' and configure
4. Restore database: docker-compose exec -T postgres psql -U bcflame_user bcflame < database-backup.sql
5. Copy 'uploads/' to 'backend/public/uploads/'
6. Run: docker-compose up -d

Next Steps:
-----------
- Transfer GitHub repository ownership
- Transfer domain registrar access
- Transfer hosting provider access
- Transfer Resend account or generate new API key
- Update admin passwords
- Update JWT secrets
- Configure production environment variables

For detailed instructions, see HANDOVER.md
EOF
echo "✅ Backup summary created"

# 10. Create compressed archive
echo ""
echo "🗜️  Creating compressed archive..."
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
ARCHIVE_SIZE=$(du -h "$BACKUP_DIR.tar.gz" | cut -f1)
echo "✅ Archive created: $BACKUP_DIR.tar.gz ($ARCHIVE_SIZE)"

# Display summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Handover backup completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Backup Location:"
echo "   Directory: $BACKUP_DIR/"
echo "   Archive:   $BACKUP_DIR.tar.gz ($ARCHIVE_SIZE)"
echo ""
echo "📋 Next Steps:"
echo "   1. Review HANDOVER.md for complete documentation"
echo "   2. Verify database backup can be restored"
echo "   3. Share the .tar.gz file via secure method"
echo "   4. Transfer repository ownership"
echo "   5. Transfer API keys and credentials"
echo ""
echo "🔒 Security Reminder:"
echo "   - This backup contains sensitive configuration"
echo "   - Do NOT commit to public repositories"
echo "   - Use encrypted transfer methods"
echo "   - Delete after successful handover"
echo ""
