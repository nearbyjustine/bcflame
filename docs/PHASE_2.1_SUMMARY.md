# Phase 2.1: Server Setup - Implementation Summary

## ✅ Completed Tasks

### 1. Created Deployment Scripts

All scripts are located in `/scripts/` and are executable:

- **`pull-images.sh`** - Pulls Docker images from GitHub Container Registry (GHCR)
  - Authenticates to GHCR using `~/.ghcr_token`
  - Supports fallback to `latest` tag if specific tag not found
  - Can pull `frontend`, `backend`, or `both` services

- **`deploy.sh`** - Main deployment script with blue-green strategy
  - Acquires deployment lock to prevent concurrent deployments
  - Validates environment variables
  - Triggers pre-deployment database backup
  - Pulls latest code from git
  - Pulls Docker images from GHCR
  - Runs database migrations
  - Deploys services with health checks (120s timeout)
  - Cleans up old images
  - Saves deployment metadata

- **`verify-deployment.sh`** - Post-deployment verification
  - Checks frontend, backend, and nginx health
  - Verifies container health status
  - Tests frontend → backend integration
  - Returns exit code 0 on success, 1 on failure

- **`rollback.sh`** - Automated rollback to previous deployment
  - Reverts code to previous commit
  - Pulls previous Docker images
  - Redeploys old version
  - Verifies rollback success

### 2. Updated docker-compose.prod.yml

Modified the production compose file to support GHCR images:

```yaml
strapi:
  image: ghcr.io/${GITHUB_USERNAME}/bcflame-backend:${IMAGE_TAG:-latest}
  build: ...
  pull_policy: always

frontend:
  image: ghcr.io/${GITHUB_USERNAME}/bcflame-frontend:${IMAGE_TAG:-latest}
  build: ...
  pull_policy: always
```

**Key features:**
- Uses `IMAGE_TAG` environment variable (overridden by deploy script)
- Keeps `build` context for local development
- `pull_policy: always` ensures latest images are used

### 3. Updated .env.example

Added CI/CD configuration variables:

```bash
# GitHub username for GHCR
GITHUB_USERNAME=YOUR_GITHUB_USERNAME

# Image tag (overridden by deploy script)
IMAGE_TAG=latest

# Discord webhook (optional)
DISCORD_WEBHOOK=
```

### 4. Created Documentation

- **`PHASE_2.1_SERVER_SETUP.md`** - Comprehensive setup guide for server configuration
  - Step-by-step instructions for server setup
  - GHCR authentication setup
  - Environment variable configuration
  - Verification checklist
  - Troubleshooting guide

## 📋 What You Need to Do on the Server

Follow the guide in `docs/PHASE_2.1_SERVER_SETUP.md`. Here's the quick checklist:

### On Your Server (Digital Ocean Droplet)

1. **SSH to your server**
   ```bash
   ssh user@your-server-ip
   cd /opt/bcflame  # or your project directory
   ```

2. **Create directories**
   ```bash
   sudo mkdir -p /var/log/bcflame
   sudo chown $USER:$USER /var/log/bcflame
   mkdir -p /tmp/bcflame
   ```

3. **Set up GHCR authentication**
   - Generate GitHub token at: https://github.com/settings/tokens/new
   - Scopes needed: `read:packages`, `write:packages`
   - Create `~/.ghcr_token` with format: `USERNAME:TOKEN`
   - Test: `cat ~/.ghcr_token | docker login ghcr.io -u USERNAME --password-stdin`

4. **Pull latest code**
   ```bash
   git pull origin master
   ```

5. **Update environment variables**
   - Edit `.env` file
   - Add `GITHUB_USERNAME=your_username`
   - Add `IMAGE_TAG=latest`

6. **Update scripts with your GitHub username**
   ```bash
   sed -i "s/YOUR_GITHUB_USERNAME/your_actual_username/g" scripts/pull-images.sh
   ```

7. **Create deployment markers**
   ```bash
   git rev-parse HEAD > .last_deploy
   cat > .last_deploy_meta <<EOF
   {
     "sha": "$(git rev-parse HEAD)",
     "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
     "branch": "$(git rev-parse --abbrev-ref HEAD)",
     "deployer": "manual"
   }
   EOF
   ```

8. **Verify setup**
   ```bash
   ./scripts/verify-deployment.sh
   ```

## 🎯 Expected Behavior

### Before First CI/CD Run

- ✅ Scripts exist and are executable
- ✅ GHCR authentication works
- ✅ `verify-deployment.sh` passes (existing deployment)
- ❌ `pull-images.sh` fails (no images in GHCR yet) - **This is expected!**

Images will be pushed to GHCR when you set up GitHub Actions (Phase 4).

### After First CI/CD Run

- ✅ Images exist in GHCR
- ✅ `pull-images.sh` succeeds
- ✅ `deploy.sh` successfully deploys
- ✅ `verify-deployment.sh` passes
- ✅ `rollback.sh` can revert to previous deployment

## 🔐 Security Notes

- `~/.ghcr_token` has restricted permissions (600) - only owner can read
- Never commit `.ghcr_token` to git
- Never commit production `.env` files
- Rotate GitHub token every 6-12 months
- Deployment lock prevents concurrent deployments
- Pre-deployment backups protect against data loss

## 📊 Deployment Flow

```
GitHub Actions (Push to master)
    ↓
Build & Push Images to GHCR
    ↓
SSH to Server
    ↓
Execute deploy.sh
    ├─ Acquire lock
    ├─ Validate environment
    ├─ Trigger backup
    ├─ Pull code
    ├─ Pull images (GHCR)
    ├─ Run migrations
    ├─ Deploy services
    │   ├─ Stop old container
    │   ├─ Remove old container
    │   ├─ Start new container
    │   └─ Wait for health check (120s)
    ├─ Cleanup old images
    └─ Save metadata
    ↓
Execute verify-deployment.sh
    ├─ Check frontend health
    ├─ Check backend health
    ├─ Check nginx health
    ├─ Check container health
    └─ Check integration
    ↓
✅ Deployment Complete (or ❌ Rollback on failure)
```

## 📁 File Changes Summary

### New Files
- `scripts/pull-images.sh` - Image pulling script
- `scripts/deploy.sh` - Main deployment script
- `scripts/verify-deployment.sh` - Verification script
- `scripts/rollback.sh` - Rollback script
- `docs/PHASE_2.1_SERVER_SETUP.md` - Setup guide
- `docs/PHASE_2.1_SUMMARY.md` - This file

### Modified Files
- `docker-compose.prod.yml` - Added GHCR image references
- `.env.example` - Added CI/CD configuration variables

### Files to Create on Server (not in git)
- `~/.ghcr_token` - GHCR authentication token
- `.last_deploy` - Current deployment commit SHA
- `.last_deploy_meta` - Current deployment metadata
- `/var/log/bcflame/` - Deployment logs directory
- `/tmp/bcflame/` - Deployment lock directory

## ✅ Ready for Next Phase

Once server setup is complete, you can proceed to:

**Phase 3** (Already done) - Server scripts ✅
**Phase 4** - GitHub Actions workflows

## Questions?

Refer to:
- `docs/PHASE_2.1_SERVER_SETUP.md` - Detailed setup instructions
- `docs/CICD_IMPLEMENTATION_PLAN.md` - Full CI/CD plan
- Scripts have inline comments explaining each step

**Phase 2.1 Complete!** 🎉 Ready for GitHub Actions setup.
