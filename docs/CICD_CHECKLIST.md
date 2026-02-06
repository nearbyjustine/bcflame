# CI/CD Implementation Checklist

Use this checklist to track your progress through the CI/CD implementation.

---

## Pre-Implementation

- [ ] Read CICD_SUMMARY.md (overview)
- [ ] Read CICD_IMPLEMENTATION_PLAN.md (detailed guide)
- [ ] Skim ROLLBACK_PROCEDURES.md (emergency reference)
- [ ] Skim CICD_TESTING_GUIDE.md (test procedures)
- [ ] Verify production site is stable and has recent backups
- [ ] Schedule implementation time (plan for 7-10 days)
- [ ] Notify team of upcoming CI/CD implementation

---

## Phase 1: GitHub Setup ✅

### GitHub Secrets Configuration

- [ ] Generate SSH key pair for deployment (`ssh-keygen`)
- [ ] Add public key to server (`ssh-copy-id`)
- [ ] Add SSH_PRIVATE_KEY to GitHub secrets (entire private key file)
- [ ] Add SSH_HOST to GitHub secrets (server IP or hostname)
- [ ] Add SSH_USER to GitHub secrets (e.g., `ubuntu`)
- [ ] Add SERVER_PROJECT_PATH to GitHub secrets (e.g., `/opt/bcflame`)
- [ ] Add NEXT_PUBLIC_STRAPI_URL to GitHub secrets (e.g., `https://api.yourdomain.com`)
- [ ] Add NEXT_PUBLIC_SITE_URL to GitHub secrets (e.g., `https://yourdomain.com`)
- [ ] Verify all secrets are visible in Settings → Secrets → Actions

### GitHub Container Registry (GHCR)

- [ ] Go to Settings → Actions → General
- [ ] Set "Workflow permissions" to "Read and write permissions"
- [ ] Click "Save"
- [ ] Verify GITHUB_TOKEN has package permissions (automatic)

### Discord Webhook (Optional)

- [ ] Open Discord → Server Settings → Integrations → Webhooks
- [ ] Create new webhook named "BCFlame CI/CD"
- [ ] Select channel (#deployments)
- [ ] Copy webhook URL
- [ ] Add DISCORD_WEBHOOK to GitHub secrets
- [ ] Test webhook with curl command
- [ ] **OR** Skip this step (notifications will be disabled)

---

## Phase 2: Server Setup ✅

### Prepare Server Environment

- [ ] SSH to Digital Ocean droplet
- [ ] Navigate to project directory (`cd /opt/bcflame`)
- [ ] Verify git status (`git status`)
- [ ] Create scripts directory (`mkdir -p scripts`)
- [ ] Create logs directory (`sudo mkdir -p /var/log/bcflame && sudo chown $USER:$USER /var/log/bcflame`)
- [ ] Create deployment lock directory (`mkdir -p /tmp/bcflame`)
- [ ] Verify Docker is installed (`docker --version`)
- [ ] Verify Docker Compose is installed (`docker-compose --version`)
- [ ] Add user to docker group (`sudo usermod -aG docker $USER && newgrp docker`)
- [ ] Test Docker without sudo (`docker ps`)
- [ ] Verify production containers running (`docker-compose -f docker-compose.prod.yml ps`)

### GHCR Authentication

- [ ] Generate GitHub personal access token with `read:packages` and `write:packages` scopes
- [ ] Create token file on server (`nano ~/.ghcr_token`)
- [ ] Add token in format: `USERNAME:TOKEN`
- [ ] Save and secure file (`chmod 600 ~/.ghcr_token`)
- [ ] Test GHCR login (`cat ~/.ghcr_token | docker login ghcr.io -u USERNAME --password-stdin`)
- [ ] Verify "Login Succeeded" message

### Update docker-compose.prod.yml

- [ ] Back up original file (`cp docker-compose.prod.yml docker-compose.prod.yml.backup`)
- [ ] Edit docker-compose.prod.yml (`nano docker-compose.prod.yml`)
- [ ] Update frontend service with GHCR image reference
- [ ] Update strapi service with GHCR image reference
- [ ] Add `pull_policy: always` to both services
- [ ] Replace `YOUR_GITHUB_USERNAME` with actual username
- [ ] Save file
- [ ] Verify syntax (`docker-compose -f docker-compose.prod.yml config`)

### Create Deployment Markers

- [ ] Create initial deployment marker (`git rev-parse HEAD > .last_deploy`)
- [ ] Create deployment metadata file (see implementation plan)
- [ ] Verify files created (`ls -la .last_deploy*`)

### Verify Environment Variables

- [ ] Check .env file exists (`ls -la .env`)
- [ ] Verify all required variables are set (DB_PASSWORD, JWT_SECRET, etc.)
- [ ] Add any missing variables
- [ ] Test environment loading (`bash -c 'source .env && : ${DB_PASSWORD:?}'`)

---

## Phase 3: Create Server Scripts ✅

### Create pull-images.sh

- [ ] Create file (`nano scripts/pull-images.sh`)
- [ ] Copy script content from CICD_IMPLEMENTATION_PLAN.md
- [ ] Update GITHUB_USERNAME in script
- [ ] Save file
- [ ] Make executable (`chmod +x scripts/pull-images.sh`)
- [ ] Test script (will fail, that's expected): `./scripts/pull-images.sh both latest`

### Create deploy.sh

- [ ] Create file (`nano scripts/deploy.sh`)
- [ ] Copy script content from CICD_IMPLEMENTATION_PLAN.md
- [ ] Save file
- [ ] Make executable (`chmod +x scripts/deploy.sh`)
- [ ] Review script contents
- [ ] **DO NOT test yet** (wait until images are built)

### Create verify-deployment.sh

- [ ] Create file (`nano scripts/verify-deployment.sh`)
- [ ] Copy script content from CICD_IMPLEMENTATION_PLAN.md
- [ ] Save file
- [ ] Make executable (`chmod +x scripts/verify-deployment.sh`)
- [ ] Test script (should pass): `./scripts/verify-deployment.sh`

### Create rollback.sh

- [ ] Create file (`nano scripts/rollback.sh`)
- [ ] Copy script content from CICD_IMPLEMENTATION_PLAN.md
- [ ] Save file
- [ ] Make executable (`chmod +x scripts/rollback.sh`)
- [ ] Review script contents
- [ ] **DO NOT test yet** (will be tested after first deployment)

### Verify All Scripts

- [ ] Check all scripts exist: `ls -la scripts/`
- [ ] Verify all are executable: `ls -l scripts/*.sh | grep -v 'x'` (should be empty)
- [ ] Review each script for any hardcoded values that need updating

---

## Phase 4: Create GitHub Workflows ✅

### Create Workflows Directory

- [ ] On local machine, navigate to project
- [ ] Create workflows directory (`mkdir -p .github/workflows`)

### Create deploy.yml

- [ ] Create file (`nano .github/workflows/deploy.yml`)
- [ ] Copy workflow content from CICD_WORKFLOWS.md
- [ ] Replace placeholders (YOUR_USERNAME, repository URLs, etc.)
- [ ] Save file
- [ ] Verify YAML syntax (use yamllint or online validator)

### Create health-check.yml

- [ ] Create file (`nano .github/workflows/health-check.yml`)
- [ ] Copy workflow content from CICD_WORKFLOWS.md
- [ ] Replace placeholders if any
- [ ] Save file

### Create rollback.yml

- [ ] Create file (`nano .github/workflows/rollback.yml`)
- [ ] Copy workflow content from CICD_WORKFLOWS.md
- [ ] Replace placeholders if any
- [ ] Save file

### Create cleanup-images.yml

- [ ] Create file (`nano .github/workflows/cleanup-images.yml`)
- [ ] Copy workflow content from CICD_WORKFLOWS.md
- [ ] Replace placeholders if any
- [ ] Save file

### Commit and Push Workflows

- [ ] Review all workflow files
- [ ] Commit workflows (`git add .github/workflows/ && git commit -m "feat: Add CI/CD workflows"`)
- [ ] Push to master (`git push origin master`)
- [ ] Verify workflows appear in GitHub → Actions tab

---

## Phase 5: Testing ✅

### Test 1: Server Environment (CICD_TESTING_GUIDE.md)

- [ ] Verify project location
- [ ] Verify git status
- [ ] Verify environment variables
- [ ] Verify Docker works
- [ ] Verify containers are running

### Test 2: Verification Script

- [ ] Run `./scripts/verify-deployment.sh`
- [ ] All checks should pass
- [ ] Fix any failures before proceeding

### Test 3: GHCR Authentication

- [ ] Test Docker login to GHCR
- [ ] Verify "Login Succeeded" message

### Test 4: Pull Images Script

- [ ] Run `./scripts/pull-images.sh both latest`
- [ ] Should fail (no images yet) - this is expected
- [ ] Verify authentication succeeds

### Test 5: SSH Connection Test

- [ ] Create test-ssh.yml workflow (see CICD_TESTING_GUIDE.md)
- [ ] Commit and push
- [ ] Go to GitHub → Actions → Test SSH Connection
- [ ] Run workflow manually
- [ ] Verify workflow succeeds and shows server info
- [ ] Delete test workflow after success

### Test 6: First Build (Push Images to GHCR)

- [ ] Make small change (e.g., update README.md)
- [ ] Commit with `[both]` flag
- [ ] Push to master
- [ ] Monitor GitHub Actions workflow
- [ ] Verify tests run and pass
- [ ] Verify images build successfully
- [ ] Verify images pushed to GHCR
- [ ] Go to GitHub → Packages tab
- [ ] Verify `bcflame-frontend` and `bcflame-backend` packages exist
- [ ] Click each package and verify tags (latest, SHA, master)

### Test 7: First Production Deployment

- [ ] Monitor GitHub Actions for deployment job
- [ ] In separate terminal, SSH to server and watch logs (`tail -f /var/log/bcflame/deployments.log`)
- [ ] Watch deployment progress
- [ ] Verify deployment completes successfully
- [ ] Verify site remains accessible
- [ ] Run manual verification (`./scripts/verify-deployment.sh`)

### Test 8: Verify Post-Deployment

- [ ] Site loads at production URL
- [ ] Can log in to admin panel
- [ ] Products page loads
- [ ] Orders page loads
- [ ] Media hub loads
- [ ] Backend API responds (curl health endpoint)
- [ ] No errors in browser console
- [ ] No errors in container logs
- [ ] Check deployment metadata (`cat .last_deploy_meta`)

### Test 9: Frontend-Only Deployment

- [ ] Make frontend-only change
- [ ] Commit with `[frontend]` flag
- [ ] Push to master
- [ ] Verify only frontend jobs run
- [ ] Verify only frontend container restarts
- [ ] Verify backend uptime unchanged

### Test 10: Backend-Only Deployment

- [ ] Make backend-only change
- [ ] Commit with `[backend]` flag
- [ ] Push to master
- [ ] Verify only backend jobs run
- [ ] Verify only backend container restarts
- [ ] Verify frontend uptime unchanged

### Test 11: Auto-Detect Changes

- [ ] Make change without commit flag
- [ ] Commit and push
- [ ] Verify workflow auto-detects changed service
- [ ] Verify correct service deploys

### Test 12: Manual Rollback via GitHub Actions

- [ ] Note current commit SHA
- [ ] Go to GitHub → Actions → Rollback Deployment
- [ ] Run workflow (leave commit SHA empty)
- [ ] Verify rollback completes
- [ ] Verify site reverted to previous version
- [ ] Check rollback logs on server

### Test 13: Automatic Rollback on Failure

- [ ] Create a change that will fail health checks (see CICD_TESTING_GUIDE.md)
- [ ] Commit and push
- [ ] Monitor deployment
- [ ] Verify deployment fails
- [ ] Verify automatic rollback triggers
- [ ] Verify site returns to working version
- [ ] Check Discord notification (if configured)
- [ ] Revert breaking change

### Test 14: Manual Rollback via SSH

- [ ] SSH to server
- [ ] Run `./scripts/rollback.sh`
- [ ] Verify rollback succeeds
- [ ] Run verification script

### Test 15: Health Check Workflow

- [ ] Go to GitHub → Actions → Health Check
- [ ] Run workflow manually
- [ ] Verify all health checks pass

### Test 16: Discord Notifications (If Configured)

- [ ] Trigger a deployment
- [ ] Verify Discord message appears
- [ ] Check message includes all details (commit, author, status, etc.)
- [ ] Trigger a failure (optional)
- [ ] Verify failure notification appears

### Test 17: Concurrent Deployment Prevention

- [ ] On server, create lock file (`touch /tmp/bcflame/deploy.lock`)
- [ ] Trigger deployment from GitHub
- [ ] Verify deployment fails with "lock file exists" error
- [ ] Remove lock file (`rm /tmp/bcflame/deploy.lock`)

---

## Phase 6: Documentation ✅

### Review Documentation

- [ ] Review CICD_SUMMARY.md
- [ ] Review CICD_IMPLEMENTATION_PLAN.md
- [ ] Review ROLLBACK_PROCEDURES.md
- [ ] Review CICD_TESTING_GUIDE.md
- [ ] Review CICD_WORKFLOWS.md

### Update Documentation (If Needed)

- [ ] Document any deviations from plan
- [ ] Add any additional troubleshooting scenarios encountered
- [ ] Update environment-specific details (domain names, paths, etc.)

### Create Team Documentation

- [ ] Create quick reference guide for team
- [ ] Document deployment schedule/policy
- [ ] Document who can approve/deploy
- [ ] Document emergency contacts

---

## Phase 7: Monitoring & Alerts ✅

### Configure Scheduled Health Checks

- [ ] Verify health-check.yml workflow is enabled
- [ ] Verify cron schedule is correct (`0 * * * *` = every hour)
- [ ] Manually trigger health check to test
- [ ] Verify workflow succeeds

### Configure GitHub Notifications

- [ ] Go to GitHub → Settings (profile) → Notifications → Actions
- [ ] Enable "Workflow run failures on master"
- [ ] Configure email/mobile for critical alerts
- [ ] Test by triggering a failure

### Test Failure Notifications

- [ ] Temporarily break a health check (change URL to invalid)
- [ ] Wait for next hourly run (or trigger manually)
- [ ] Verify health check workflow fails
- [ ] Verify GitHub sends failure notification
- [ ] Verify Discord sends failure notification (if configured)
- [ ] Fix health check

### Set Up Additional Monitoring (Optional)

- [ ] Set up UptimeRobot for 5-minute checks
- [ ] Configure Sentry for error tracking (already installed per git log)
- [ ] Set up Grafana/Prometheus for metrics (advanced, optional)

---

## Phase 8: Cleanup & Finalization ✅

### Remove Test Artifacts

- [ ] Delete test-ssh.yml workflow (if created)
- [ ] Remove any test commits (optional, via rebase)
- [ ] Clean up test files/changes
- [ ] Verify production is clean and stable

### Verify Final State

- [ ] All workflows passing in GitHub Actions
- [ ] Site accessible at production URL
- [ ] All features working correctly
- [ ] Deployment logs clean (`/var/log/bcflame/deployments.log`)
- [ ] No errors in container logs
- [ ] Health checks passing
- [ ] Backup service working
- [ ] Discord notifications working (if configured)

### Backup Critical Files

- [ ] Backup server .env file to secure location (password manager)
- [ ] Backup SSH keys to secure location
- [ ] Backup GHCR token to secure location
- [ ] Backup deployment scripts (already in git)
- [ ] Document backup locations

---

## Team Training ✅

### Train Team on Deployment

- [ ] Walk team through deployment process
- [ ] Show how to trigger manual deployments
- [ ] Explain commit message flags `[frontend]`, `[backend]`, `[both]`
- [ ] Demonstrate monitoring in GitHub Actions
- [ ] Show how to view deployment logs

### Train Team on Rollback

- [ ] Walk team through rollback procedures
- [ ] Show manual rollback via GitHub Actions
- [ ] Show manual rollback via SSH
- [ ] Explain when to rollback vs. fix forward
- [ ] Practice rollback procedure

### Train Team on Monitoring

- [ ] Show how to check health check workflow
- [ ] Show how to view deployment history
- [ ] Show how to access server logs
- [ ] Show how to check container status
- [ ] Explain Discord notifications (if configured)

### Train Team on Troubleshooting

- [ ] Review common issues in ROLLBACK_PROCEDURES.md
- [ ] Practice emergency recovery procedures
- [ ] Explain deployment lock mechanism
- [ ] Show how to clean up stuck deployments

---

## Post-Implementation ✅

### First Week Monitoring

- [ ] Monitor all deployments closely
- [ ] Check logs daily
- [ ] Verify health checks passing
- [ ] Address any issues immediately
- [ ] Document any new scenarios/issues

### First Month Review

- [ ] Review deployment metrics (frequency, duration, success rate)
- [ ] Gather team feedback
- [ ] Identify pain points
- [ ] Update documentation based on learnings
- [ ] Optimize workflows if needed

### Ongoing Maintenance

- [ ] Review and update docs quarterly
- [ ] Test rollback procedures quarterly
- [ ] Review GHCR storage usage monthly
- [ ] Update dependencies in workflows regularly
- [ ] Rotate SSH keys every 90 days (recommended)
- [ ] Review and update GitHub secrets annually

---

## Success Criteria ✅

Verify all success criteria are met:

- [ ] ✅ Automated Testing: Tests run on every PR and push
- [ ] ✅ Selective Builds: Only changed services rebuild
- [ ] ✅ Near-Zero Downtime: Site accessible during deployment (30-60s acceptable)
- [ ] ✅ Automatic Rollback: Failed deployments revert automatically
- [ ] ✅ Image History: 10 previous versions available for rollback
- [ ] ✅ Notifications: Team notified of deployment status
- [ ] ✅ Monitoring: Hourly health checks detect outages
- [ ] ✅ Security: SSH keys secure, secrets not logged
- [ ] ✅ Documentation: Team can deploy and rollback confidently
- [ ] ✅ Testing: All test scenarios pass

---

## Implementation Complete! 🎉

Once all items are checked:

- [ ] Create GitHub issue documenting completion
- [ ] Celebrate with team! 🎊
- [ ] Schedule post-implementation review (1 week)
- [ ] Monitor closely for first month
- [ ] Update this checklist with any lessons learned

---

## Notes & Issues

Use this space to track any issues, deviations, or notes during implementation:

```
Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________
________________________________________________________________
________________________________________________________________

Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________
________________________________________________________________
________________________________________________________________

Date: ___________
Issue: ___________________________________________________________
Resolution: _______________________________________________________
________________________________________________________________
________________________________________________________________
```

---

**Implementation Start Date**: _____________
**Implementation End Date**: _____________
**Total Duration**: _____________ days
**Implementer(s)**: _____________
**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Complete
