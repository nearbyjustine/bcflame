# BC Flame Media Hub & Admin Portal Implementation Plan

**Created:** January 15, 2026  
**Status:** In Progress  
**Estimated Duration:** 21 Days

---

## Executive Summary

A phased implementation adding Media Hub for resellers to browse/download marketing assets, a separate Admin Portal for full business management, and enhanced role-based access control. Built on existing Next.js 14 + Strapi 4.16.2 stack with JWT auth via Zustand.

---

## Current Architecture Context

| Component | Technology | Location |
|-----------|------------|----------|
| Frontend | Next.js 14 App Router | `/frontend` |
| Backend | Strapi 4.16.2 | `/backend` |
| Auth | JWT + Zustand, 7-day expiration | `frontend/src/stores/authStore.ts` |
| Current Roles | Admin, Authenticated, Public | Strapi Users-Permissions |
| Route Protection | Next.js Middleware | `frontend/src/middleware.ts` |
| Portal Layout | Route Group | `frontend/src/app/(portal)/layout.tsx` |

---

## Implementation Phases

### Phase 1: Foundation & Role System (Days 1-2)
**Goal:** Establish admin role infrastructure before building features

| Task | File | Description |
|------|------|-------------|
| 1.1 | `frontend/src/app/(portal)/layout.tsx` | Comment out Inventory from desktop `navLinks` array and mobile menu |
| 1.2 | `backend/src/extensions/users-permissions/content-types/user/schema.json` | Add `userType` enum field (`reseller` \| `admin`) |
| 1.3 | `frontend/src/stores/authStore.ts` | Add `userType` to `User` interface, fetch on `checkAuth()` |
| 1.4 | `frontend/src/middleware.ts` | Add `/admin-portal/*` to protected paths, decode JWT for role routing |
| 1.5 | `frontend/src/app/(admin-portal)/layout.tsx` | Create admin portal layout with separate navigation |

**Navigation Structure:**
- Reseller Portal (`/portal/*`): Dashboard, Products, Media Hub, Orders
- Admin Portal (`/admin-portal/*`): Dashboard, Orders, Media, Products, Users

---

### Phase 2: Backend — Media & Campaign Content Types (Days 3-4)
**Goal:** Build Strapi schemas for media asset management

#### 2.1 `media-asset` Content Type
**Location:** `backend/src/api/media-asset/`

```typescript
// Attributes
{
  title: { type: 'string', required: true },
  description: { type: 'text' },
  category: {
    type: 'enumeration',
    enum: ['product_photos', 'marketing_materials', 'packaging_templates', 'brand_guidelines'],
    required: true
  },
  file: { type: 'media', required: true },
  thumbnail: { type: 'media' },
  tags: { type: 'relation', relation: 'manyToMany', target: 'api::tag.tag' },
  products: { type: 'relation', relation: 'manyToMany', target: 'api::product.product' },
  downloadCount: { type: 'integer', default: 0 },
  fileSize: { type: 'biginteger' },
  fileType: { type: 'string' }
}
```

#### 2.2 `tag` Content Type
**Location:** `backend/src/api/tag/`

```typescript
{
  name: { type: 'string', required: true, unique: true },
  slug: { type: 'uid', targetField: 'name' },
  mediaAssets: { type: 'relation', relation: 'manyToMany', target: 'api::media-asset.media-asset', mappedBy: 'tags' }
}
```

#### 2.3 `campaign-kit` Content Type
**Location:** `backend/src/api/campaign-kit/`

```typescript
{
  name: { type: 'string', required: true },
  description: { type: 'text' },
  coverImage: { type: 'media' },
  assets: { type: 'relation', relation: 'manyToMany', target: 'api::media-asset.media-asset' },
  isActive: { type: 'boolean', default: true }
}
```

#### 2.4 Custom Controllers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/media-assets/:id/download` | POST | Increment `downloadCount`, return file URL |
| `/api/campaign-kits/:id/download` | POST | Accept `assetIds[]`, generate zip using `archiver`, stream response |

---

### Phase 3: Backend — Admin & Invoice Systems (Days 5-7)
**Goal:** Build order management, invoicing, and notification infrastructure

#### 3.1 Extend `order-inquiry` Schema
**Location:** `backend/src/api/order-inquiry/content-types/order-inquiry/schema.json`

```typescript
// Additional attributes
{
  invoice: { type: 'relation', relation: 'oneToOne', target: 'api::invoice.invoice' },
  paymentStatus: { type: 'enumeration', enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  adminNotes: { type: 'text' },
  shippingTrackingNumber: { type: 'string' }
}
```

#### 3.2 `invoice` Content Type
**Location:** `backend/src/api/invoice/`

```typescript
{
  invoiceNumber: { type: 'string', required: true, unique: true },
  order: { type: 'relation', relation: 'oneToOne', target: 'api::order-inquiry.order-inquiry', mappedBy: 'invoice' },
  subtotal: { type: 'decimal', required: true },
  tax: { type: 'decimal', default: 0 },
  total: { type: 'decimal', required: true },
  dueDate: { type: 'date' },
  paidDate: { type: 'date' },
  status: { type: 'enumeration', enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  lineItems: { type: 'json' },
  pdfUrl: { type: 'string' }
}
```

**Line Items JSON Structure:**
```json
[
  {
    "description": "Product Name - 28g",
    "quantity": 10,
    "unitPrice": 150.00,
    "total": 1500.00
  }
]
```

#### 3.3 Invoice Service
**Location:** `backend/src/services/invoice-service.ts`

- Generate invoice number: `INV-YYYYMMDD-XXXX` (sequential)
- PDF generation using `pdfkit` (server-side)
- Integration with existing email service at `backend/src/services/email.ts`
- Store PDF in Strapi media library

#### 3.4 `notification` Content Type
**Location:** `backend/src/api/notification/`

```typescript
{
  type: { type: 'enumeration', enum: ['new_order', 'low_stock', 'payment_received'], required: true },
  title: { type: 'string', required: true },
  message: { type: 'text' },
  isRead: { type: 'boolean', default: false },
  relatedOrder: { type: 'relation', relation: 'manyToOne', target: 'api::order-inquiry.order-inquiry' },
  adminUser: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' }
}
```

#### 3.5 Notification Polling Endpoint
**Endpoint:** `GET /api/notifications/unread`

```typescript
// Response
{
  unreadCount: 5,
  notifications: [
    { id: 1, type: 'new_order', title: 'New Order #INQ-20260115-0001', createdAt: '...' },
    // ...
  ]
}
```

**Note:** Using polling (30s interval) initially for simpler deployment. Can migrate to WebSocket later if needed.

---

### Phase 4: Frontend — Media Hub (Days 8-11)
**Goal:** Build reseller-facing media browsing and download experience

#### 4.1 Page Structure
**Location:** `frontend/src/app/(portal)/media-hub/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ Media Hub                                    [Search...] 🔍 │
├─────────────────────────────────────────────────────────────┤
│ [All] [Product Photos] [Marketing] [Packaging] [Brand]     │
├──────────────┬──────────────────────────────────────────────┤
│ FILTERS      │  Sort: [Newest ▼]                            │
│              │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│ Tags         │  │     │ │     │ │     │ │     │             │
│ ☑ Indica     │  │ IMG │ │ IMG │ │ IMG │ │ IMG │             │
│ ☑ Hybrid     │  │     │ │     │ │     │ │     │             │
│ ☐ Sativa     │  └─────┘ └─────┘ └─────┘ └─────┘             │
│              │  ┌─────┐ ┌─────────┐ ┌─────┐                 │
│ File Type    │  │     │ │         │ │     │                 │
│ ☑ Images     │  │ IMG │ │   IMG   │ │ IMG │                 │
│ ☑ Videos     │  │     │ │         │ │     │                 │
│ ☐ PDFs       │  └─────┘ └─────────┘ └─────┘                 │
└──────────────┴──────────────────────────────────────────────┘
```

#### 4.2 Components
**Location:** `frontend/src/components/media/`

| Component | Description |
|-----------|-------------|
| `MediaAssetCard.tsx` | Thumbnail, title, file size badge, download count, download button |
| `AssetDetailModal.tsx` | Full preview (image viewer, video player, PDF embed), metadata, download |
| `CategoryTabs.tsx` | Reusable tab navigation with counts |
| `TagFilter.tsx` | Checkbox list with search, collapsible sections |
| `MasonryGrid.tsx` | CSS columns or `react-masonry-css` wrapper |
| `CampaignKitCard.tsx` | Cover image, name, asset count, "View Kit" button |
| `CampaignKitBuilder.tsx` | Modal with asset checkboxes, select all/none, download selected |

#### 4.3 Media Store
**Location:** `frontend/src/stores/mediaStore.ts`

```typescript
interface MediaState {
  assets: MediaAsset[];
  tags: Tag[];
  campaignKits: CampaignKit[];
  selectedCategory: Category | 'all';
  searchQuery: string;
  selectedTags: string[];
  sortBy: 'newest' | 'downloads' | 'alphabetical';
  isLoading: boolean;
  
  // Actions
  fetchAssets: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchCampaignKits: () => Promise<void>;
  downloadAsset: (id: number) => Promise<void>;
  downloadCampaignKit: (kitId: number, assetIds: number[]) => Promise<void>;
  setFilters: (filters: Partial<MediaFilters>) => void;
}
```

#### 4.4 API Functions
**Location:** `frontend/src/lib/api/media.ts`

```typescript
export async function getMediaAssets(filters: MediaFilters): Promise<MediaAsset[]>
export async function getMediaAsset(id: number): Promise<MediaAsset>
export async function downloadAsset(id: number): Promise<{ url: string }>
export async function getTags(): Promise<Tag[]>
export async function getCampaignKits(): Promise<CampaignKit[]>
export async function downloadCampaignKit(kitId: number, assetIds: number[]): Promise<Blob>
```

---

### Phase 5: Frontend — Admin Portal (Days 12-18)
**Goal:** Build comprehensive admin management interface

#### 5.1 Dashboard
**Location:** `frontend/src/app/(admin-portal)/dashboard/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard                               🔔 (3) [User] │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│ │ Orders    │ │ Revenue   │ │ Pending   │ │ Low Stock │     │
│ │ Today: 12 │ │ $4,250    │ │ 5 orders  │ │ 3 items   │     │
│ │ ↑ 20%     │ │ ↑ 15%     │ │           │ │ ⚠️        │     │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
├─────────────────────────────────────────────────────────────┤
│ Recent Orders                          [View All Orders →]  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ #INQ-001 │ ABC Company │ Pending  │ $450 │ 10 min ago  │ │
│ │ #INQ-002 │ XYZ Corp    │ Approved │ $820 │ 1 hour ago  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2 Order Management
**Location:** `frontend/src/app/(admin-portal)/orders/`

| Page | Features |
|------|----------|
| `page.tsx` | Filterable/sortable DataTable, status badges, bulk actions, search |
| `[id]/page.tsx` | Full order detail view (see below) |

**Order Detail View Features:**
- Status update dropdown (pending → reviewing → approved → fulfilled)
- Admin notes editor (auto-save with debounce)
- Invoice section: Generate / View / Send Email buttons
- Payment status toggle (unpaid → partial → paid)
- Customer info panel (company, contact, order history link)
- Order items with customization details
- Shipping tracking number input

#### 5.3 Media Management
**Location:** `frontend/src/app/(admin-portal)/media/`

| Page | Features |
|------|----------|
| `page.tsx` | Asset list with CRUD, upload modal, bulk delete |
| `tags/page.tsx` | Tag list, create/edit/delete, usage count |
| `campaign-kits/page.tsx` | Kit list, create/edit with drag-drop asset ordering |

#### 5.4 Product Management
**Location:** `frontend/src/app/(admin-portal)/products/`

| Page | Features |
|------|----------|
| `page.tsx` | Product list, search, category filter, status toggle |
| `[id]/page.tsx` | Edit product, inventory integration (stock levels, threshold) |
| `new/page.tsx` | Create new product form |

#### 5.5 User Management
**Location:** `frontend/src/app/(admin-portal)/users/`

| Page | Features |
|------|----------|
| `page.tsx` | Reseller list, search by company/email, status filter |
| `[id]/page.tsx` | View reseller details, order history, suspend/unsuspend toggle |

**Note:** No approval workflow — users are auto-approved on registration. Suspend sets `blocked: true` on user record.

#### 5.6 Admin Components
**Location:** `frontend/src/components/admin/`

| Component | Description |
|-----------|-------------|
| `DataTable.tsx` | Reusable sortable/filterable table with pagination, row selection |
| `StatusBadge.tsx` | Color-coded status display (configurable colors per status) |
| `StatsCard.tsx` | Metric display with trend indicator (up/down arrow, percentage) |
| `NotificationBell.tsx` | Unread count badge, dropdown list, mark as read |
| `InvoiceModal.tsx` | Preview invoice, edit line items, send email button |
| `AdminSidebar.tsx` | Vertical navigation for admin portal |
| `QuickActions.tsx` | Floating action buttons for common tasks |

#### 5.7 Admin Store
**Location:** `frontend/src/stores/adminStore.ts`

```typescript
interface AdminState {
  notifications: Notification[];
  unreadCount: number;
  isPolling: boolean;
  stats: DashboardStats | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}
```

---

### Phase 6: Real-time & Polish (Days 19-21)
**Goal:** Add real-time notifications and production hardening

#### 6.1 Notification Polling Implementation

```typescript
// In admin layout
useEffect(() => {
  const interval = setInterval(() => {
    adminStore.fetchNotifications();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**Features:**
- Toast notification on new items (using existing Sonner integration)
- Optional sound notification (stored in localStorage)
- Badge count in navigation

#### 6.2 Strapi Lifecycle Hooks

**Order Notification:**
**Location:** `backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`

```typescript
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    // Create notification for all admin users
    await strapi.entityService.create('api::notification.notification', {
      data: {
        type: 'new_order',
        title: `New Order #${result.inquiryNumber}`,
        message: `${result.customerName} placed a new order`,
        relatedOrder: result.id,
        isRead: false
      }
    });
  }
};
```

**Low Stock Notification:**
**Location:** `backend/src/api/inventory/content-types/inventory/lifecycles.ts`

```typescript
module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    if (result.quantity <= result.lowStockThreshold) {
      // Create low stock notification
      await strapi.entityService.create('api::notification.notification', {
        data: {
          type: 'low_stock',
          title: `Low Stock Alert`,
          message: `${result.product.name} is running low (${result.quantity} remaining)`,
          isRead: false
        }
      });
    }
  }
};
```

#### 6.3 Permission Configuration

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on all content types |
| **Authenticated (Reseller)** | Read media-assets, own orders only, create order-inquiry |
| **Public** | None (redirect to login) |

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BC Flame Data Model                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │   media-asset   │◄───────►│       tag       │
├─────────────────┤         ├─────────────────┤  M:M    ├─────────────────┤
│ id              │         │ id              │         │ id              │
│ username        │         │ title           │         │ name            │
│ email           │         │ description     │         │ slug            │
│ userType ●NEW   │         │ category        │         └─────────────────┘
│ companyName     │         │ file            │
│ partnerStatus   │         │ thumbnail       │         ┌─────────────────┐
│ partnerTier     │         │ downloadCount   │         │  campaign-kit   │
│ blocked         │         │ fileSize        │         ├─────────────────┤
└────────┬────────┘         │ fileType        │         │ id              │
         │                  └────────┬────────┘         │ name            │
         │                           │ M:M              │ description     │
         │                           ▼                  │ coverImage      │
         │                  ┌─────────────────┐         │ assets[] ───────┤
         │                  │     product     │         │ isActive        │
         │                  ├─────────────────┤         └─────────────────┘
         │                  │ id              │
         │                  │ name            │
         │                  │ category        │
         │                  │ strain          │
         │                  │ isActive        │
         │                  └────────┬────────┘
         │                           │ 1:M
         │                           ▼
         │                  ┌─────────────────┐
         │                  │   inventory     │
         │                  ├─────────────────┤
         │                  │ id              │
         │                  │ product         │
         │                  │ quantity        │
         │                  │ lowStockThresh  │
         │                  └─────────────────┘
         │
         │ 1:M
         ▼
┌─────────────────┐         ┌─────────────────┐
│  order-inquiry  │────────►│     invoice     │
├─────────────────┤  1:1    ├─────────────────┤
│ id              │         │ id              │
│ inquiryNumber   │         │ invoiceNumber   │
│ status          │         │ subtotal        │
│ user            │         │ tax             │
│ paymentStatus●  │         │ total           │
│ adminNotes ●    │         │ dueDate         │
│ trackingNum ●   │         │ paidDate        │
│ invoice ●       │         │ status          │
└────────┬────────┘         │ lineItems       │
         │                  │ pdfUrl          │
         │ M:1              └─────────────────┘
         ▼
┌─────────────────┐
│  notification   │
├─────────────────┤
│ id              │
│ type            │
│ title           │
│ message         │
│ isRead          │
│ relatedOrder    │
│ adminUser       │
└─────────────────┘

● = New/Modified field
```

---

## API Endpoint Specifications

### Media Hub Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/media-assets` | List assets with filters | Authenticated |
| GET | `/api/media-assets/:id` | Get single asset | Authenticated |
| POST | `/api/media-assets/:id/download` | Increment count, get URL | Authenticated |
| GET | `/api/tags` | List all tags | Authenticated |
| GET | `/api/campaign-kits` | List active kits | Authenticated |
| POST | `/api/campaign-kits/:id/download` | Download zip of selected assets | Authenticated |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/notifications/unread` | Get unread notifications | Admin |
| PUT | `/api/notifications/:id/read` | Mark notification as read | Admin |
| POST | `/api/notifications/read-all` | Mark all as read | Admin |
| POST | `/api/invoices/generate` | Generate invoice for order | Admin |
| POST | `/api/invoices/:id/send` | Send invoice email | Admin |
| GET | `/api/invoices/:id/pdf` | Download invoice PDF | Admin |

### Query Parameters for Media Assets

```
GET /api/media-assets?
  filters[category][$eq]=product_photos&
  filters[tags][slug][$in][0]=indica&
  filters[tags][slug][$in][1]=hybrid&
  sort=downloadCount:desc&
  pagination[page]=1&
  pagination[pageSize]=20&
  populate=thumbnail,tags,products
```

---

## Component Architecture

```
frontend/src/components/
├── media/
│   ├── MediaAssetCard.tsx
│   ├── AssetDetailModal.tsx
│   ├── CategoryTabs.tsx
│   ├── TagFilter.tsx
│   ├── MasonryGrid.tsx
│   ├── CampaignKitCard.tsx
│   ├── CampaignKitBuilder.tsx
│   └── index.ts
├── admin/
│   ├── DataTable.tsx
│   ├── StatusBadge.tsx
│   ├── StatsCard.tsx
│   ├── NotificationBell.tsx
│   ├── InvoiceModal.tsx
│   ├── AdminSidebar.tsx
│   ├── OrderDetailPanel.tsx
│   ├── UserDetailPanel.tsx
│   └── index.ts
└── ui/
    └── (existing shadcn components)
```

---

## State Management Approach

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `authStore` | User authentication, JWT, userType | Cookie (jwt), Memory |
| `mediaStore` | Media assets, filters, downloads | Memory |
| `adminStore` | Notifications, dashboard stats | Memory |
| `cartStore` | (existing) Shopping cart | Memory |

**Polling Strategy:**
- Admin dashboard polls `/api/notifications/unread` every 30 seconds
- Polling starts on admin portal mount, stops on unmount
- Initial load is higher frequency (every 10s for first minute), then 30s

---

## Authentication/Authorization Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────►│  Strapi     │────►│  JWT with   │
│   Form      │     │  /auth/local│     │  userType   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   Middleware    │
                                      │   checks JWT    │
                                      └────────┬────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
                   ┌───────────┐         ┌───────────┐         ┌───────────┐
                   │ userType= │         │ userType= │         │   No JWT  │
                   │  'admin'  │         │ 'reseller'│         │           │
                   └─────┬─────┘         └─────┬─────┘         └─────┬─────┘
                         │                     │                     │
                         ▼                     ▼                     ▼
                   ┌───────────┐         ┌───────────┐         ┌───────────┐
                   │  /admin-  │         │  /portal/ │         │  /login   │
                   │  portal/* │         │     *     │         │           │
                   └───────────┘         └───────────┘         └───────────┘
```

---

## Real-time Notification Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Notification Flow                           │
└─────────────────────────────────────────────────────────────────┘

  Trigger Events                    Lifecycle Hooks              Storage
┌─────────────┐               ┌─────────────────────┐      ┌─────────────┐
│ New Order   │──────────────►│ order-inquiry/      │─────►│ notification│
│ Created     │               │ afterCreate()       │      │ table       │
└─────────────┘               └─────────────────────┘      └──────┬──────┘
                                                                  │
┌─────────────┐               ┌─────────────────────┐             │
│ Stock Level │──────────────►│ inventory/          │─────────────┤
│ Low         │               │ afterUpdate()       │             │
└─────────────┘               └─────────────────────┘             │
                                                                  │
┌─────────────┐               ┌─────────────────────┐             │
│ Payment     │──────────────►│ invoice/            │─────────────┤
│ Received    │               │ afterUpdate()       │             │
└─────────────┘               └─────────────────────┘             │
                                                                  │
                                                                  ▼
                              ┌─────────────────────┐      ┌─────────────┐
                              │ GET /notifications/ │◄─────│ Admin       │
                              │ unread (polling)    │      │ Frontend    │
                              └─────────────────────┘      └─────────────┘
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │ NotificationBell    │
                              │ component updates   │
                              └─────────────────────┘
```

**Polling Considerations (Self-Hosted):**
- 30-second interval reduces server load while maintaining near-real-time updates
- Only fetches last 10 unread notifications per request
- Can implement WebSocket upgrade path later if needed

---

## Invoice System Design

### Invoice Number Format
`INV-YYYYMMDD-XXXX` (e.g., `INV-20260115-0042`)

### Generation Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────►│ POST /api/  │────►│  Invoice    │────►│   Store     │
│ clicks      │     │ invoices/   │     │  Service    │     │   PDF in    │
│ "Generate"  │     │ generate    │     │  (pdfkit)   │     │   Media     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Invoice     │
                                        │ record with │
                                        │ pdfUrl      │
                                        └─────────────┘
```

### PDF Template Structure
```
┌─────────────────────────────────────────────────────────────┐
│                         BC FLAME                            │
│                        INVOICE                              │
├─────────────────────────────────────────────────────────────┤
│ Invoice #: INV-20260115-0042       Date: January 15, 2026   │
│ Due Date: January 30, 2026         Status: Unpaid           │
├─────────────────────────────────────────────────────────────┤
│ Bill To:                           Ship To:                 │
│ ABC Company                        Same                     │
│ John Doe                                                    │
│ john@abc.com                                                │
├─────────────────────────────────────────────────────────────┤
│ Description                    Qty    Unit Price    Total   │
├─────────────────────────────────────────────────────────────┤
│ OG Kush - 28g                  10     $150.00      $1,500   │
│ Blue Dream - 14g               5      $80.00       $400     │
│ Pre-roll Tubes (100pk)         2      $45.00       $90      │
├─────────────────────────────────────────────────────────────┤
│                                       Subtotal:   $1,990.00 │
│                                       Tax (0%):   $0.00     │
│                                       TOTAL:      $1,990.00 │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Files to Modify

### Frontend

| File | Modification |
|------|--------------|
| `frontend/src/app/(portal)/layout.tsx` | Remove Inventory from navigation |
| `frontend/src/middleware.ts` | Add admin routes, role-based routing |
| `frontend/src/stores/authStore.ts` | Add `userType` to User interface |
| `frontend/src/types/index.ts` | Add MediaAsset, Invoice, Notification types |

### Backend

| File | Modification |
|------|--------------|
| `backend/src/extensions/users-permissions/content-types/user/schema.json` | Add `userType` field |
| `backend/src/api/order-inquiry/content-types/order-inquiry/schema.json` | Add invoice, payment fields |
| `backend/config/plugins.ts` | Configure permissions for new content types |

### New Files to Create

| Path | Purpose |
|------|---------|
| `frontend/src/app/(admin-portal)/layout.tsx` | Admin portal layout |
| `frontend/src/app/(admin-portal)/dashboard/page.tsx` | Admin dashboard |
| `frontend/src/app/(admin-portal)/orders/*` | Order management |
| `frontend/src/app/(admin-portal)/media/*` | Media management |
| `frontend/src/app/(admin-portal)/products/*` | Product management |
| `frontend/src/app/(admin-portal)/users/*` | User management |
| `frontend/src/app/(portal)/media-hub/page.tsx` | Reseller media hub |
| `frontend/src/stores/mediaStore.ts` | Media state management |
| `frontend/src/stores/adminStore.ts` | Admin state management |
| `frontend/src/components/media/*` | Media components |
| `frontend/src/components/admin/*` | Admin components |
| `backend/src/api/media-asset/*` | Media asset content type |
| `backend/src/api/tag/*` | Tag content type |
| `backend/src/api/campaign-kit/*` | Campaign kit content type |
| `backend/src/api/invoice/*` | Invoice content type |
| `backend/src/api/notification/*` | Notification content type |
| `backend/src/services/invoice-service.ts` | Invoice generation service |

---

## Testing Strategy

### Unit Tests (Vitest)

| Target | Tests |
|--------|-------|
| `authStore` | Login flow, role detection, logout |
| `mediaStore` | Filter logic, download tracking |
| `adminStore` | Notification polling, stats aggregation |
| Invoice Service | Number generation, line item calculation |

### Component Tests (React Testing Library)

| Component | Tests |
|-----------|-------|
| `MediaAssetCard` | Renders correctly, download button works |
| `DataTable` | Sorting, filtering, pagination |
| `StatusBadge` | Correct colors per status |
| `InvoiceModal` | Form validation, send email flow |

### API Tests (Strapi Test Utils)

| Endpoint | Tests |
|----------|-------|
| Media asset download | Increments count, returns URL |
| Campaign kit zip | Generates valid zip, includes selected assets |
| Invoice generation | Creates record, generates PDF |
| Notification polling | Returns only unread, respects limit |

### E2E Tests (Playwright)

| Flow | Tests |
|------|-------|
| Reseller Login → Media Hub | Browse, filter, download asset |
| Admin Login → Dashboard | View stats, click through to orders |
| Admin Order Management | Update status, add notes, generate invoice |
| Permission Boundary | Reseller cannot access /admin-portal/* |

### Permission Tests

```typescript
describe('Role-based access', () => {
  it('redirects reseller from /admin-portal to /dashboard', async () => {
    // Login as reseller
    // Navigate to /admin-portal/dashboard
    // Assert redirect to /dashboard
  });
  
  it('allows admin access to /admin-portal', async () => {
    // Login as admin
    // Navigate to /admin-portal/dashboard
    // Assert page loads correctly
  });
});
```

---

## Dependencies to Install

### Frontend
```bash
npm install react-masonry-css archiver-web pdfjs-dist @tanstack/react-table
```

### Backend
```bash
npm install pdfkit archiver
```

---

## Environment Variables

### Frontend (.env.local)
```env
# Existing
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# New (if needed)
NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL=30000
```

### Backend (.env)
```env
# Existing variables...

# New
INVOICE_STORAGE_PATH=./public/uploads/invoices
```

---

## Rollout Plan

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 days | Role system, admin layout, nav fix |
| Phase 2 | 2 days | Media content types, tag system |
| Phase 3 | 3 days | Invoice system, notifications, order extensions |
| Phase 4 | 4 days | Media Hub UI complete |
| Phase 5 | 7 days | Full Admin Portal UI |
| Phase 6 | 3 days | Real-time features, polish, testing |

**Total: 21 days**

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Media Hub Load Time | < 2 seconds |
| Asset Download Success Rate | > 99% |
| Admin Dashboard Load Time | < 1.5 seconds |
| Notification Delivery Latency | < 30 seconds |
| Invoice Generation Time | < 3 seconds |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large zip file generation timeout | Implement streaming, set appropriate timeout, add progress indicator |
| Polling load on server | Optimize query, add caching, implement debounce |
| PDF generation memory usage | Stream PDF to disk, use worker thread |
| Permission leaks | Comprehensive E2E tests, middleware checks on all routes |

---

## Future Enhancements (Post-MVP)

1. **WebSocket notifications** — Replace polling with real-time WebSocket connection
2. **Bulk invoice generation** — Generate invoices for multiple orders at once
3. **Analytics dashboard** — Charts, revenue trends, top products
4. **Reseller tier pricing** — Different pricing based on partner tier
5. **Asset versioning** — Track versions of marketing materials
6. **Scheduled campaigns** — Auto-release campaign kits on specific dates
