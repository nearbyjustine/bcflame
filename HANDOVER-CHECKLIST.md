# BC Flame Project - Handover Checklist

**Project:** BC Flame Premium Client Portal
**Handover Date:** February 14, 2026
**Prepared By:** Justine Castaneda

---

## Pre-Handover Tasks

### 1. Code & Repository

- [ ] **Ensure all code is committed and pushed**
  ```bash
  git status  # Should show "nothing to commit, working tree clean"
  git push origin --all
  git push origin --tags
  ```

- [ ] **Verify all branches are pushed**
  ```bash
  git branch -a  # Check remote branches
  ```

- [ ] **Update documentation**
  - [ ] HANDOVER.md is complete and accurate
  - [ ] CLAUDE.md reflects current architecture
  - [ ] README.md has correct setup instructions
  - [ ] Inline code comments are up to date

- [ ] **Run final tests**
  ```bash
  cd frontend && npm run test
  cd ../backend && npm run test
  ```

- [ ] **Create final build to verify no errors**
  ```bash
  cd frontend && npm run build
  cd ../backend && npm run build
  ```

### 2. Database Backup

- [ ] **Start database if not running**
  ```bash
  docker-compose up -d postgres
  ```

- [ ] **Create database backup**
  ```bash
  docker-compose exec postgres pg_dump -U bcflame_user bcflame > handover-db-backup-$(date +%Y%m%d).sql
  ```

- [ ] **Verify backup file is not empty**
  ```bash
  ls -lh handover-db-backup-*.sql
  head -n 20 handover-db-backup-*.sql  # Should show SQL statements
  ```

- [ ] **Test database restore (optional but recommended)**
  ```bash
  # Create test database
  docker-compose exec postgres psql -U bcflame_user -c "CREATE DATABASE bcflame_test;"
  # Restore backup
  docker-compose exec -T postgres psql -U bcflame_user bcflame_test < handover-db-backup-*.sql
  # Verify
  docker-compose exec postgres psql -U bcflame_user bcflame_test -c "\dt"
  # Drop test database
  docker-compose exec postgres psql -U bcflame_user -c "DROP DATABASE bcflame_test;"
  ```

### 3. Assets & Uploads

- [ ] **Backup Strapi uploads directory**
  ```bash
  tar -czf handover-uploads-$(date +%Y%m%d).tar.gz backend/public/uploads/
  ```

- [ ] **Verify uploads backup**
  ```bash
  tar -tzf handover-uploads-*.tar.gz | head -n 20
  ```

- [ ] **Document any assets stored externally**
  - [ ] Cloud storage links (Google Drive, Dropbox)
  - [ ] Figma design files
  - [ ] Brand assets (logos, guidelines)

### 4. Environment & Configuration

- [ ] **Document all environment variables**
  - [ ] .env file values documented in HANDOVER.md
  - [ ] Secret generation commands provided
  - [ ] Production environment variables listed

- [ ] **List all API keys and their purposes**
  - [ ] Resend API key (email)
  - [ ] Any future integrations

- [ ] **Document hosting configuration**
  - [ ] Domain registrar (if applicable)
  - [ ] DNS settings
  - [ ] Hosting provider details

### 5. Access & Credentials

- [ ] **Prepare credentials document (share separately, securely)**
  - [ ] Strapi admin email/password
  - [ ] Database credentials
  - [ ] API keys
  - [ ] Hosting provider logins
  - [ ] Domain registrar login

- [ ] **GitHub access**
  - [ ] Add new team member as collaborator (if known)
  - [ ] Prepare for ownership transfer

- [ ] **Resend account**
  - [ ] Document account email
  - [ ] Prepare for account transfer or new API key generation

### 6. Create Complete Backup Package

- [ ] **Run backup script**
  ```bash
  ./create-handover-backup.sh
  ```

- [ ] **Verify backup contents**
  ```bash
  tar -tzf bcflame-handover-*.tar.gz | less
  ```

- [ ] **Note backup file size and location**
  ```bash
  ls -lh bcflame-handover-*.tar.gz
  ```

---

## Handover Meeting Tasks

### Before the Meeting

- [ ] **Review HANDOVER.md thoroughly**
- [ ] **Prepare demo environment (Docker running)**
- [ ] **Test login credentials work**
- [ ] **Have backup files ready to share**
- [ ] **Prepare list of questions for client**

### During the Meeting

- [ ] **Walkthrough project architecture**
  - [ ] Show system architecture diagram
  - [ ] Explain tech stack choices
  - [ ] Demonstrate key features

- [ ] **Demo the application**
  - [ ] Login flow
  - [ ] Product catalog
  - [ ] Customization studio
  - [ ] Order inquiry system
  - [ ] Media hub
  - [ ] Admin panel (Strapi)

- [ ] **Explain deployment process**
  - [ ] Development setup
  - [ ] Production deployment options
  - [ ] Environment configuration

- [ ] **Review pending tasks and known issues**
  - [ ] High priority items
  - [ ] Technical debt
  - [ ] Future enhancements

- [ ] **Discuss credentials transfer**
  - [ ] When to rotate secrets
  - [ ] How to transfer API keys
  - [ ] Repository ownership process

- [ ] **Questions from client**
  - [ ] Note any clarifications needed
  - [ ] Document any additional requests

### After the Meeting

- [ ] **Share backup package securely**
  - [ ] Upload to secure file sharing (WeTransfer, Dropbox)
  - [ ] Or physical handoff via USB drive
  - [ ] Provide download link/access

- [ ] **Share credentials document separately**
  - [ ] Use password manager (1Password shared vault)
  - [ ] Or encrypted PDF with password shared separately
  - [ ] Never email credentials in plain text

- [ ] **Send follow-up email with:**
  - [ ] Link to backup package
  - [ ] Summary of handover meeting
  - [ ] Next steps
  - [ ] Contact information for questions

---

## Repository Transfer Process

### Option 1: Transfer Ownership (Recommended)

1. [ ] **Client creates GitHub account (if needed)**
2. [ ] **Go to repository settings**
   - URL: https://github.com/nearbyjustine/bcflame/settings
3. [ ] **Scroll to "Danger Zone"**
4. [ ] **Click "Transfer ownership"**
5. [ ] **Enter new owner's GitHub username**
6. [ ] **New owner accepts transfer (within 24 hours)**

### Option 2: Add as Collaborator

1. [ ] **Go to repository settings → Access**
   - URL: https://github.com/nearbyjustine/bcflame/settings/access
2. [ ] **Click "Add people"**
3. [ ] **Enter new member's GitHub username**
4. [ ] **Set permission level: Admin**
5. [ ] **New member accepts invitation**

---

## Resend Account Transfer

### Option 1: Transfer Account Ownership

1. [ ] **Contact Resend support**
   - Email: support@resend.com
2. [ ] **Request account ownership transfer**
3. [ ] **Provide new owner's email**
4. [ ] **Wait for Resend to process (usually 1-2 business days)**

### Option 2: Generate New API Key for Client

1. [ ] **Client creates Resend account**
2. [ ] **Client generates new API key**
3. [ ] **Update .env with new key:**
   ```env
   RESEND_API_KEY=re_new_key_here
   ```
4. [ ] **Verify custom domain (if using)**
5. [ ] **Test email notifications**

---

## Hosting Setup (If Deploying Before Handover)

### Vercel (Frontend)

- [ ] **Create Vercel account** (or use existing)
- [ ] **Connect GitHub repository**
- [ ] **Configure build settings:**
  - Framework: Next.js
  - Root directory: frontend
  - Build command: `npm run build`
  - Output directory: `.next`
- [ ] **Set environment variables:**
  - `NEXT_PUBLIC_STRAPI_URL`
- [ ] **Deploy and verify**
- [ ] **Configure custom domain (if applicable)**
- [ ] **Transfer Vercel project ownership to client**

### Railway (Backend + Database)

- [ ] **Create Railway account** (or use existing)
- [ ] **Create new project**
- [ ] **Add PostgreSQL database**
- [ ] **Deploy Strapi backend**
  - Connect GitHub repo
  - Set root directory: backend
  - Configure environment variables
- [ ] **Run database migrations (if any)**
- [ ] **Verify API endpoints work**
- [ ] **Configure custom domain (if applicable)**
- [ ] **Transfer Railway project ownership to client**

---

## Post-Handover Tasks

### Immediately After Handover

- [ ] **Client confirms backup received**
- [ ] **Client confirms credentials received**
- [ ] **Client confirms documentation is clear**

### Within 24 Hours

- [ ] **Repository ownership transferred**
- [ ] **Resend account transferred or new key generated**
- [ ] **Client tests local development setup**
- [ ] **Client can access admin panel**

### Within 1 Week

- [ ] **Client rotates all secrets:**
  - [ ] JWT_SECRET
  - [ ] ADMIN_JWT_SECRET
  - [ ] APP_KEYS
  - [ ] Database password
  - [ ] Strapi admin password

- [ ] **Client sets up production hosting (if not done)**
- [ ] **Client configures custom domain**
- [ ] **Client verifies email notifications work**
- [ ] **Client tests all features end-to-end**

### Optional: Follow-up Support

- [ ] **Schedule follow-up call (if requested)**
- [ ] **Answer any technical questions**
- [ ] **Provide guidance on deployment**
- [ ] **Assist with troubleshooting**

---

## Security Checklist (For Client)

**Critical: Complete these tasks immediately after handover**

- [ ] **Rotate all JWT secrets**
  ```bash
  openssl rand -base64 32  # New JWT_SECRET
  openssl rand -base64 32  # New ADMIN_JWT_SECRET
  ```

- [ ] **Generate new APP_KEYS**
  ```bash
  echo "$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
  ```

- [ ] **Change database password**
  ```sql
  ALTER USER bcflame_user WITH PASSWORD 'new_secure_password';
  ```

- [ ] **Change Strapi admin password**
  - Login to admin panel
  - Go to Settings → Users
  - Change password

- [ ] **Revoke old API keys (if generated new ones)**
  - Resend dashboard → API Keys → Delete old key

- [ ] **Review and restrict API access**
  - Strapi admin → Settings → API Tokens
  - Remove or regenerate any tokens

- [ ] **Enable 2FA (if available)**
  - GitHub account
  - Hosting providers
  - Domain registrar

- [ ] **Audit user accounts**
  - Strapi admin → Users
  - Remove test accounts
  - Verify all users are authorized

---

## Final Verification

Before considering handover complete, verify:

- [x] ✅ All code is in GitHub repository
- [ ] ✅ Database backup is created and verified
- [ ] ✅ Uploads/assets are backed up
- [ ] ✅ HANDOVER.md is complete
- [ ] ✅ Backup package (.tar.gz) is created
- [ ] ✅ Credentials are documented
- [ ] ✅ Client has received all materials
- [ ] ✅ Client can run development environment
- [ ] ✅ Client understands deployment process
- [ ] ✅ Client knows how to get support

---

## Contact Information

**Developer:** Justine Castaneda
**Email:** [Your Email]
**GitHub:** @nearbyjustine

**Handover Completion Date:** _______________

**Client Signature:** _______________________

**Developer Signature:** ____________________

---

## Notes

Use this space to document any additional notes, clarifications, or special instructions:

```
[Add notes here]
```

---

**End of Checklist**

✅ = Completed
⚠️ = Needs attention
❌ = Blocked/Issue

Good luck with the handover! 🚀
