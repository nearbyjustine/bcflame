# Debug Session: Empty Customer Data in Order Inquiry Emails

**Date:** 2026-01-13
**Issue:** Order inquiry emails not sending with customer information because `ctx.state.user` is empty in the controller.

## Problem Summary

When creating order inquiries through the frontend, the backend logs show:
- `ctx.state.user` is empty/undefined in the controller
- `ctx.request.body` shows empty customer data
- Lifecycle hooks cannot populate customer information
- Emails are sent but lack customer details (name, email, company, etc.)

## Root Cause Investigation

### Confirmed Working
✅ **Frontend JWT Authentication**
- JWT token exists in browser cookie: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Network tab confirms Authorization header is sent: `Authorization: Bearer <token>`
- Token contains user ID 4
- Frontend axios interceptor correctly adds token to requests

✅ **Backend Email Service**
- Email service is properly configured (SMTP settings in `.env`)
- Email templates are correct
- Admin emails are being sent successfully (though without customer data)
- Lifecycle hooks are executing correctly

### The Mystery: Headers Disappearing in Backend

**Network Request (Browser DevTools):**
```
POST /api/order-inquiries HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzY4MzExMTkwLCJleHAiOjE3Njg5MTU5OTB9.7uIaGonlgAAcuH46mKa0ahRuXN_Otba7IEWXqf-gHs4
Content-Type: application/json
```

**Backend Middleware Logs:**
```
debug: URL (ctx.url):                          ← EMPTY
debug: Method (ctx.method):                    ← EMPTY
debug: Headers (ctx.headers):                  ← EMPTY
debug: Authorization (ctx.headers.authorization): ← EMPTY
debug: ctx.state.user (before next):           ← EMPTY
```

**The headers are being sent from the frontend but completely disappear by the time they reach our middleware and controller.**

## Attempted Fixes

### 1. Route-Level Authentication Policies ❌
**Attempted:** Added `plugin::users-permissions.isAuthenticated` policy to routes
```typescript
export default factories.createCoreRouter('api::order-inquiry.order-inquiry', {
  config: {
    create: { policies: ['plugin::users-permissions.isAuthenticated'] },
    update: { policies: ['plugin::users-permissions.isAuthenticated'] },
  },
});
```
**Result:** Error - "Could not find policy 'plugin::users-permissions.isAuthenticated'"
**Issue:** Policy name was incorrect or doesn't exist in Strapi 4

### 2. Custom Authentication Middleware ❌
**Attempted:** Created custom middleware to manually verify JWT
- File: `backend/src/api/order-inquiry/middlewares/require-auth.ts`
- Manually extracts JWT from Authorization header
- Verifies token using `strapi.plugin('users-permissions').service('jwt')`
- Populates `ctx.state.user` before controller executes

**Result:** Middleware executes but `ctx.headers.authorization` is empty
**Issue:** Headers are missing by the time middleware runs

### 3. Header Access Methods ❌
**Attempted multiple ways to access headers:**
- `ctx.request.headers.authorization` ← Empty
- `ctx.request.header.authorization` (Koa convention) ← Empty
- `ctx.headers.authorization` (direct access) ← Empty

**All methods return undefined/empty values**

### 4. Global Middleware Debugging ⚠️
**Current State:** Added global middleware to log request details early in the stack
- File: `backend/src/middlewares/log-user-context.ts`
- Registered in `backend/config/middlewares.ts` after `strapi::errors`

**Observations:**
- Even global middleware shows completely empty context
- `ctx.url`, `ctx.method`, `ctx.headers` all return empty/undefined
- This suggests the context object itself is corrupted or being accessed incorrectly

## Current Code State

### Files Modified

1. **`backend/src/api/order-inquiry/routes/order-inquiry.ts`**
   - Added middleware configuration (currently using custom require-auth middleware)

2. **`backend/src/api/order-inquiry/routes/custom.ts`**
   - Added middleware to batch route

3. **`backend/src/api/order-inquiry/middlewares/require-auth.ts`** ✨ NEW
   - Custom authentication middleware
   - Attempts to manually verify JWT and populate ctx.state.user
   - Currently not working due to missing headers

4. **`backend/src/api/order-inquiry/middlewares/index.ts`** ✨ NEW
   - Exports middleware for Strapi to load

5. **`backend/src/middlewares/log-user-context.ts`** ✨ NEW
   - Global debugging middleware
   - Logs request details early in middleware stack

6. **`backend/config/middlewares.ts`**
   - Added global middleware: `'global::log-user-context'`

7. **`backend/src/api/order-inquiry/controllers/order-inquiry.ts`**
   - Enhanced debug logging
   - Shows ctx.state, ctx.state.user, Authorization header (all empty)

8. **`frontend/src/lib/api/customization.ts`**
   - Added debug logging to check JWT cookie existence

### Lifecycle Hook Analysis

**File:** `backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`

The lifecycle hooks are working correctly, but receive undefined customer data:

**beforeCreate (lines 83-98):**
- Generates inquiry number ✓
- Tries to set customer from `event.state.user` (but it's undefined)
- Logs show: `beforeCreate - customer ID:` (empty)

**afterCreate (lines 123-214):**
- Fetches inquiry with customer relation populated
- Customer relation is NULL in database
- Logs show: `Customer data:` (empty)
- Email service still sends admin email (without customer details)
- Customer confirmation email skipped (no customer email available)

## Strapi Configuration

**Middleware Stack Order** (`backend/config/middlewares.ts`):
```typescript
[
  'strapi::logger',
  'strapi::errors',
  'global::log-user-context',  // Our debugging middleware
  'strapi::security',
  'strapi::cors',
  // ... other middlewares
]
```

**Users-Permissions Plugin** (`backend/config/plugins.ts`):
```typescript
'users-permissions': {
  config: {
    jwt: { expiresIn: '7d' },
  },
}
```

## Key Questions for Next Session

### Critical Issue
**Why are ALL headers (and ctx properties) empty in both global and route-level middlewares?**

Possible causes:
1. **Logging artifacts:** JSON.stringify might be failing on certain Koa objects
2. **Timing issue:** Middleware might be running at wrong point in lifecycle
3. **Strapi version bug:** Known issue with Strapi 4.16.2?
4. **TypeScript compilation:** Middleware not being compiled/loaded correctly
5. **Context object scope:** Accessing wrong context or context is being cloned/transformed

### Research Needed
1. How does Strapi 4 actually populate `ctx.state.user` from JWT tokens?
2. Is there a built-in Strapi middleware we're missing in the stack?
3. Are route-level middlewares in Strapi different from global middlewares?
4. Should we be using policies instead of middlewares for authentication?

### Testing To Do
1. Check if stopping/restarting backend fully loads middlewares
2. Try logging with `console.log` instead of `strapi.log.debug`
3. Add middleware AFTER strapi::body to see if that changes anything
4. Check if admin panel permissions need to be configured for "Authenticated" role
5. Test with a simple cURL request to isolate frontend vs backend issue

## Relevant Documentation

### Research Findings
- [Strapi v4 Middleware ctx.state.user - Forum](https://forum.strapi.io/t/strapi-v4-middleware-ctx-state-user/13879)
  - `ctx.state.user` can be empty before `await next()` in global middleware
  - Authentication state is populated by internal Strapi processes

- [Empty ctx.request.body - Forum](https://forum.strapi.io/t/empty-ctx-request-body/31773)
  - Body parser middleware order matters

- [Middlewares | Strapi Documentation](https://docs-v4.strapi.io/dev-docs/configurations/middlewares)
  - Middleware registration and order

### Key Findings from Web Search
- In Koa (Strapi's framework), use `ctx.request.header` (singular) not `ctx.request.headers`
- However, we tried `ctx.headers` directly which should also work
- Global middleware may not have access to `ctx.state.user` before calling `next()`

## Database State

**Current Issue:** Order inquiries are being created with `customer` field as NULL

**Query to check:**
```sql
SELECT id, inquiry_number, customer, product FROM order_inquiries;
```

**Expected:** customer column should contain user IDs (e.g., 4)
**Actual:** customer column is NULL

## Next Steps for Resolution

### Immediate Actions
1. **Verify middleware is actually loading:**
   - Check compiled JavaScript in `backend/dist/`
   - Add `console.log` in addition to `strapi.log`

2. **Check Strapi Users-Permissions middleware:**
   - Verify if there's a built-in middleware that should be in the stack
   - Check if authentication middleware needs explicit registration

3. **Test with minimal middleware:**
   - Temporarily remove custom middlewares
   - Use Strapi admin panel to set permissions for "Authenticated" role on order-inquiry
   - See if Strapi's built-in auth populates ctx.state.user

4. **Alternative approach - Use controller-level auth check:**
   - Instead of relying on middleware, manually verify JWT in controller
   - Extract token from headers (if we can access them)
   - Call JWT service directly

### Long-term Solution Paths

**Option A: Fix Header Access**
- Determine why ctx object has no properties
- Find correct way to access headers in Strapi 4 middlewares

**Option B: Use Strapi Admin Permissions**
- Configure permissions in Strapi admin panel
- Let Strapi's built-in authentication handle ctx.state.user population
- Remove custom middleware

**Option C: Controller-Level Authentication**
- Accept that middlewares can't access headers
- Implement authentication check directly in controller
- Manually populate customer from JWT verification

## Environment Details

- **Strapi Version:** 4.16.2
- **Node Version:** (check with `node --version`)
- **Development Mode:** Using `npm run dev` (not Docker)
- **Frontend:** Next.js 14, running on localhost:3000
- **Backend:** Strapi, running on localhost:1337
- **Database:** PostgreSQL 16

## Files to Review in Next Session

### Critical Files
- `backend/src/api/order-inquiry/middlewares/require-auth.ts`
- `backend/src/middlewares/log-user-context.ts`
- `backend/config/middlewares.ts`
- `backend/src/api/order-inquiry/controllers/order-inquiry.ts`

### Reference Files
- `backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`
- `frontend/src/lib/api/strapi.ts`
- `frontend/src/lib/api/customization.ts`

## Temporary Workarounds

None currently working. Emails are being sent but without customer information.

## Success Criteria (When Fixed)

✅ `ctx.state.user` is populated with user object (id, email, username, etc.)
✅ Customer field is set in order inquiry database records
✅ Lifecycle hooks can fetch full customer data
✅ Admin emails contain customer details (name, email, company, phone)
✅ Customer confirmation emails are sent to the customer's email address
✅ Backend logs show populated Authorization header and ctx.state.user

---

**Status:** Issue unresolved - Headers and context properties are completely empty in all middlewares
**Next Action:** Research why Koa context object appears empty in Strapi 4 middlewares
