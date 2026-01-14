# How to Populate .env.traefik

There are two ways to set up your `.env.traefik` file:

---

## Method 1: Automated Script (Recommended)

Run the setup script which will guide you through the process:

```bash
./setup-traefik-env.sh
```

The script will:
- ✅ Auto-generate all 5 secrets (JWT, APP_KEYS, etc.)
- ✅ Ask you for configuration values
- ✅ Create `.env.traefik` with everything filled in
- ✅ Show you a summary

**What it asks for:**
1. Database password
2. Frontend domain (default: bcflame.hows-tine.com)
3. API domain (default: api.bcflame.hows-tine.com)
4. SMTP user (your email)
5. SMTP password (Gmail app password)
6. Email addresses
7. Whether to seed database

---

## Method 2: Manual Setup

### Step 1: Copy the template

```bash
cp .env.traefik.example .env.traefik
```

### Step 2: Generate secrets

Run these commands and copy the output:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate ADMIN_JWT_SECRET
openssl rand -base64 32

# Generate APP_KEYS (4 keys)
echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"

# Generate API_TOKEN_SALT
openssl rand -base64 32

# Generate TRANSFER_TOKEN_SALT
openssl rand -base64 32
```

### Step 3: Edit .env.traefik

Open the file:
```bash
nano .env.traefik
```

Update these values:

```bash
# Database
DB_PASSWORD=your-strong-password-here

# Paste generated secrets
JWT_SECRET=paste-output-from-command-1
ADMIN_JWT_SECRET=paste-output-from-command-2
APP_KEYS=paste-output-from-command-3
API_TOKEN_SALT=paste-output-from-command-4
TRANSFER_TOKEN_SALT=paste-output-from-command-5

# Domains (update if needed)
FRONTEND_DOMAIN=bcflame.hows-tine.com
API_DOMAIN=api.bcflame.hows-tine.com

# CORS (must match domains exactly)
CORS_ORIGINS=https://bcflame.hows-tine.com,https://www.bcflame.hows-tine.com,https://api.bcflame.hows-tine.com

# Frontend URLs
NEXT_PUBLIC_STRAPI_URL=https://api.bcflame.hows-tine.com
NEXT_PUBLIC_SITE_URL=https://bcflame.hows-tine.com

# Email
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM_ADDRESS=noreply@hows-tine.com
EMAIL_ADMIN_RECIPIENTS=admin@hows-tine.com

# Database seeding (true for first deployment only)
SEED_DATA=true
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Method 3: Copy from Existing .env

If you already have a `.env` or `.env.production` file with secrets:

```bash
# Copy existing secrets
cp .env.production .env.traefik

# Then update just the domain-related variables
nano .env.traefik
# Update: FRONTEND_DOMAIN, API_DOMAIN, CORS_ORIGINS, NEXT_PUBLIC_* variables
```

---

## Verification

Check that your `.env.traefik` has all required values:

```bash
# Check for empty values (should return nothing)
grep "^[A-Z_]*=$" .env.traefik

# View your configuration (secrets will be shown - be careful!)
cat .env.traefik
```

---

## Common Issues

### Issue: Gmail SMTP not working

**Solution:** Use an App Password, not your regular Gmail password

1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use the 16-character password in `SMTP_PASS`

### Issue: CORS errors after deployment

**Solution:** Ensure CORS_ORIGINS exactly matches your domains

```bash
# Must include protocol (https://) and all domain variations
CORS_ORIGINS=https://bcflame.hows-tine.com,https://www.bcflame.hows-tine.com,https://api.bcflame.hows-tine.com
```

### Issue: Forgot to seed database

**Solution:** Update SEED_DATA and restart

```bash
# Edit .env.traefik
nano .env.traefik
# Change: SEED_DATA=true

# Restart Strapi
docker-compose -f docker-compose.traefik.yml restart strapi

# Watch logs to see seeding
docker-compose -f docker-compose.traefik.yml logs -f strapi

# After seeding completes, change back to false
# Edit .env.traefik: SEED_DATA=false
# Restart again
docker-compose -f docker-compose.traefik.yml restart strapi
```

---

## Security Notes

⚠️ **NEVER commit `.env.traefik` to git!**

The `.gitignore` file already excludes it, but be careful:
- Don't share the file in messages
- Don't screenshot it
- Don't upload it anywhere
- Keep backups in a secure location (password manager)

---

## Quick Reference

**Full workflow:**
```bash
# 1. Run setup script
./setup-traefik-env.sh

# 2. Verify configuration
cat .env.traefik

# 3. Deploy
docker-compose -f docker-compose.traefik.yml up -d --build

# 4. Check logs
docker-compose -f docker-compose.traefik.yml logs -f

# 5. After first deployment, disable seeding
nano .env.traefik  # Change SEED_DATA=false
docker-compose -f docker-compose.traefik.yml restart strapi
```

Done! 🎉
