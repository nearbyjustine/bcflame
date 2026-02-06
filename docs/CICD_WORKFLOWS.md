# CI/CD GitHub Workflows - Phase 4

## Overview

This document contains the GitHub Actions workflow files that need to be created under `.github/workflows/` in your repository. These workflows implement the complete CI/CD pipeline with testing, building, deployment, monitoring, and rollback capabilities.

---

## Workflow 1: Main Deployment Pipeline

**File**: `.github/workflows/deploy.yml`

This is the primary workflow that runs on every push to master and handles the complete deployment pipeline.

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master
  workflow_dispatch:
    inputs:
      service:
        description: 'Service to deploy'
        required: true
        type: choice
        options:
          - both
          - frontend
          - backend
      force_deploy:
        description: 'Force deployment even if no changes detected'
        required: false
        type: boolean
        default: false

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}/bcflame

jobs:
  # Job 1: Detect what changed
  detect-changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      nginx: ${{ steps.filter.outputs.nginx }}
      any: ${{ steps.filter.outputs.any }}
      service: ${{ steps.determine-service.outputs.service }}
    steps:
      - uses: actions/checkout@v4

      - name: Check for change detection flags in commit message
        id: commit-flags
        run: |
          COMMIT_MSG="${{ github.event.head_commit.message }}"
          echo "Commit message: $COMMIT_MSG"

          if echo "$COMMIT_MSG" | grep -qi "\[frontend\]"; then
            echo "frontend=true" >> $GITHUB_OUTPUT
            echo "backend=false" >> $GITHUB_OUTPUT
          elif echo "$COMMIT_MSG" | grep -qi "\[backend\]"; then
            echo "frontend=false" >> $GITHUB_OUTPUT
            echo "backend=true" >> $GITHUB_OUTPUT
          elif echo "$COMMIT_MSG" | grep -qi "\[both\]"; then
            echo "frontend=true" >> $GITHUB_OUTPUT
            echo "backend=true" >> $GITHUB_OUTPUT
          else
            echo "frontend=" >> $GITHUB_OUTPUT
            echo "backend=" >> $GITHUB_OUTPUT
          fi

      - name: Detect file changes
        uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend:
              - 'frontend/**'
              - 'docker-compose.prod.yml'
              - '.github/workflows/deploy.yml'
            backend:
              - 'backend/**'
              - 'docker-compose.prod.yml'
              - '.github/workflows/deploy.yml'
            nginx:
              - 'nginx/**'
            any:
              - 'frontend/**'
              - 'backend/**'
              - 'docker-compose.prod.yml'
              - 'nginx/**'

      - name: Determine services to deploy
        id: determine-service
        run: |
          # Priority 1: Manual workflow dispatch
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            SERVICE="${{ github.event.inputs.service }}"
            echo "service=$SERVICE" >> $GITHUB_OUTPUT
            echo "Manual dispatch: deploying $SERVICE"
            exit 0
          fi

          # Priority 2: Commit message flags
          if [[ -n "${{ steps.commit-flags.outputs.frontend }}" ]] || [[ -n "${{ steps.commit-flags.outputs.backend }}" ]]; then
            if [[ "${{ steps.commit-flags.outputs.frontend }}" == "true" ]] && [[ "${{ steps.commit-flags.outputs.backend }}" == "true" ]]; then
              echo "service=both" >> $GITHUB_OUTPUT
              echo "Commit flag: deploying both"
            elif [[ "${{ steps.commit-flags.outputs.frontend }}" == "true" ]]; then
              echo "service=frontend" >> $GITHUB_OUTPUT
              echo "Commit flag: deploying frontend"
            else
              echo "service=backend" >> $GITHUB_OUTPUT
              echo "Commit flag: deploying backend"
            fi
            exit 0
          fi

          # Priority 3: File path changes
          if [[ "${{ steps.filter.outputs.frontend }}" == "true" ]] && [[ "${{ steps.filter.outputs.backend }}" == "true" ]]; then
            echo "service=both" >> $GITHUB_OUTPUT
            echo "Path detection: deploying both"
          elif [[ "${{ steps.filter.outputs.frontend }}" == "true" ]]; then
            echo "service=frontend" >> $GITHUB_OUTPUT
            echo "Path detection: deploying frontend"
          elif [[ "${{ steps.filter.outputs.backend }}" == "true" ]]; then
            echo "service=backend" >> $GITHUB_OUTPUT
            echo "Path detection: deploying backend"
          else
            echo "service=none" >> $GITHUB_OUTPUT
            echo "No changes detected"
          fi

  # Job 2: Test Frontend
  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.service == 'frontend' ||
      needs.detect-changes.outputs.service == 'both' ||
      github.event.inputs.force_deploy == 'true'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run tests
        working-directory: frontend
        run: npm run test

      - name: Run linter
        working-directory: frontend
        run: npm run lint

  # Job 3: Test Backend
  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.service == 'backend' ||
      needs.detect-changes.outputs.service == 'both' ||
      github.event.inputs.force_deploy == 'true'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run tests
        working-directory: backend
        run: npm run test

  # Job 4: Build and Push Frontend Image
  build-frontend:
    name: Build & Push Frontend
    runs-on: ubuntu-latest
    needs: [detect-changes, test-frontend]
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/master' &&
      (needs.detect-changes.outputs.service == 'frontend' ||
       needs.detect-changes.outputs.service == 'both' ||
       github.event.inputs.force_deploy == 'true')
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}-frontend
          tags: |
            type=raw,value=latest
            type=sha,prefix=,format=long
            type=ref,event=branch

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          target: production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_STRAPI_URL=${{ secrets.NEXT_PUBLIC_STRAPI_URL }}
            NEXT_PUBLIC_SITE_URL=${{ secrets.NEXT_PUBLIC_SITE_URL }}

  # Job 5: Build and Push Backend Image
  build-backend:
    name: Build & Push Backend
    runs-on: ubuntu-latest
    needs: [detect-changes, test-backend]
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/master' &&
      (needs.detect-changes.outputs.service == 'backend' ||
       needs.detect-changes.outputs.service == 'both' ||
       github.event.inputs.force_deploy == 'true')
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}-backend
          tags: |
            type=raw,value=latest
            type=sha,prefix=,format=long
            type=ref,event=branch

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          target: production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            PUBLIC_URL=${{ secrets.NEXT_PUBLIC_STRAPI_URL }}

  # Job 6: Deploy to Server
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [detect-changes, build-frontend, build-backend]
    if: |
      always() &&
      github.event_name == 'push' &&
      github.ref == 'refs/heads/master' &&
      needs.detect-changes.outputs.service != 'none' &&
      (needs.build-frontend.result == 'success' || needs.build-frontend.result == 'skipped') &&
      (needs.build-backend.result == 'success' || needs.build-backend.result == 'skipped')
    steps:
      - uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to server
        id: deploy
        run: |
          SERVICE="${{ needs.detect-changes.outputs.service }}"
          COMMIT_SHA="${{ github.sha }}"

          echo "Deploying service: $SERVICE"
          echo "Commit SHA: $COMMIT_SHA"

          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            set -e
            cd ${{ secrets.SERVER_PROJECT_PATH }}

            # Export environment variables
            export GITHUB_USERNAME="${{ github.repository_owner }}"
            export IMAGE_TAG="${{ github.sha }}"

            # Run deployment script
            ./scripts/deploy.sh "${{ needs.detect-changes.outputs.service }}" "${{ github.sha }}"
          EOF

      - name: Verify deployment
        id: verify
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            set -e
            cd ${{ secrets.SERVER_PROJECT_PATH }}
            ./scripts/verify-deployment.sh
          EOF

      - name: Rollback on failure
        if: failure() && steps.deploy.outcome == 'success'
        run: |
          echo "Deployment verification failed, rolling back..."
          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            set -e
            cd ${{ secrets.SERVER_PROJECT_PATH }}
            ./scripts/rollback.sh
          EOF

  # Job 7: Notify Discord
  notify:
    name: Send Notification
    runs-on: ubuntu-latest
    needs: [detect-changes, deploy]
    if: always() && github.ref == 'refs/heads/master'
    steps:
      - name: Send Discord notification
        if: secrets.DISCORD_WEBHOOK != ''
        run: |
          STATUS="${{ needs.deploy.result }}"
          SERVICE="${{ needs.detect-changes.outputs.service }}"

          # Determine color based on status
          if [[ "$STATUS" == "success" ]]; then
            COLOR="3066993"  # Green
            EMOJI="✅"
            TITLE="Deployment Successful"
          elif [[ "$STATUS" == "failure" ]]; then
            COLOR="15158332"  # Red
            EMOJI="❌"
            TITLE="Deployment Failed"
          else
            COLOR="16776960"  # Yellow
            EMOJI="⚠️"
            TITLE="Deployment $STATUS"
          fi

          # Prepare description
          DESCRIPTION="**Repository:** ${{ github.repository }}"
          DESCRIPTION="$DESCRIPTION\n**Service:** ${SERVICE}"
          DESCRIPTION="$DESCRIPTION\n**Commit:** \`${{ github.sha }}\`"
          DESCRIPTION="$DESCRIPTION\n**Branch:** ${{ github.ref_name }}"
          DESCRIPTION="$DESCRIPTION\n**Author:** ${{ github.actor }}"
          DESCRIPTION="$DESCRIPTION\n**Message:** ${{ github.event.head_commit.message }}"

          # Send webhook
          curl -X POST "${{ secrets.DISCORD_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"${EMOJI} ${TITLE}\",
                \"description\": \"${DESCRIPTION}\",
                \"color\": ${COLOR},
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"footer\": {
                  \"text\": \"BC Flame CI/CD\"
                }
              }]
            }" || echo "Failed to send Discord notification (non-fatal)"
```

---

## Workflow 2: Health Check Monitoring

**File**: `.github/workflows/health-check.yml`

This workflow runs every hour to monitor site health and alert if any services are down.

```yaml
name: Health Check

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  check-health:
    name: Check Production Health
    runs-on: ubuntu-latest
    steps:
      - name: Check Frontend
        id: check-frontend
        run: |
          URL="${{ secrets.NEXT_PUBLIC_SITE_URL }}"
          echo "Checking frontend: $URL"

          if curl -f -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
            echo "✅ Frontend is healthy"
          else
            echo "❌ Frontend health check failed"
            exit 1
          fi

      - name: Check Backend API
        id: check-backend
        run: |
          URL="${{ secrets.NEXT_PUBLIC_STRAPI_URL }}/_health"
          echo "Checking backend: $URL"

          if curl -f -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
            echo "✅ Backend is healthy"
          else
            echo "❌ Backend health check failed"
            exit 1
          fi

      - name: Check Nginx Health
        id: check-nginx
        run: |
          URL="${{ secrets.NEXT_PUBLIC_SITE_URL }}/health"
          echo "Checking nginx: $URL"

          if curl -f -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
            echo "✅ Nginx is healthy"
          else
            echo "❌ Nginx health check failed"
            exit 1
          fi

      - name: Notify on failure
        if: failure() && secrets.DISCORD_WEBHOOK != ''
        run: |
          curl -X POST "${{ secrets.DISCORD_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"🚨 Health Check Failed\",
                \"description\": \"One or more services are down!\n\nPlease check the [workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.\",
                \"color\": 15158332,
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"footer\": {
                  \"text\": \"BC Flame Health Monitor\"
                }
              }]
            }"
```

---

## Workflow 3: Manual Rollback

**File**: `.github/workflows/rollback.yml`

This workflow allows manual rollback to a previous deployment.

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      commit_sha:
        description: 'Commit SHA to rollback to (leave empty for previous deployment)'
        required: false
        type: string

jobs:
  rollback:
    name: Rollback to Previous Version
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Execute rollback
        run: |
          COMMIT_SHA="${{ github.event.inputs.commit_sha }}"

          if [[ -n "$COMMIT_SHA" ]]; then
            echo "Rolling back to specified commit: $COMMIT_SHA"
          else
            echo "Rolling back to previous deployment"
          fi

          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            set -e
            cd ${{ secrets.SERVER_PROJECT_PATH }}

            if [[ -n "${{ github.event.inputs.commit_sha }}" ]]; then
              ./scripts/rollback.sh "${{ github.event.inputs.commit_sha }}"
            else
              ./scripts/rollback.sh
            fi
          EOF

      - name: Verify rollback
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            set -e
            cd ${{ secrets.SERVER_PROJECT_PATH }}
            ./scripts/verify-deployment.sh
          EOF

      - name: Notify Discord
        if: always() && secrets.DISCORD_WEBHOOK != ''
        run: |
          STATUS="${{ job.status }}"

          if [[ "$STATUS" == "success" ]]; then
            COLOR="3066993"
            EMOJI="✅"
            TITLE="Rollback Successful"
          else
            COLOR="15158332"
            EMOJI="❌"
            TITLE="Rollback Failed"
          fi

          COMMIT="${{ github.event.inputs.commit_sha }}"
          if [[ -z "$COMMIT" ]]; then
            COMMIT="previous deployment"
          fi

          curl -X POST "${{ secrets.DISCORD_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"${EMOJI} ${TITLE}\",
                \"description\": \"Rolled back to: \`${COMMIT}\`\n\nTriggered by: ${{ github.actor }}\",
                \"color\": ${COLOR},
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"footer\": {
                  \"text\": \"BC Flame Rollback\"
                }
              }]
            }"
```

---

## Workflow 4: GHCR Image Cleanup

**File**: `.github/workflows/cleanup-images.yml`

This workflow removes old Docker images from GHCR to save storage space.

```yaml
name: Cleanup Old Images

on:
  schedule:
    # Run every Sunday at midnight
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  cleanup:
    name: Clean up old GHCR images
    runs-on: ubuntu-latest
    steps:
      - name: Delete old frontend images
        uses: actions/delete-package-versions@v5
        with:
          package-name: 'bcflame-frontend'
          package-type: 'container'
          min-versions-to-keep: 10
          delete-only-untagged-versions: false

      - name: Delete old backend images
        uses: actions/delete-package-versions@v5
        with:
          package-name: 'bcflame-backend'
          package-type: 'container'
          min-versions-to-keep: 10
          delete-only-untagged-versions: false

      - name: Notify Discord
        if: always() && secrets.DISCORD_WEBHOOK != ''
        run: |
          curl -X POST "${{ secrets.DISCORD_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"🧹 Image Cleanup Completed\",
                \"description\": \"Old Docker images removed from GHCR.\n\nKept last 10 versions of each service.\",
                \"color\": 3447003,
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"footer\": {
                  \"text\": \"BC Flame Maintenance\"
                }
              }]
            }"
```

---

## Creating the Workflow Files

To create these workflows in your repository:

```bash
# Create workflows directory
mkdir -p .github/workflows

# Create each workflow file
# Copy the YAML content from above into each file

# File 1
nano .github/workflows/deploy.yml
# Paste content from "Workflow 1" above

# File 2
nano .github/workflows/health-check.yml
# Paste content from "Workflow 2" above

# File 3
nano .github/workflows/rollback.yml
# Paste content from "Workflow 3" above

# File 4
nano .github/workflows/cleanup-images.yml
# Paste content from "Workflow 4" above

# Commit workflows
git add .github/workflows/
git commit -m "feat: Add CI/CD GitHub Actions workflows"
git push origin master
```

---

## Required Secrets Summary

Before the workflows can run, ensure these secrets are configured in GitHub:

| Secret Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ Yes |
| `SSH_HOST` | Digital Ocean droplet IP/hostname | `123.45.67.89` or `yourdomain.com` | ✅ Yes |
| `SSH_USER` | SSH username | `ubuntu` | ✅ Yes |
| `SERVER_PROJECT_PATH` | Project path on server | `/opt/bcflame` | ✅ Yes |
| `NEXT_PUBLIC_STRAPI_URL` | Backend API URL | `https://api.yourdomain.com` | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `https://yourdomain.com` | ✅ Yes |
| `DISCORD_WEBHOOK` | Discord webhook URL | `https://discord.com/api/webhooks/...` | ⚠️ Optional |

---

## Next Steps

After creating the workflows:

1. **Test SSH Connection**: Create a test workflow to verify SSH works
2. **First Deployment**: Trigger a manual deployment via workflow_dispatch
3. **Monitor Logs**: Watch Actions tab for any errors
4. **Fix Issues**: Address any failures and re-run

Continue to Phase 5 in the main implementation plan document.
