# End of Day Report – 2026-01-27

## Shift Covered
- **Time:** Late Shift / Early Morning
- **Focus:** Infrastructure/Deployment overhaul & Order Status updates

---

## Completed Tasks

## Completed Tasks

### 1. Infrastructure Migration & Deployment Overhaul (Cloudflare Tunnel)
- **What I did:** 
  - **Strategic Pivot:** Shifted from a traditional VPS setup (Digital Ocean + manual Nginx/Let's Encrypt) to a **Cloudflare Zero Trust (Tunnel)** architecture.
  - **Docker Integration:** Implemented the `cloudflared` service directly within our `docker-compose` stack (`bcflame_tunnel`), allowing the application to securely connect to the internet without exposing almost any inbound ports.
  - **Configuration Cleanup:** Removed extensive and error-prone Nginx configurations that were previously handling SSL termination and complex proxy passes.
  - **Domain Setup:** Purchased and fully configured **bcflame.online**.
  - **Secure Networking:** Configured the tunnel to route traffic exclusively to our internal Docker network services (Frontend and Strapi Backend) based on hostname ingress rules.
  - **Credential Management:** Securely generated and integrated Cloudflare credentials (`tunnel_credentials.json`) to authenticate the edge connection.
- **Why it matters:** 
  - **Security:** Hides our origin server IP and eliminates the need for open firewall ports (80/443), protecting us from direct scale attacks.
  - **Simplicity:** internalizes SSL management to Cloudflare's edge, removing the need for local certbot maintenance.
  - **Reliability:** The tunnel allows for a more resilient connection that persists even if the host IP changes.
- **Current status:** Deployed / Live

### 2. Order Inquiry Lifecycle Updates
- **What I did:** 
  - **Schema Evolution:** Modified the Strapi content type for `Order Inquiry` to support a distinct `cancelled` status.
  - **Business Logic:** Updated the custom controller logic to enforce valid state transitions when an order is cancelled.
  - **Feedback Loop:** Implemented specific lifecycle messages to inform the user interface of the cancellation event status.
- **Why it matters:** 
  - Provides granularity in order tracking, allowing the business to distinguish between "pending" and "rejected/cancelled" inquiries, which is crucial for accurate sales reporting.
- **Current status:** Done

### 3. Backend Stability & Rate Limiting
- **What I did:** Tuned the Nginx/Backend configuration to resolve "Too Many Requests" (HTTP 429) errors that were blocking legitimate API calls during testing.
- **Current status:** Resolved

---

## Blockers & Challenges (Focus)

### **Infrastructure & Digital Ocean Integration**
- **The Issue:** We faced significant friction and complexity with the initial Digital Ocean and Nginx manual configuration (SSL provisioning, proxying, and extensive server config management).
- **Decision/Workaround:** 
  - **We did NOT use Digital Ocean for now.** 
  - To unblock the release and simplify access, we shifted strategy to use **Cloudflare Tunnel** (`cloudflared`) instead.
  - This allows us to move forward immediately while we plan to revisit or properly provision Digital Ocean infrastructure later if needed.

---

## Technical Work (Supporting Details)
- Created `docker-compose.tunnel.yml` for isolated tunnel operations.
- Cleaned up extensive Nginx config files (`reports` and `deploy` scripts updated).
- Configured Cloudflare credentials for safe ingress.
- Fixed backend rate limiting.

---

## Current Status
- **Overall progress:** Ahead (Infrastructure issues resolved via pivot)
- **Next Steps:** Monitor the Cloudflare tunnel stability and proceed with app feature development.
