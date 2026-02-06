# Phase 4: GitHub Actions Setup Guide

This guide walks you through setting up GitHub Actions for automated CI/CD deployment.

## Prerequisites

✅ Phase 1 complete (GitHub secrets configured)
✅ Phase 2.1 complete (Server setup with scripts)
✅ Phase 3 complete (Deployment scripts created)

## Overview

Two workflows have been created:

1. **`deploy.yml`** - Main CI/CD pipeline (runs on push to master)
2. **`test.yml`** - Test runner (runs on PRs and feature branches)

## Step 1: Configure GitHub Repository Settings

### 1.1 Enable GitHub Actions

1. Go to: **Repository → Settings → Actions → General**
2. Under "Actions permissions":
   - Select: ✅ "Allow all actions and reusable workflows"
3. Under "Workflow permissions":
   - Select: ✅ "Read and write permissions"
   - Check: ✅ "Allow GitHub Actions to create and approve pull requests"
4. Click **Save**

### 1.2 Configure GitHub Container Registry

The `GITHUB_TOKEN` automatically has package permissions, but you need to ensure packages are accessible:

1. After first deployment, go to: **Repository → Packages**
2. Click on each package (bcflame-frontend, bcflame-backend)
3. Click **Package settings** (gear icon)
4. Scroll to "Danger Zone" → **Change visibility**
5. Select **Public** (recommended) or keep **Private**
6. If private, ensure your server's GHCR token has read access

## Step 2: Configure GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → Secrets**

### Required Secrets (if not already set)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | Contents of `~/.ssh/bcflame_deploy` |
| `SSH_HOST` | Server IP or hostname | `138.197.154.42` or `yourdomain.com` |
| `SSH_USER` | SSH username | `dev` or `ubuntu` |
| `SERVER_PROJECT_PATH` | Project directory on server | `/opt/bcflame` |

### New Secrets to Add

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_STRAPI_URL` | Backend API URL for production | `https://api.bcflame.online` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL for production | `https://bcflame.online` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `DISCORD_WEBHOOK` | Discord webhook URL for deployment notifications |

### How to Add Secrets

1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Enter name and value
4. Click **Add secret**

## Step 3: Verify Secrets Checklist

Before proceeding, verify these secrets are set:

```
✅ SSH_PRIVATE_KEY
✅ SSH_HOST
✅ SSH_USER
✅ SERVER_PROJECT_PATH
✅ NEXT_PUBLIC_STRAPI_URL
✅ NEXT_PUBLIC_SITE_URL
⬜ DISCORD_WEBHOOK (optional)
```

## Step 4: Understanding the Workflows

### Deploy Workflow (`deploy.yml`)

**Triggers:**
- Push to `master` branch
- Manual trigger via GitHub Actions UI

**Jobs:**
1. **Detect Changes** - Determines which services need deployment
2. **Test Frontend** - Runs linter, tests, and build check
3. **Test Backend** - Runs backend tests
4. **Build Frontend** - Builds and pushes Docker image to GHCR
5. **Build Backend** - Builds and pushes Docker image to GHCR
6. **Deploy** - SSHs to server and executes deployment
7. **Notify** - Sends Discord notification (if webhook configured)

**Change Detection:**
- Frontend changes: `frontend/**` files
- Backend changes: `backend/**` files
- Docker changes: `docker-compose.prod.yml`, `nginx/**`
- Deploys only what changed (faster deployments)

**Image Tags:**
- Commit SHA: `ghcr.io/username/bcflame-frontend:abc123...`
- Latest: `ghcr.io/username/bcflame-frontend:latest`

### Test Workflow (`test.yml`)

**Triggers:**
- Pull requests to `master`
- Push to feature branches

**Jobs:**
1. **Test Frontend** - Runs linter, tests, and coverage
2. **Test Backend** - Runs tests and coverage

## Step 5: First Deployment

### 5.1 Commit and Push Workflows

The workflow files are already created. Commit them:

```bash
git add .github/workflows/
git commit -m "feat(ci-cd): Add GitHub Actions workflows for automated deployment"
git push origin master
```

### 5.2 Monitor First Deployment

1. Go to: **Repository → Actions**
2. You should see "Deploy to Production" workflow running
3. Click on the workflow to see real-time logs
4. Monitor each job:
   - ✅ Detect Changes
   - ✅ Test Frontend
   - ✅ Test Backend
   - ✅ Build & Push Frontend
   - ✅ Build & Push Backend
   - ✅ Deploy to Server
   - ✅ Notify Discord (if configured)

### 5.3 Verify Deployment

After the workflow completes:

1. Check GitHub Actions shows ✅ green checkmark
2. Visit your production site: `https://bcflame.online`
3. Verify the site is working
4. SSH to server and check:
   ```bash
   ssh user@your-server
   cd /opt/bcflame
   cat .last_deploy_meta
   docker-compose -f docker-compose.prod.yml ps
   ```

## Step 6: Manual Deployment (Optional)

You can trigger deployments manually:

1. Go to: **Repository → Actions**
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch: `master`
5. Click **Run workflow**

## Step 7: Testing the Pipeline

### 7.1 Test Frontend Deployment

```bash
# Make a small change to frontend
echo "// Test deployment" >> frontend/src/app/page.tsx
git add frontend/src/app/page.tsx
git commit -m "test: Trigger frontend deployment"
git push origin master
```

Watch GitHub Actions:
- Should detect frontend changes only
- Will skip backend build
- Deploys only frontend service

### 7.2 Test Backend Deployment

```bash
# Make a small change to backend
echo "// Test deployment" >> backend/src/index.ts
git add backend/src/index.ts
git commit -m "test: Trigger backend deployment"
git push origin master
```

Watch GitHub Actions:
- Should detect backend changes only
- Will skip frontend build
- Deploys only backend service

### 7.3 Test Full Deployment

```bash
# Make changes to both
echo "// Test" >> frontend/src/app/page.tsx
echo "// Test" >> backend/src/index.ts
git add -A
git commit -m "test: Trigger full deployment"
git push origin master
```

Watch GitHub Actions:
- Should detect both changes
- Will build both images
- Deploys both services

## Workflow Features

### ✅ Smart Change Detection

Only builds and deploys what changed:
- Frontend changes → Deploy frontend only
- Backend changes → Deploy backend only
- Both changed → Deploy both
- Docker/nginx changes → Deploy both

### ✅ Concurrent Deployment Prevention

The `concurrency` setting ensures only one deployment runs at a time. If you push multiple commits quickly, they queue up.

### ✅ Automatic Rollback

If deployment verification fails, the workflow exits with error. You can then:
```bash
ssh user@server
cd /opt/bcflame
./scripts/rollback.sh
```

### ✅ Health Checks

The workflow runs `verify-deployment.sh` after deployment to ensure:
- Nginx is healthy
- Frontend is accessible
- Backend is responding
- Containers are running
- Integration works

### ✅ Build Caching

Uses GitHub Actions cache for faster builds:
- Node.js dependencies cached
- Docker layer caching enabled
- Subsequent builds ~2-3x faster

## Troubleshooting

### Deployment Failed: SSH Connection

**Error:** `Permission denied (publickey)`

**Solution:**
1. Verify `SSH_PRIVATE_KEY` secret is set correctly
2. Ensure the public key is in server's `~/.ssh/authorized_keys`
3. Test SSH manually:
   ```bash
   ssh -i ~/.ssh/bcflame_deploy user@server
   ```

### Deployment Failed: Docker Login

**Error:** `unauthorized: authentication required`

**Solution:**
1. Go to: Settings → Actions → General → Workflow permissions
2. Ensure "Read and write permissions" is selected
3. Re-run the workflow

### Deployment Failed: Image Pull

**Error:** `Error response from daemon: pull access denied`

**Solution:**
1. Verify GHCR token on server is valid:
   ```bash
   ssh user@server
   cat ~/.ghcr_token | docker login ghcr.io -u USERNAME --password-stdin
   ```
2. Ensure package visibility is Public or token has read access

### Build Failed: Tests

**Error:** Test suite fails

**Solution:**
1. Fix the tests locally first
2. Run tests before pushing:
   ```bash
   cd frontend && npm run test
   cd backend && npm run test
   ```
3. Push only after tests pass locally

### Deployment Successful but Site Not Working

**Check deployment logs:**
```bash
ssh user@server
cd /opt/bcflame
tail -50 /var/log/bcflame/deployments.log
docker-compose -f docker-compose.prod.yml logs -f
```

## Monitoring Deployments

### GitHub Actions

- **Actions tab**: See all workflow runs
- **Click workflow**: See detailed logs for each job
- **Re-run failed jobs**: Click "Re-run failed jobs" button

### Server Logs

```bash
# Deployment logs
tail -f /var/log/bcflame/deployments.log

# Container logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific container
docker logs bcflame_frontend_prod -f
docker logs bcflame_strapi_prod -f
```

### Discord Notifications (Optional)

If `DISCORD_WEBHOOK` is configured, you'll receive:
- ✅ Deployment success notifications
- ❌ Deployment failure alerts
- Commit info and author

## Advanced: Deployment Frequency

Expected deployment times:
- **Frontend only**: ~3-5 minutes
- **Backend only**: ~4-6 minutes
- **Both services**: ~6-8 minutes
- **First deployment**: ~10-12 minutes (no cache)

Downtime during deployment:
- **30-60 seconds** (container restart + warmup)

## Security Best Practices

✅ Never commit secrets to git
✅ Rotate SSH keys every 6-12 months
✅ Rotate GHCR tokens every 6-12 months
✅ Use strong SSH key (ed25519 or RSA 4096)
✅ Limit SSH key to deployment only (no shell access)
✅ Monitor deployment logs for suspicious activity
✅ Enable 2FA on GitHub account

## Next Steps

Once deployments are working:

1. **Set up branch protection**:
   - Go to: Settings → Branches → Add branch protection rule
   - Branch name: `master`
   - Enable: ✅ Require status checks to pass before merging
   - Select: ✅ Test Frontend, ✅ Test Backend

2. **Configure notifications**:
   - Set up Discord webhook for deployment alerts
   - Add Slack integration if needed

3. **Monitor costs**:
   - GitHub Actions: 2,000 minutes/month free (private repos)
   - GHCR: 500MB storage free, then $0.008/GB/day
   - Check usage: Settings → Billing

## Summary

Your CI/CD pipeline is now fully automated! 🎉

**On every push to master:**
1. ✅ Tests run automatically
2. ✅ Docker images build and push to GHCR
3. ✅ Server pulls new images
4. ✅ Deployment script runs
5. ✅ Health checks verify success
6. ✅ Discord notification sent (if configured)

**Expected workflow:**
- Developer pushes code → GitHub Actions tests → Builds images → Deploys to server → Site updates

**Phase 4 Complete!** 🚀
