# CI/CD Testing Guide

## Overview

This document provides step-by-step instructions for testing the CI/CD pipeline before going live with production deployments.

---

## Pre-Testing Checklist

Before starting tests, ensure:

- [ ] All GitHub secrets configured (SSH_PRIVATE_KEY, SSH_HOST, etc.)
- [ ] Server scripts created and executable (`scripts/*.sh`)
- [ ] GitHub workflows created (`.github/workflows/*.yml`)
- [ ] docker-compose.prod.yml updated with GHCR image references
- [ ] GHCR authentication configured on server (`~/.ghcr_token`)
- [ ] Backup service is running and functional
- [ ] Current production site is stable

---

## Phase 1: Local Script Testing

Test deployment scripts locally on the server before integrating with GitHub Actions.

### Test 1: Verify Server Environment

```bash
# SSH to server
ssh user@your-server.com

# Verify project location
cd /opt/bcflame
pwd  # Should output: /opt/bcflame

# Verify git status
git status
git log --oneline -n 5

# Verify environment variables
source .env
echo "DB_PASSWORD set: ${DB_PASSWORD:+YES}"
echo "JWT_SECRET set: ${JWT_SECRET:+YES}"

# Verify Docker works
docker ps
docker-compose -f docker-compose.prod.yml ps

# All containers should be "Up" and healthy
```

**Expected Result**: ✅ All commands succeed, containers are running

### Test 2: Test Verification Script

```bash
cd /opt/bcflame

# Run verification
./scripts/verify-deployment.sh

# Should check:
# - Frontend (http://localhost:3000)
# - Backend (http://localhost:1337/_health)
# - Nginx (http://localhost/health)
# - Container health
# - Integration (frontend → backend)
```

**Expected Result**: ✅ All checks pass

**If fails**:
- Check container logs: `docker-compose -f docker-compose.prod.yml logs`
- Restart unhealthy containers
- Fix issues before proceeding

### Test 3: Test GHCR Authentication

```bash
cd /opt/bcflame

# Test authentication
cat ~/.ghcr_token | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Should see: "Login Succeeded"
```

**Expected Result**: ✅ Authentication succeeds

**If fails**:
- Verify `~/.ghcr_token` exists and has correct format: `USERNAME:TOKEN`
- Verify token has `read:packages` permission
- Regenerate token if needed at https://github.com/settings/tokens

### Test 4: Test Pull Images Script (Will Fail - Expected)

```bash
cd /opt/bcflame

# Attempt to pull images (will fail until first CI/CD push)
./scripts/pull-images.sh both latest

# Expected output:
# [INFO] Authenticating to GitHub Container Registry...
# [INFO] ✅ Authentication successful
# [INFO] Pulling image: ghcr.io/YOUR_USERNAME/bcflame-frontend:latest
# [ERROR] ❌ Failed to pull ghcr.io/YOUR_USERNAME/bcflame-frontend:latest
```

**Expected Result**: ⚠️ Authentication succeeds, image pull fails (no images yet)

**This is normal** - images don't exist until first CI/CD build.

---

## Phase 2: GitHub Actions Connectivity Testing

Test that GitHub Actions can connect to your server.

### Test 5: SSH Connection Test

Create a temporary test workflow to verify SSH connectivity:

```bash
# On your local machine
cd /path/to/bcflame
mkdir -p .github/workflows

# Create test workflow
cat > .github/workflows/test-ssh.yml << 'EOF'
name: Test SSH Connection

on:
  workflow_dispatch:

jobs:
  test-ssh:
    name: Test SSH to Server
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Test SSH connection
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'ENDSSH'
            echo "✅ SSH connection successful!"
            echo "Hostname: $(hostname)"
            echo "User: $(whoami)"
            echo "Project path: ${{ secrets.SERVER_PROJECT_PATH }}"
            cd ${{ secrets.SERVER_PROJECT_PATH }}
            pwd
            ls -la
            echo "✅ Project directory accessible!"
          ENDSSH
EOF

# Commit and push
git add .github/workflows/test-ssh.yml
git commit -m "test: Add SSH connection test workflow"
git push origin master
```

**Run the test**:
1. Go to GitHub → Actions tab
2. Click "Test SSH Connection" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait for completion (30 seconds)

**Expected Result**: ✅ Workflow succeeds, shows server info

**If fails**:
- Check GitHub secrets are set correctly
- Verify SSH key matches public key on server
- Check SSH_HOST is correct (IP or domain)
- Verify SSH_USER has permissions to project directory

### Test 6: Test GHCR Push (First Build)

Trigger a test build to push images to GHCR:

```bash
# On your local machine
cd /path/to/bcflame

# Make a small, safe change to trigger CI
echo "# CI/CD Test - $(date)" >> README.md

# Commit with [both] flag to build both images
git add README.md
git commit -m "[both] test: Trigger first CI/CD build"
git push origin master
```

**Monitor the workflow**:
1. Go to GitHub → Actions tab
2. Click on the running "Deploy to Production" workflow
3. Watch each job:
   - ✅ detect-changes - Should detect "both" services
   - ✅ test-frontend - Should run and pass
   - ✅ test-backend - Should run and pass
   - ✅ build-frontend - Should build and push image
   - ✅ build-backend - Should build and push image
   - ⏸️ deploy - Will run but may fail (first time)

**Expected Result**: ✅ Tests pass, images build and push successfully

**Verify images were pushed**:
1. Go to GitHub → Packages tab (in your profile or repo)
2. Should see: `bcflame-frontend` and `bcflame-backend` packages
3. Click each package → should see tags: `latest`, commit SHA, `master`

**If build fails**:
- Check workflow logs for errors
- Common issues:
  - Build context errors → Verify Dockerfile paths
  - Test failures → Fix failing tests first
  - Package permissions → Check repository settings

---

## Phase 3: End-to-End Deployment Testing

Now test the complete deployment pipeline.

### Test 7: First Production Deployment

With images successfully built, test actual deployment:

```bash
# Option A: Let automatic deployment run (if previous push didn't deploy)
# Just wait for the workflow to complete

# Option B: Trigger manual deployment
# Go to GitHub → Actions → Deploy to Production → Run workflow
# Select service: "both"
# Click "Run workflow"
```

**Watch the deployment**:
1. Monitor GitHub Actions workflow
2. Should see:
   - ✅ SSH connection succeeds
   - ✅ Deploy script runs
   - ✅ Containers restart
   - ✅ Verification passes

**Monitor on server** (in separate terminal):
```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Watch deployment log
tail -f /var/log/bcflame/deployments.log

# Watch container status
watch -n 2 'docker-compose -f docker-compose.prod.yml ps'
```

**Expected Result**: ✅ Deployment completes successfully, site remains accessible

**If deployment fails**:
- Check deployment logs: `tail -100 /var/log/bcflame/deployments.log`
- Check container logs: `docker-compose -f docker-compose.prod.yml logs`
- Check for deployment lock: `ls -la /tmp/bcflame/deploy.lock`
- Verify images were pulled: `docker images | grep bcflame`

### Test 8: Verify Post-Deployment

After successful deployment, verify everything works:

```bash
# On server
cd /opt/bcflame

# Run verification script
./scripts/verify-deployment.sh

# Check deployment metadata
cat .last_deploy_meta

# Should show recent deployment with GitHub Actions deployer
```

**Manual verification checklist**:
- [ ] Site loads at production URL
- [ ] Can log in to admin panel
- [ ] Products page loads
- [ ] Orders page loads
- [ ] Media hub loads
- [ ] Backend API responds: `curl https://api.yourdomain.com/_health`
- [ ] No errors in browser console
- [ ] No errors in container logs

**Expected Result**: ✅ All checks pass, site fully functional

---

## Phase 4: Selective Deployment Testing

Test that the change detection works correctly.

### Test 9: Frontend-Only Deployment

```bash
# Make frontend-only change
cd /path/to/bcflame
echo "// Frontend test - $(date)" >> frontend/src/app/page.tsx

git add frontend/
git commit -m "[frontend] test: Test frontend-only deployment"
git push origin master
```

**Expected behavior**:
- ✅ Only frontend tests run
- ✅ Only frontend image builds
- ✅ Only frontend container restarts
- ✅ Backend remains untouched

**Verify**:
- Check Actions tab → Only frontend jobs ran
- Check server: `docker-compose -f docker-compose.prod.yml ps` → backend uptime unchanged

### Test 10: Backend-Only Deployment

```bash
# Make backend-only change
echo "// Backend test - $(date)" >> backend/src/index.ts

git add backend/
git commit -m "[backend] test: Test backend-only deployment"
git push origin master
```

**Expected behavior**:
- ✅ Only backend tests run
- ✅ Only backend image builds
- ✅ Only backend container restarts
- ✅ Frontend remains untouched

### Test 11: Auto-Detect Changes (No Flags)

```bash
# Make change without commit flag
echo "// Auto-detect test" >> frontend/README.md

git add frontend/
git commit -m "test: Test automatic change detection"
git push origin master
```

**Expected behavior**:
- ✅ Workflow auto-detects frontend changes
- ✅ Only frontend deploys

---

## Phase 5: Rollback Testing

Test that rollback procedures work correctly.

### Test 12: Manual Rollback via GitHub Actions

```bash
# First, note current commit
git log --oneline -n 1
# Example output: abc123d test: Current version

# Get previous commit SHA
git log --oneline -n 2 | tail -n 1
# Example output: def456e test: Previous version
```

**Trigger rollback**:
1. Go to GitHub → Actions → "Rollback Deployment"
2. Click "Run workflow"
3. Leave commit SHA empty (rolls back to previous)
4. Click "Run workflow"

**Expected behavior**:
- ✅ Workflow runs successfully
- ✅ Site reverts to previous version
- ✅ Verification passes

**Verify rollback worked**:
```bash
# On server
cd /opt/bcflame

# Check current commit
git log --oneline -n 1
# Should show previous commit

# Check rollback log
tail -50 /var/log/bcflame/rollback.log
```

### Test 13: Automatic Rollback on Failure

Simulate a deployment failure to test automatic rollback:

```bash
# Create a breaking change that will fail health checks
cd /path/to/bcflame

# Temporarily break the backend health check
cat > backend/src/api/broken/routes/broken.ts << 'EOF'
export default {
  routes: [
    {
      method: 'GET',
      path: '/_health',
      handler: 'broken.fail',
    },
  ],
};
EOF

git add backend/
git commit -m "[backend] test: Simulate deployment failure"
git push origin master
```

**Expected behavior**:
- ✅ Backend builds and deploys
- ❌ Health check fails
- ✅ Automatic rollback triggers
- ✅ Site returns to previous working version
- 📧 Discord notification sent (if configured)

**Cleanup**:
```bash
# Remove the breaking change
git revert HEAD
git push origin master
```

### Test 14: Manual Rollback via SSH

```bash
# SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Trigger manual rollback
./scripts/rollback.sh

# Should see:
# - Code reverted
# - Images pulled
# - Containers restarted
# - Verification passed

# Verify
./scripts/verify-deployment.sh
```

**Expected Result**: ✅ Rollback completes successfully

---

## Phase 6: Monitoring Testing

Test the health check and notification systems.

### Test 15: Health Check Workflow

```bash
# Manually trigger health check
# Go to GitHub → Actions → "Health Check" → Run workflow
```

**Expected behavior**:
- ✅ Checks frontend (200 response)
- ✅ Checks backend (200 response)
- ✅ Checks nginx (200 response)
- ✅ Workflow succeeds

### Test 16: Discord Notifications (If Configured)

```bash
# Trigger a deployment to test notification
echo "// Notification test" >> README.md
git add README.md
git commit -m "[both] test: Test Discord notification"
git push origin master
```

**Expected behavior**:
- ✅ Deployment completes
- ✅ Discord message appears in configured channel
- Message includes:
  - Deployment status (✅ success)
  - Service deployed
  - Commit SHA
  - Branch name
  - Author

**Test failure notification**:
- Temporarily break health check
- Watch for red ❌ notification in Discord

---

## Phase 7: Edge Cases Testing

Test unusual scenarios and edge cases.

### Test 17: Concurrent Deployment Prevention

```bash
# Terminal 1: SSH to server
ssh user@your-server.com
cd /opt/bcflame

# Start a long-running "deployment" (fake it)
touch /tmp/bcflame/deploy.lock
sleep 300 &  # Keeps lock for 5 minutes

# Terminal 2: Try to deploy from GitHub Actions
# Go to GitHub → Actions → Deploy → Run workflow
```

**Expected behavior**:
- ❌ Deployment fails with "lock file exists" error
- ✅ No containers are affected
- 📧 Notification shows failure

**Cleanup**:
```bash
# Remove lock
rm /tmp/bcflame/deploy.lock
```

### Test 18: Network Interruption During Deployment

This is hard to test safely in production. Document the expected behavior:

**If network fails during deployment**:
- Deployment will timeout and fail
- Containers may be in intermediate state
- Manual intervention required to fix
- Always have recent backup ready

**Recovery procedure**:
```bash
# SSH to server (once network restored)
cd /opt/bcflame

# Check container status
docker-compose -f docker-compose.prod.yml ps

# If containers are down
docker-compose -f docker-compose.prod.yml up -d

# If deployment lock exists
rm -f /tmp/bcflame/deploy.lock

# Trigger rollback
./scripts/rollback.sh
```

### Test 19: Database Migration During Deployment

```bash
# Create a simple database migration
cd /path/to/bcflame/backend

# (If Strapi supports migrations)
# npm run strapi migration:create test-migration

# Deploy
git add backend/
git commit -m "[backend] test: Test database migration"
git push origin master
```

**Expected behavior**:
- ✅ Pre-deployment backup runs
- ✅ Migration executes before container restart
- ✅ Deployment succeeds
- ✅ Database schema updated

**If migration fails**:
- ❌ Deployment should stop
- ✅ Automatic rollback triggers
- ✅ Database restored from backup

---

## Testing Checklist

After completing all tests, verify:

### Deployment Pipeline
- [ ] Automatic deployments work on push to master
- [ ] Manual deployments work via workflow_dispatch
- [ ] Change detection correctly identifies modified services
- [ ] Only changed services are rebuilt and deployed
- [ ] Frontend-only deployments work
- [ ] Backend-only deployments work
- [ ] Tests run automatically and block deployment on failure

### Image Management
- [ ] Images build correctly
- [ ] Images push to GHCR successfully
- [ ] Images are tagged with commit SHA, latest, and branch
- [ ] Images can be pulled on server
- [ ] Old images are cleaned up weekly

### Deployment Process
- [ ] Pre-deployment backup runs successfully
- [ ] Database migrations execute (if applicable)
- [ ] Containers restart without errors
- [ ] Health checks pass within 120 seconds
- [ ] Site remains accessible (30-60 second downtime acceptable)
- [ ] Environment variables are validated
- [ ] Deployment locks prevent concurrent deployments

### Rollback Procedures
- [ ] Automatic rollback works on verification failure
- [ ] Manual rollback via GitHub Actions works
- [ ] Manual rollback via SSH works
- [ ] Rollback to previous deployment works
- [ ] Rollback to specific commit works
- [ ] Verification runs after rollback

### Monitoring & Notifications
- [ ] Health checks run hourly
- [ ] Health check failures are detected
- [ ] Discord notifications work (if configured)
- [ ] Deployment logs are written correctly
- [ ] Rollback logs are written correctly

### Security
- [ ] SSH connection is secure (key-based)
- [ ] GHCR authentication works
- [ ] Secrets are not exposed in logs
- [ ] Deployment lock prevents race conditions

---

## Common Testing Issues

### Issue: Tests fail locally but pass in CI

**Cause**: Environment differences

**Solution**:
- Check Node.js version matches CI (18.x)
- Run `npm ci` instead of `npm install`
- Check for OS-specific issues

### Issue: Image build fails

**Cause**: Dockerfile errors, missing dependencies

**Solution**:
- Test build locally: `docker build -f frontend/Dockerfile frontend`
- Check Dockerfile FROM statement
- Verify all dependencies in package.json

### Issue: Containers won't start

**Cause**: Environment variables missing, port conflicts

**Solution**:
- Check .env file on server
- Verify no port conflicts: `netstat -tulpn | grep -E '3000|1337|80|443'`
- Check logs: `docker-compose -f docker-compose.prod.yml logs`

### Issue: Health checks never pass

**Cause**: Containers taking too long to start, actual errors

**Solution**:
- Increase health check timeout
- Check container logs for startup errors
- Verify database is accessible
- Check network connectivity between containers

---

## Post-Testing Cleanup

After testing is complete:

```bash
# Remove test workflow
git rm .github/workflows/test-ssh.yml
git commit -m "chore: Remove test SSH workflow"
git push origin master

# Clean up test commits (optional)
# git rebase -i HEAD~10  # Interactive rebase to squash test commits

# Verify production is clean and stable
curl https://yourdomain.com
curl https://api.yourdomain.com/_health
```

---

## Ready for Production?

You're ready to use the CI/CD pipeline in production when:

- ✅ All tests in this guide pass
- ✅ Rollback procedures tested and work
- ✅ Team is trained on procedures
- ✅ Documentation is complete
- ✅ Discord notifications configured (optional)
- ✅ Backup service is working
- ✅ Monitoring is in place

---

## Next Steps

1. **Train the team** on CI/CD procedures
2. **Document exceptions** (when to skip CI/CD and deploy manually)
3. **Set up alerts** for failed deployments
4. **Schedule regular testing** of rollback procedures (quarterly)
5. **Monitor and improve** based on real usage
