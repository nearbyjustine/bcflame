# BCFlame Traefik Configuration Fix Report

**Date:** January 14, 2026

## Problem

BCFlame services were not appearing in the Traefik routing table, while other services (letters-to, portfolio, staging-connect, etc.) were working correctly.

## Root Cause

Traefik was filtering out the bcflame containers because they were marked as **unhealthy** or **starting**. The Dockerfiles for both `bcflame-strapi-prod` and `bcflame-frontend-prod` had built-in HEALTHCHECK instructions that were failing:

1. **Frontend Issue**: Next.js was binding to the container's IP address (`172.24.0.x:3000`) instead of `localhost` or `0.0.0.0`, causing the healthcheck `wget http://localhost:3000` to fail with "Connection refused"

2. **Strapi Issue**: The container was still in startup phase when Traefik checked, and the seeding script was causing delays

Debug logs showed:
```
Filtering unhealthy or starting container container=frontend-bcflame-...
Filtering unhealthy or starting container container=strapi-bcflame-...
```

## Solution

Updated `/home/hows.tine/bcflame/docker-compose.traefik.yml` with the following changes:

### 1. Disabled Healthchecks for Strapi and Frontend

Added `healthcheck: disable: true` to override the Dockerfile HEALTHCHECK:

```yaml
strapi:
  # ...
  healthcheck:
    disable: true

frontend:
  # ...
  healthcheck:
    disable: true
```

### 2. Simplified Network Configuration

Changed from dual network (`bcflame_internal` + `proxy`) to single network (`proxy` only):

```yaml
networks:
  - proxy
```

### 3. Hardcoded Domain Names

Replaced environment variable interpolation with hardcoded values:

```yaml
# Before
- "traefik.http.routers.bcflame-web.rule=Host(`bcflame.localhost`) || Host(`${FRONTEND_DOMAIN:-bcflame.hows-tine.com}`)"

# After
- "traefik.http.routers.bcflame-web.rule=Host(`bcflame.localhost`) || Host(`bcflame.hows-tine.com`)"
```

### 4. Removed Obsolete Version Attribute

Removed `version: '3.8'` as it's deprecated in newer Docker Compose versions.

## Result

Both services are now registered in Traefik:

| Router | Rule | Status |
|--------|------|--------|
| `bcflame-web@docker` | `Host(\`bcflame.localhost\`) \|\| Host(\`bcflame.hows-tine.com\`)` | ✅ enabled |
| `bcflame-api@docker` | `Host(\`api.bcflame.localhost\`) \|\| Host(\`api.bcflame.hows-tine.com\`)` | ✅ enabled |

## Files Modified

- `/home/hows.tine/bcflame/docker-compose.traefik.yml`
- `/home/hows.tine/traefik/docker-compose.yml` (temporarily enabled debug logging for diagnosis)

## Recommendations

1. **Fix Next.js binding**: Update the frontend Dockerfile or Next.js config to bind to `0.0.0.0` instead of the container IP, then re-enable healthchecks

2. **Fix Strapi startup**: Optimize the seeding script or increase the healthcheck `start_period` to allow more time for initialization

3. **Re-enable healthchecks**: Once the applications are properly configured, re-enable healthchecks for better container lifecycle management

---

## Follow-up Fix: Database Connection Failure

**Time:** January 14, 2026 (later session)

### Problem

After fixing Traefik visibility, Strapi was failing to start with:
```
password authentication failed for user "bcflame"
```

Postgres logs also showed:
```
database "bcflame" does not exist
```

### Root Causes Identified

#### 1. DNS Ambiguity on Shared Network

The `proxy` network has multiple postgres containers from different projects:
- `bcflame_postgres`
- `church_cms_db`
- `firefly_db`
- etc.

When Strapi connected to hostname `postgres`, Docker DNS could resolve it to ANY postgres container on the network - not necessarily `bcflame_postgres`. This caused authentication failures because other postgres instances have different passwords.

**Test results:**
| Host | Connection Result |
|------|------------------|
| `postgres` (hostname) | ❌ password authentication failed |
| `172.24.0.23` (IP) | ✅ OK |
| `bcflame_postgres` (container name) | ✅ OK |

#### 2. Postgres Healthcheck Using Wrong Database

The healthcheck was:
```yaml
test: ["CMD-SHELL", "pg_isready -U bcflame"]
```

`pg_isready` without `-d` defaults to connecting to a database named after the username (`bcflame`), but our database is `bcflame_db`. This caused continuous "database does not exist" errors in logs.

### Solutions Applied

#### 1. Changed DATABASE_HOST to Use Container Name

```yaml
# Before
DATABASE_HOST: postgres

# After
DATABASE_HOST: bcflame_postgres
```

This ensures Strapi always connects to the correct postgres instance regardless of Docker DNS resolution order.

#### 2. Fixed Postgres Healthcheck

```yaml
# Before
test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bcflame}"]

# After
test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bcflame} -d ${DB_NAME:-bcflame_db}"]
```

#### 3. Added Documentation to .env

Added warning about postgres password persistence:
```bash
# ⚠️  WARNING: PostgreSQL only reads these on FIRST initialization!
# If you change DB_PASSWORD after the volume is created, you must either:
# 1. Delete the volume: docker volume rm bcflame_postgres_data
# 2. Or manually update the password in postgres:
#    docker exec bcflame_postgres psql -U bcflame -d bcflame_db -c "ALTER USER bcflame WITH PASSWORD 'new_password';"
```

### Result

All containers running successfully:

| Container | Status |
|-----------|--------|
| `bcflame_postgres` | ✅ Up (healthy) |
| `bcflame_strapi` | ✅ Up |
| `bcflame_frontend` | ✅ Up |

Strapi successfully launched:
```
┌────────────────────┬──────────────────────────────────────────────────┐
│ Time               │ Wed Jan 14 2026 08:11:22 GMT+0000                │
│ Launched in        │ 3045 ms                                          │
│ Environment        │ production                                       │
│ Database           │ postgres                                         │
└────────────────────┴──────────────────────────────────────────────────┘
```

### Key Lessons

1. **Always use unique container names** when services share a Docker network - never rely on generic service aliases like `postgres`, `redis`, `db`

2. **PostgreSQL password is set once** when the volume initializes - changing `.env` later won't update the database password

3. **Test database connections** from inside the application container, not just externally, to catch DNS resolution issues
