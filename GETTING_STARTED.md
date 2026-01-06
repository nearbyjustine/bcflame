# Getting Started with BC Flame Premium Portal

This guide will walk you through setting up and running the BC Flame Premium Portal on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker Desktop** (required)
  - Download from: https://www.docker.com/products/docker-desktop/
  - Make sure Docker Desktop is running
- **Terminal/Command Line** access
- A web browser (Chrome, Firefox, Safari, etc.)

That's it! Docker will handle everything else.

---

## Step 1: Navigate to the Project

Open your terminal and navigate to the project directory:

```bash
cd /Users/justinecastaneda/Desktop/bcflame
```

---

## Step 2: Start the Application

Start all services with Docker Compose:

```bash
docker-compose up -d
```

**What this does:**
- `-d` runs containers in the background (detached mode)
- Starts PostgreSQL database
- Starts Strapi CMS backend
- Starts Next.js frontend

**First time setup will take 5-10 minutes** as Docker downloads images and installs dependencies.

---

## Step 3: Monitor the Startup

Watch the logs to see when everything is ready:

```bash
docker-compose logs -f
```

**Look for these messages:**
- PostgreSQL: `database system is ready to accept connections`
- Strapi: `Server started` or `Project information`
- Next.js: `Ready in` or `compiled successfully`

**Press `Ctrl+C` to exit the logs** (this won't stop the containers)

---

## Step 4: Create Your Strapi Admin Account

Once Strapi is running (you'll see "Server started" in the logs):

1. **Open your browser** and visit: **http://localhost:1337/admin**

2. **Create your admin account:**
   - First name: Your name
   - Last name: Your last name
   - Email: Your email (e.g., admin@bcflame.com)
   - Password: Choose a strong password
   - Click "Let's start"

3. **You'll be logged into the Strapi admin panel**

> **Note:** This is your Strapi admin account, NOT a partner user account. We'll create partner users next.

---

## Step 5: Create a Test Partner User

Now create a partner user to test the frontend login:

1. **In the Strapi admin panel**, click **"Content Manager"** in the left sidebar

2. Click **"User"** under "Collection Types"

3. Click the **"Create new entry"** button (top right)

4. **Fill in the form:**
   - **Username:** `testpartner`
   - **Email:** `test@partner.com`
   - **Password:** `Test123!`
   - **Confirmed:** Toggle this ON (important!)
   - **Blocked:** Make sure this is OFF
   - **Role:** Select "Authenticated"

5. Click **"Save"** in the top right

---

## Step 6: Test the Frontend Login

1. **Open a new browser tab** and visit: **http://localhost:3000**

2. **You should be redirected to the login page**

3. **Log in with your test partner credentials:**
   - Email: `test@partner.com`
   - Password: `Test123!`

4. **Click "Sign In"**

5. **You should see the dashboard!** 🎉

---

## Step 7: Explore the Portal

You're now logged in as a partner. You can:

- **View the Dashboard** - See the overview and quick start guide
- **Check the Navigation** - Links to Products, Media Hub, Orders (coming in Phase 2)
- **Test Logout** - Click the "Sign Out" button in the top right
- **Test Protected Routes** - Try accessing `/dashboard` after logging out (you'll be redirected to login)

---

## Common Commands

### View All Running Containers
```bash
docker-compose ps
```

### View Logs for All Services
```bash
docker-compose logs -f
```

### View Logs for a Specific Service
```bash
docker-compose logs -f strapi
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop All Services (keeps data)
```bash
docker-compose down
```

### Start Services Again
```bash
docker-compose up -d
```

### Restart a Specific Service
```bash
docker-compose restart strapi
docker-compose restart frontend
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Complete Reset (WARNING: Deletes all data!)
```bash
docker-compose down -v
docker-compose up -d
```

---

## Troubleshooting

### Problem: "Cannot connect to the Docker daemon"
**Solution:** Make sure Docker Desktop is running. Open Docker Desktop and wait for it to start.

### Problem: Port 3000, 1337, or 5432 already in use
**Solution:** Another application is using these ports. Either:
- Stop the other application, or
- Edit `.env` file to change the ports:
  ```
  FRONTEND_PORT=3001
  STRAPI_PORT=1338
  DB_PORT=5433
  ```
  Then restart: `docker-compose down && docker-compose up -d`

### Problem: Strapi won't start
**Solution:**
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View Strapi logs
docker-compose logs strapi

# Restart Strapi
docker-compose restart strapi
```

### Problem: Can't log in - "Invalid credentials"
**Solution:**
- Make sure you created the user in Strapi admin
- Make sure **"Confirmed"** is toggled **ON** in the user settings
- Make sure **"Blocked"** is toggled **OFF**
- Double-check the email and password

### Problem: Frontend shows "Cannot connect to Strapi"
**Solution:**
```bash
# Make sure Strapi is running
docker-compose ps

# Check Strapi logs
docker-compose logs strapi

# Make sure it's on port 1337
curl http://localhost:1337/api
```

### Problem: CORS errors in browser console
**Solution:**
```bash
# Restart Strapi
docker-compose restart strapi

# If that doesn't work, check the CORS config in:
# backend/config/middlewares.ts
```

### Problem: Changes to code not showing up
**Solution:**
```bash
# Rebuild the containers
docker-compose up -d --build

# For frontend changes, sometimes you need to clear Next.js cache:
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

---

## Service URLs

Once everything is running, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Partner portal login and dashboard |
| **Strapi Admin** | http://localhost:1337/admin | CMS admin panel |
| **Strapi API** | http://localhost:1337/api | REST API endpoint |
| **PostgreSQL** | localhost:5432 | Database (use a DB client to connect) |

---

## What to Do Next

Now that you have Phase 1 running, you can:

### Explore Strapi Admin
- Visit http://localhost:1337/admin
- Browse the Content-Type Builder
- Explore Settings > Users & Permissions

### Customize the Portal
- Edit files in `frontend/src/app/`
- Change colors in `frontend/tailwind.config.ts`
- Add new pages and components

### Prepare for Phase 2
Phase 2 will add:
- Product catalog with inventory tracking
- Smart Packaging Studio for custom designs
- Order inquiry system
- Media hub for marketing materials
- More content types in Strapi

---

## Getting Help

If you run into issues:

1. **Check the logs:** `docker-compose logs -f`
2. **Check the troubleshooting section** above
3. **Verify all containers are running:** `docker-compose ps`
4. **Try a restart:** `docker-compose restart [service-name]`
5. **Try a rebuild:** `docker-compose up -d --build`

---

## Stopping the Application

When you're done working:

```bash
# Stop all services (keeps your data)
docker-compose down
```

To start again later:

```bash
# Navigate to project directory
cd /Users/justinecastaneda/Desktop/bcflame

# Start services
docker-compose up -d
```

---

## Phase 1 Complete! ✅

You now have a fully functional authentication system with:
- 🔐 Secure JWT-based login
- 🎨 Modern UI with Tailwind CSS
- 🛡️ Protected routes
- 🐳 Fully containerized development environment
- 📱 Responsive design

**Welcome to the BC Flame Premium Portal!** 🔥
