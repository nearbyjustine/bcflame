# Rollback Procedures

## Overview

This document provides step-by-step procedures for rolling back a failed deployment, recovering from disasters, and handling emergency situations.

---

## When to Rollback

Consider rolling back when:

- ✅ **Deployment verification fails** - Health checks don't pass after 2 minutes
- ✅ **Critical bugs in production** - User-facing functionality is broken
- ✅ **Performance degradation** - Site becomes noticeably slower
- ✅ **Security vulnerability** - A security issue is discovered post-deployment
- ✅ **Database issues** - Data corruption or migration failures

Do NOT rollback for:
- ❌ Minor UI issues that don't affect functionality
- ❌ Non-critical bugs that can be fixed forward
- ❌ Feature requests
- ❌ Cosmetic changes

---

## Automatic Rollback

The CI/CD pipeline includes automatic rollback when deployment verification fails.

**What happens:**
1. Deployment script runs and starts new containers
2. Verification script checks health of all services
3. If verification fails:
   - Automatically triggers rollback script
   - Reverts to previous commit
   - Pulls previous Docker images
   - Restarts containers with previous images
   - Sends Discord notification

**No action needed** - the system handles it automatically.

---

## Manual Rollback via GitHub Actions

### Option 1: Rollback to Previous Deployment

Use this when you want to rollback to the last known good deployment:

1. **Go to GitHub Actions**:
   - Navigate to: `https://github.com/YOUR_USERNAME/bcflame/actions`
   - Click "Rollback Deployment" workflow

2. **Trigger Rollback**:
   - Click "Run workflow" button
   - Leave "Commit SHA" field **empty** (to rollback to previous)
   - Click green "Run workflow" button

3. **Monitor Progress**:
   - Watch the workflow execution in real-time
   - Should complete in 2-3 minutes

4. **Verify Success**:
   - Check site at your production URL
   - Verify functionality works correctly

### Option 2: Rollback to Specific Commit

Use this when you need to rollback to a specific version (not just previous):

1. **Find Target Commit SHA**:
   ```bash
   # View recent commits
   git log --oneline -n 20

   # Or check GitHub:
   # https://github.com/YOUR_USERNAME/bcflame/commits/master
   ```

2. **Trigger Rollback**:
   - Go to GitHub Actions → "Rollback Deployment"
   - Click "Run workflow"
   - Enter commit SHA (e.g., `abc123def456`)
   - Click "Run workflow"

3. **Verify Success**:
   - Monitor workflow execution
   - Test site functionality

---

## Manual Rollback via SSH

Use this when GitHub Actions is unavailable or you need immediate control.

### Prerequisites

```bash
# Ensure you have SSH access
ssh user@your-server.com

# Verify you're in project directory
cd /opt/bcflame
pwd  # Should show /opt/bcflame
```

### Rollback to Previous Deployment

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Execute rollback script (no arguments = previous deployment)
./scripts/rollback.sh

# Watch output for errors
# Should see:
# - Code reverted
# - Images pulled
# - Containers restarted
# - Health checks passed

# Verify deployment
./scripts/verify-deployment.sh

# Check logs if needed
tail -f /var/log/bcflame/rollback.log
```

### Rollback to Specific Commit

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Find available commits
git log --oneline -n 20

# Rollback to specific commit
./scripts/rollback.sh abc123def456

# Verify
./scripts/verify-deployment.sh
```

---

## Emergency Rollback (Ultra-Fast)

When every second counts and you need the site back online immediately:

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Read previous deployment marker
PREV_SHA=$(cat .last_deploy.previous)
echo "Rolling back to: $PREV_SHA"

# Quick rollback without full verification
git reset --hard $PREV_SHA
export IMAGE_TAG=$PREV_SHA
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Site should be back up in 30-60 seconds
```

**Warning**: This skips safety checks. Use only in true emergencies.

---

## Rollback Verification Checklist

After any rollback, verify:

- [ ] **Frontend accessible** - Site loads at production URL
- [ ] **Backend healthy** - API endpoint returns 200: `/api/products`
- [ ] **Login works** - Test user authentication
- [ ] **Key features work**:
  - [ ] Product catalog loads
  - [ ] Order creation works
  - [ ] Media hub accessible
  - [ ] Admin panel accessible
- [ ] **Database intact** - No data loss
- [ ] **Logs clean** - No error spam in logs

### Quick Verification Commands

```bash
# On server, run:
cd /opt/bcflame

# Test all services
./scripts/verify-deployment.sh

# Check container health
docker-compose -f docker-compose.prod.yml ps

# View recent logs
docker-compose -f docker-compose.prod.yml logs --tail=50 frontend
docker-compose -f docker-compose.prod.yml logs --tail=50 strapi

# Test critical endpoints
curl -I https://yourdomain.com
curl -I https://api.yourdomain.com/_health
curl https://api.yourdomain.com/api/products\?pagination\[limit\]=1
```

---

## What to Do After Rollback

### 1. Investigate Root Cause

```bash
# On server, check deployment logs
tail -n 100 /var/log/bcflame/deployments.log

# Check container logs for errors
docker-compose -f docker-compose.prod.yml logs --since 1h frontend
docker-compose -f docker-compose.prod.yml logs --since 1h strapi

# Check system resources
df -h  # Disk space
free -h  # Memory
top  # CPU usage
```

### 2. Document the Issue

Create a GitHub issue documenting:
- What was deployed
- What went wrong
- Error messages/logs
- Steps taken to rollback
- Root cause (if known)

### 3. Fix Forward

Once root cause is identified:
- Create a fix in a feature branch
- Test thoroughly locally
- Create PR with detailed description
- Get code review
- Deploy fix when ready

### 4. Notify Stakeholders

Inform relevant parties:
- Team members
- Clients (if user-facing impact)
- Management (if significant downtime)

Use template:
```
Subject: Production Rollback - [Brief Description]

Summary:
- Deployment of [commit/feature] to production at [time]
- Issue: [description of problem]
- Action: Rolled back to previous version at [time]
- Downtime: [duration]
- Current Status: Stable on previous version
- Next Steps: [fix plan]
```

---

## Database Rollback (Advanced)

### When Database Migrations Fail

If a database migration fails during deployment:

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Check current migration status
docker exec bcflame_strapi_prod npm run strapi db:migrate -- --help

# If Strapi provides rollback command:
docker exec bcflame_strapi_prod npm run strapi db:migrate:down

# If not, restore from backup:
# List available backups
docker exec bcflame_backup ls -lh /backups

# Restore latest backup before deployment
docker exec bcflame_backup /usr/local/bin/restore.sh /backups/backup_YYYYMMDD_HHMMSS.sql.gz

# Restart services
docker-compose -f docker-compose.prod.yml restart strapi
```

### Database Rollback Best Practices

1. **Always backup before deployment** (automated in deploy script)
2. **Test migrations locally first**
3. **Make migrations backward-compatible when possible**
4. **Document migration rollback steps** in PR description

---

## Disaster Recovery Scenarios

### Scenario 1: Complete Server Failure

**Symptoms**: Server unreachable, can't SSH

**Recovery Steps**:

1. **Provision new Digital Ocean droplet**
   - Use same size/specs as original
   - Use Ubuntu 22.04 LTS

2. **Install Docker and Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bcflame.git /opt/bcflame
   cd /opt/bcflame
   ```

4. **Restore environment variables**
   - Copy .env from backup or password manager
   - Or recreate from .env.example

5. **Restore database from S3 backup** (if S3 enabled)
   ```bash
   # Download latest backup from S3
   aws s3 cp s3://your-bucket/backups/backup_latest.sql.gz /tmp/

   # Start database container only
   docker-compose -f docker-compose.prod.yml up -d postgres

   # Wait for postgres healthy
   sleep 30

   # Restore backup
   gunzip < /tmp/backup_latest.sql.gz | docker exec -i bcflame_postgres_prod psql -U bcflame bcflame_db
   ```

6. **Deploy latest version**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Verify everything works**

**Estimated Recovery Time**: 30-60 minutes

### Scenario 2: Corrupted Docker Volumes

**Symptoms**: Containers start but data is missing or corrupted

**Recovery Steps**:

1. **Stop all containers**
   ```bash
   cd /opt/bcflame
   docker-compose -f docker-compose.prod.yml down
   ```

2. **List volumes**
   ```bash
   docker volume ls | grep bcflame
   ```

3. **Remove corrupted volumes**
   ```bash
   docker volume rm bcflame_postgres_data
   docker volume rm bcflame_strapi_uploads
   ```

4. **Restore from backup**
   ```bash
   # Recreate database
   docker-compose -f docker-compose.prod.yml up -d postgres
   sleep 30

   # Restore database
   docker exec bcflame_backup /usr/local/bin/restore.sh /backups/backup_latest.sql.gz

   # Restore uploads (if backed up separately)
   # Copy from backup location to volume
   ```

5. **Restart all services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Scenario 3: Accidental `docker-compose down -v`

**Symptoms**: All data deleted (database, uploads, etc.)

**Recovery**: Same as Scenario 2 (Corrupted Docker Volumes)

**Prevention**:
```bash
# Add alias to prevent accidental data loss
echo "alias docker-compose-down='docker-compose down'" >> ~/.bashrc
# Never use 'down -v' without thinking twice
```

---

## Rollback Troubleshooting

### Issue: "Deployment lock file exists"

**Cause**: Previous deployment didn't complete cleanly

**Solution**:
```bash
ssh user@your-server.com
rm -f /tmp/bcflame/deploy.lock
./scripts/rollback.sh
```

### Issue: "Failed to pull images"

**Cause**: GHCR authentication failed or images don't exist

**Solution**:
```bash
# Re-authenticate to GHCR
cat ~/.ghcr_token | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Verify images exist
docker manifest inspect ghcr.io/YOUR_USERNAME/bcflame-frontend:COMMIT_SHA

# If image doesn't exist, use latest
./scripts/rollback.sh latest
```

### Issue: "Health checks failing after rollback"

**Cause**: Previous version also has issues, or dependency problem

**Solution**:
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Try restarting services
docker-compose -f docker-compose.prod.yml restart

# If still failing, check database
docker exec bcflame_postgres_prod psql -U bcflame -d bcflame_db -c "SELECT version();"

# Last resort: restore from backup and rebuild
```

### Issue: "Git reset failed"

**Cause**: Uncommitted changes or conflicts

**Solution**:
```bash
# Force clean
cd /opt/bcflame
git reset --hard HEAD
git clean -fd

# Then retry rollback
./scripts/rollback.sh
```

---

## Contact Information for Emergencies

| Who | Role | Contact | When to Contact |
|-----|------|---------|-----------------|
| DevOps Lead | Infrastructure | devops@bcflame.com | Server issues, deployment failures |
| Lead Developer | Application | dev@bcflame.com | Code bugs, feature issues |
| Database Admin | Data | dba@bcflame.com | Database corruption, data loss |
| CTO | Escalation | cto@bcflame.com | Extended outages, critical decisions |

---

## Rollback Decision Tree

```
┌─────────────────────────────────┐
│   Issue Detected in Production  │
└─────────────┬───────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Is it critical?    │
    │ (Site down/broken)  │
    └──────┬──────────┬───┘
           │          │
       YES │          │ NO
           │          │
           ▼          ▼
    ┌──────────┐  ┌────────────┐
    │ ROLLBACK │  │ Fix Forward │
    │   NOW    │  │  (Create PR)│
    └──────────┘  └────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Can you rollback via │
    │   GitHub Actions?    │
    └──────┬───────────────┘
           │
       YES │
           ▼
    ┌──────────────────────┐
    │ Use GitHub Actions   │
    │ Rollback Workflow    │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Verify Site Working  │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Investigate & Fix    │
    └──────────────────────┘
```

---

## Best Practices

1. **Test before deploying** - Always test changes locally and in staging
2. **Deploy during low-traffic hours** - Minimize impact if rollback needed
3. **Monitor after deployment** - Watch logs and metrics for 15-30 minutes
4. **Have backup ready** - Ensure latest backup exists before deploying
5. **Document changes** - Clear commit messages and PR descriptions
6. **Communicate** - Let team know about deployments
7. **Practice rollbacks** - Test rollback procedures in staging regularly

---

## Post-Rollback Checklist

After completing a rollback:

- [ ] Site is accessible and functional
- [ ] Health checks passing
- [ ] Error logs reviewed
- [ ] Incident documented (GitHub issue)
- [ ] Team notified
- [ ] Root cause identified
- [ ] Fix planned or in progress
- [ ] Learned lessons documented
- [ ] Prevention measures considered

---

## Questions?

If you encounter a situation not covered in this document:

1. Check `/var/log/bcflame/` logs on server
2. Review GitHub Actions workflow logs
3. Contact DevOps lead
4. Create GitHub issue with details
5. Update this document with new scenario
