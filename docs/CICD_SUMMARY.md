# CI/CD Pipeline - Implementation Summary

## Quick Start

This document provides a high-level overview of the CI/CD implementation. For detailed instructions, see the linked documents below.

---

## What We Built

A fully automated CI/CD pipeline that:

✅ **Tests code automatically** on every push and pull request
✅ **Builds Docker images** and stores them in GitHub Container Registry
✅ **Deploys to production** with blue-green deployment strategy
✅ **Verifies deployment** with comprehensive health checks
✅ **Automatically rolls back** if verification fails
✅ **Monitors production** with hourly health checks
✅ **Sends notifications** to Discord (optional)
✅ **Enables manual rollback** via GitHub Actions or SSH

---

## Architecture

```
GitHub Push
     │
     ▼
┌─────────────────┐
│  Run Tests      │  ← Frontend & Backend (parallel)
└────────┬────────┘
         │ ✅ Pass
         ▼
┌─────────────────┐
│  Build Images   │  ← Docker multi-stage builds
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to GHCR   │  ← GitHub Container Registry
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SSH to Server  │  ← Digital Ocean droplet
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy Script  │  ← Blue-green deployment
│  1. Backup DB   │
│  2. Pull images │
│  3. Run migrations
│  4. Restart containers
│  5. Verify health
└────────┬────────┘
         │
         ▼
    ✅ Success ───────────► 📢 Discord notification
         │
         ▼
    ❌ Failure ───────────► 🔄 Automatic rollback
```

---

## Key Features

### 1. Intelligent Change Detection

The pipeline automatically detects which services changed:

```bash
# Commit message flags (highest priority)
git commit -m "[frontend] Fix button styling"  # Only frontend
git commit -m "[backend] Add new API endpoint"  # Only backend
git commit -m "[both] Update Docker config"     # Both services

# Auto-detection (no flag needed)
# Changes to frontend/** → deploy frontend
# Changes to backend/** → deploy backend
# Changes to docker-compose.prod.yml → deploy both
```

### 2. Blue-Green Deployment

Our deployment strategy provides near-zero downtime:

1. **Pre-deployment backup** - Database automatically backed up
2. **Pull new images** - Latest Docker images from GHCR
3. **Stop old containers** - Brief 30-60 second downtime
4. **Start new containers** - With new images
5. **Health checks** - Wait up to 120 seconds for healthy state
6. **Verify** - Test all services are working
7. **Rollback if needed** - Automatically revert on failure

**Downtime**: 30-60 seconds (during container restart)

### 3. Comprehensive Health Checks

After deployment, the system verifies:

- ✅ Frontend returns HTTP 200
- ✅ Backend API is responsive
- ✅ Nginx is healthy
- ✅ Docker containers are "healthy" status
- ✅ Frontend can communicate with backend
- ✅ Database is accessible

If **any** check fails → **automatic rollback**

### 4. Automatic Rollback

When deployment verification fails:

1. System detects failure within 120 seconds
2. Triggers rollback script automatically
3. Reverts git to previous commit
4. Pulls previous Docker images (still in GHCR)
5. Restarts containers with previous images
6. Verifies rollback succeeded
7. Sends notification (if Discord configured)

**No manual intervention required** for failed deployments.

### 5. Manual Rollback Options

Two ways to manually rollback:

**Option A: GitHub Actions** (Recommended)
- Go to Actions → "Rollback Deployment" → Run workflow
- Choose: Previous deployment OR specific commit SHA
- Wait 2-3 minutes
- Done

**Option B: SSH to Server** (Emergency)
```bash
ssh user@server.com
cd /opt/bcflame
./scripts/rollback.sh  # Rollback to previous
```

---

## Documents Overview

### 📘 [CICD_IMPLEMENTATION_PLAN.md](./CICD_IMPLEMENTATION_PLAN.md)

**Complete step-by-step implementation guide**

- Phase 1: GitHub Setup (Secrets, GHCR, Discord)
- Phase 2: Server Setup (Scripts, authentication, environment)
- Phase 3: Create Server Scripts (deploy.sh, verify.sh, rollback.sh, pull-images.sh)
- Phase 4: Create GitHub Workflows (See CICD_WORKFLOWS.md)
- Phase 5: Testing (See CICD_TESTING_GUIDE.md)
- Phase 6: Documentation
- Phase 7: Monitoring & Alerts

**Use this**: As your main guide during implementation

### 📗 [CICD_WORKFLOWS.md](./CICD_WORKFLOWS.md)

**GitHub Actions workflow files**

Contains complete YAML for:
- `deploy.yml` - Main CI/CD pipeline
- `health-check.yml` - Hourly monitoring
- `rollback.yml` - Manual rollback workflow
- `cleanup-images.yml` - Weekly image cleanup

**Use this**: Copy/paste workflows into `.github/workflows/`

### 📕 [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)

**Emergency rollback procedures**

- When to rollback vs. fix forward
- Automatic rollback (how it works)
- Manual rollback via GitHub Actions
- Manual rollback via SSH
- Emergency ultra-fast rollback
- Database rollback procedures
- Disaster recovery scenarios
- Troubleshooting guide

**Use this**: When things go wrong in production

### 📙 [CICD_TESTING_GUIDE.md](./CICD_TESTING_GUIDE.md)

**Comprehensive testing procedures**

- Phase 1: Local Script Testing (on server)
- Phase 2: GitHub Actions Connectivity
- Phase 3: End-to-End Deployment
- Phase 4: Selective Deployment (frontend-only, backend-only)
- Phase 5: Rollback Testing
- Phase 6: Monitoring Testing
- Phase 7: Edge Cases

**Use this**: Before going live, test everything

---

## Quick Reference Commands

### On GitHub

```bash
# Manual deployment
Actions → Deploy to Production → Run workflow

# Manual rollback
Actions → Rollback Deployment → Run workflow

# Check health
Actions → Health Check → Run workflow

# View deployment history
Actions → Deploy to Production → All workflow runs
```

### On Server

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# View deployment logs
tail -f /var/log/bcflame/deployments.log

# View rollback logs
tail -f /var/log/bcflame/rollback.log

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View container logs
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f strapi

# Manual deployment
./scripts/deploy.sh both abc123def

# Manual verification
./scripts/verify-deployment.sh

# Manual rollback
./scripts/rollback.sh  # Previous deployment
./scripts/rollback.sh abc123def  # Specific commit

# Check deployment lock
ls -la /tmp/bcflame/deploy.lock

# Remove stuck deployment lock
rm -f /tmp/bcflame/deploy.lock
```

---

## GitHub Secrets Reference

Configure these in: **Settings → Secrets and variables → Actions**

| Secret | Description | Example | Required |
|--------|-------------|---------|----------|
| `SSH_PRIVATE_KEY` | Private SSH key | `-----BEGIN OPENSSH...` | ✅ Yes |
| `SSH_HOST` | Server IP/hostname | `123.45.67.89` | ✅ Yes |
| `SSH_USER` | SSH username | `ubuntu` | ✅ Yes |
| `SERVER_PROJECT_PATH` | Project path | `/opt/bcflame` | ✅ Yes |
| `NEXT_PUBLIC_STRAPI_URL` | Backend URL | `https://api.yourdomain.com` | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `https://yourdomain.com` | ✅ Yes |
| `DISCORD_WEBHOOK` | Discord webhook | `https://discord.com/api/...` | ⚠️ Optional |

---

## Server Scripts Reference

Located in `/opt/bcflame/scripts/` on server:

### `deploy.sh`

**Purpose**: Main deployment script with blue-green strategy

**Usage**:
```bash
./scripts/deploy.sh <service> <commit-sha>
./scripts/deploy.sh both abc123def
./scripts/deploy.sh frontend latest
```

**What it does**:
1. Acquires deployment lock
2. Validates environment variables
3. Triggers pre-deployment backup
4. Pulls latest code from git
5. Pulls Docker images from GHCR
6. Runs database migrations
7. Deploys services (stop old, start new)
8. Waits for health checks
9. Cleans up old images
10. Saves deployment metadata
11. Releases lock

### `verify-deployment.sh`

**Purpose**: Verifies all services are healthy

**Usage**:
```bash
./scripts/verify-deployment.sh
```

**What it checks**:
- Frontend HTTP 200
- Backend API HTTP 200
- Nginx HTTP 200
- Container health status
- Frontend → Backend connectivity

**Timeout**: 120 seconds (60 attempts × 2 seconds)

### `rollback.sh`

**Purpose**: Reverts to previous deployment

**Usage**:
```bash
./scripts/rollback.sh              # Previous deployment
./scripts/rollback.sh abc123def    # Specific commit
```

**What it does**:
1. Determines target commit
2. Reverts git to target
3. Pulls previous Docker images
4. Redeploys with previous images
5. Verifies rollback succeeded

### `pull-images.sh`

**Purpose**: Pulls Docker images from GHCR

**Usage**:
```bash
./scripts/pull-images.sh <service> <tag>
./scripts/pull-images.sh both abc123def
./scripts/pull-images.sh frontend latest
```

**What it does**:
1. Authenticates to GHCR using `~/.ghcr_token`
2. Pulls specified images
3. Falls back to `:latest` if tag not found

---

## Workflow Files Reference

Located in `.github/workflows/`:

### `deploy.yml` - Main CI/CD Pipeline

**Triggers**:
- Push to `master` branch
- Pull request to `master`
- Manual workflow_dispatch

**Jobs**:
1. `detect-changes` - Determine which services changed
2. `test-frontend` - Run frontend tests (if changed)
3. `test-backend` - Run backend tests (if changed)
4. `build-frontend` - Build and push frontend image (if changed)
5. `build-backend` - Build and push backend image (if changed)
6. `deploy` - Deploy to server via SSH
7. `notify` - Send Discord notification

**Duration**: 5-10 minutes (varies by what changed)

### `health-check.yml` - Monitoring

**Triggers**:
- Scheduled every hour: `0 * * * *`
- Manual workflow_dispatch

**What it checks**:
- Frontend accessibility
- Backend API health endpoint
- Nginx health endpoint

**On failure**: Sends Discord notification (if configured)

### `rollback.yml` - Manual Rollback

**Triggers**:
- Manual workflow_dispatch only

**Inputs**:
- `commit_sha` (optional) - Commit to rollback to

**What it does**:
- SSH to server
- Execute rollback script
- Verify rollback succeeded
- Send notification

### `cleanup-images.yml` - Image Cleanup

**Triggers**:
- Scheduled weekly: Sunday midnight
- Manual workflow_dispatch

**What it does**:
- Keeps last 10 versions of each image
- Deletes older versions
- Frees up GHCR storage

---

## Deployment Flow Examples

### Example 1: Frontend-Only Change

```bash
# Make frontend change
git add frontend/
git commit -m "fix: Update button styling"
git push origin master
```

**Pipeline actions**:
1. ✅ Detects frontend changes (auto)
2. ✅ Runs frontend tests
3. ✅ Builds frontend image
4. ✅ Pushes to GHCR
5. ✅ Deploys frontend only
6. ✅ Verifies deployment
7. ✅ Sends notification

**Duration**: ~5 minutes
**Downtime**: ~30 seconds (frontend only)

### Example 2: Backend-Only Change

```bash
# Make backend change
git add backend/
git commit -m "[backend] Add new API endpoint"
git push origin master
```

**Pipeline actions**:
1. ✅ Detects `[backend]` flag
2. ✅ Runs backend tests
3. ✅ Builds backend image
4. ✅ Pushes to GHCR
5. ✅ Backs up database
6. ✅ Runs migrations
7. ✅ Deploys backend only
8. ✅ Verifies deployment
9. ✅ Sends notification

**Duration**: ~6 minutes
**Downtime**: ~60 seconds (backend restart)

### Example 3: Both Services Changed

```bash
# Make changes to both
git add frontend/ backend/
git commit -m "[both] Update API integration"
git push origin master
```

**Pipeline actions**:
1. ✅ Detects `[both]` flag
2. ✅ Runs frontend & backend tests (parallel)
3. ✅ Builds frontend & backend images (parallel)
4. ✅ Pushes both to GHCR
5. ✅ Backs up database
6. ✅ Runs migrations
7. ✅ Deploys backend first, then frontend
8. ✅ Verifies deployment
9. ✅ Sends notification

**Duration**: ~8 minutes
**Downtime**: ~60 seconds (both services restart)

### Example 4: Deployment Failure & Rollback

```bash
# Push breaking change
git commit -m "feat: New feature (with bug)"
git push origin master
```

**Pipeline actions**:
1. ✅ Tests pass (bug not caught by tests)
2. ✅ Builds and pushes images
3. ✅ Deploys new version
4. ❌ Health checks fail
5. 🔄 **Automatic rollback triggered**
6. ✅ Reverts to previous version
7. ✅ Verifies rollback succeeded
8. 📢 Sends failure + rollback notification

**Duration**: ~10 minutes (includes rollback)
**Downtime**: ~2 minutes (failed deployment + rollback)

---

## Monitoring & Alerts

### Health Checks

**Frequency**: Every hour
**Checks**: Frontend, Backend, Nginx
**On Failure**: Discord notification + GitHub workflow failure

**View health check history**:
- GitHub → Actions → Health Check → All runs

### Deployment Notifications

If Discord webhook configured:

**Success**:
```
✅ Deployment Successful
Service: both
Commit: abc123def
Branch: master
Author: username
Message: feat: Add new feature
```

**Failure**:
```
❌ Deployment Failed
Service: frontend
Commit: def456abc
Branch: master
Author: username
Message: fix: Update styling

Automatic rollback triggered.
```

**Rollback**:
```
🔄 Rollback Successful
Rolled back to: abc123def
Triggered by: username
```

### Log Files

**On server** (`/var/log/bcflame/`):

- `deployments.log` - All deployment activity
- `rollback.log` - All rollback activity
- Individual container logs via Docker

**View logs**:
```bash
# Deployment logs
tail -f /var/log/bcflame/deployments.log

# Rollback logs
tail -f /var/log/bcflame/rollback.log

# Container logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Troubleshooting Quick Reference

### Deployment stuck with lock file

```bash
ssh user@server.com
rm -f /tmp/bcflame/deploy.lock
```

### Images won't pull

```bash
# Re-authenticate to GHCR
cat ~/.ghcr_token | docker login ghcr.io -u USERNAME --password-stdin

# Verify images exist
docker manifest inspect ghcr.io/USERNAME/bcflame-frontend:COMMIT_SHA
```

### Health checks always fail

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Check database connectivity
docker exec bcflame_strapi_prod npm run strapi console
```

### Need to rollback immediately

```bash
# Emergency rollback (skips some safety checks)
ssh user@server.com
cd /opt/bcflame
PREV_SHA=$(cat .last_deploy.previous)
git reset --hard $PREV_SHA
export IMAGE_TAG=$PREV_SHA
docker-compose -f docker-compose.prod.yml restart
```

---

## Implementation Timeline

**Estimated**: 7-10 days

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Day 1** | GitHub Setup | Configure secrets, enable GHCR, set up Discord |
| **Day 1-2** | Server Setup | Create directories, configure auth, update compose file |
| **Day 2** | Create Scripts | Write deploy.sh, verify.sh, rollback.sh, pull-images.sh |
| **Day 3** | Create Workflows | Add 4 workflow files to .github/workflows/ |
| **Day 3-4** | Testing Phase 1-3 | Test scripts locally, test SSH, test first deployment |
| **Day 4-5** | Testing Phase 4-7 | Test selective deployment, rollback, monitoring, edge cases |
| **Day 5** | Documentation | Finalize docs, train team, create runbooks |
| **Day 6-7** | Buffer | Handle unexpected issues, additional testing |

---

## Success Criteria

The implementation is considered complete when:

✅ **Automated Testing**: Tests run on every PR and push
✅ **Selective Builds**: Only changed services rebuild
✅ **Zero-Downtime Deployment**: Site accessible during deployment (30-60s downtime acceptable)
✅ **Automatic Rollback**: Failed deployments revert automatically
✅ **Image History**: 10 previous versions available for rollback
✅ **Notifications**: Team notified of deployment status
✅ **Monitoring**: Hourly health checks detect outages
✅ **Security**: SSH keys secure, secrets not logged
✅ **Documentation**: Team can deploy and rollback confidently
✅ **Testing**: All test scenarios pass

---

## Next Steps

After reading this summary:

1. **Review detailed docs**:
   - Read CICD_IMPLEMENTATION_PLAN.md for step-by-step instructions
   - Bookmark ROLLBACK_PROCEDURES.md for emergencies
   - Keep CICD_TESTING_GUIDE.md handy during implementation

2. **Start implementation**:
   - Follow Phase 1: GitHub Setup
   - Work through phases sequentially
   - Test thoroughly after each phase

3. **Get support**:
   - Create GitHub issues for questions
   - Document learnings as you go
   - Update docs with any new scenarios

---

## Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **GHCR Docs**: https://docs.github.com/en/packages
- **Discord Webhook Docs**: https://discord.com/developers/docs/resources/webhook

---

## Questions?

If you need help:

1. Check troubleshooting sections in ROLLBACK_PROCEDURES.md
2. Review CICD_TESTING_GUIDE.md for test scenarios
3. Check server logs: `/var/log/bcflame/`
4. Review GitHub Actions workflow logs
5. Create GitHub issue with detailed information

---

**Document Version**: 1.0
**Last Updated**: 2026-02-07
**Author**: Claude (Anthropic)
**Project**: BC Flame CI/CD Implementation
