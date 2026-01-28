# BC Flame Implementation Plan

**Last Updated:** 2026-01-21
**Current Phase:** Portal Enhancements

---

## Project Overview

BC Flame Premium Client Portal is a B2B cannabis partner portal with:
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Strapi 4.16.2 CMS + PostgreSQL 16
- **Deployment:** Docker containerized
- **Testing:** Vitest (TDD approach)

**Live Services:**
- Frontend: http://localhost:3000
- Strapi Admin: http://localhost:1337/admin
- Strapi API: http://localhost:1337/api
- PostgreSQL: localhost:5432

---

## NEW: Enhancement Requirements (2026-01-21)

### Summary of Changes Requested

1. **Product Field Updates**
   - Pricing unit: per pound OR per half pound
   - Bud style options: 1 bud, 2 buds, 3 buds, 4 buds
   - New dropdown fields: Grade Category, Sizes Available
   - Strain Type: Indica or Hybrid only (no Sativa)

2. **Business Color Theme**
   - Apply brand colors: #000 (black), #d00900 (red), #da2600 (orange), #ffbd07 (yellow)

3. **Partner Management**
   - Admin section to view business partners with order history

4. **Messaging System**
   - Message button for centralized conversations

---

## Part 1: Product Field Updates

### 1.1 Pricing Unit Enhancement

**Requirement:** Sales should be set per pound OR per half pound.

**Current State:**
- `base_price_per_pound` (decimal) - stores price
- `pricing_model` (enum) - "per_pound" or "tiered"

**Implementation:**

#### Backend Schema Change
**File:** `backend/src/api/product/content-types/product/schema.json`

Add new field after `pricing_model` (line 86):
```json
"pricing_unit": {
  "type": "enumeration",
  "enum": ["per_pound", "per_half_pound"],
  "default": "per_pound"
}
```

#### Frontend Type Update
**File:** `frontend/src/types/product.ts`

Update `ProductAttributes` interface (after line 81):
```typescript
pricing_unit?: 'per_pound' | 'per_half_pound';
```

#### API Client Update
**File:** `frontend/src/lib/api/admin-products.ts`

Update `CreateProductData` interface (after line 48):
```typescript
pricing_unit?: 'per_pound' | 'per_half_pound';
```

#### Admin Form Update
**File:** `frontend/src/app/admin-portal/products/new/page.tsx`

1. Add to form state (line 50):
```typescript
pricing_unit: 'per_pound',
```

2. Update pricing section (after line 291, before "On Sale" checkbox):
```tsx
<div className="space-y-2">
  <Label htmlFor="pricing_unit">Pricing Unit</Label>
  <Select
    value={formData.pricing_unit}
    onValueChange={(value: 'per_pound' | 'per_half_pound') =>
      handleFormChange('pricing_unit', value)
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="per_pound">Per Pound (1 lb)</SelectItem>
      <SelectItem value="per_half_pound">Per Half Pound (0.5 lb)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

3. Update price label (line 267):
```tsx
<Label htmlFor="price">
  Base Price ($) {formData.pricing_unit === 'per_half_pound' ? 'per 0.5 lb' : 'per lb'}
</Label>
```

---

### 1.2 New Product Enumeration Fields

**Requirement:** Add dropdown fields for Grade Category, Sizes Available.

**Note:** Strain Type (Indica/Hybrid) already exists as the `category` field. The existing schema already excludes Sativa.

#### Backend Schema Change
**File:** `backend/src/api/product/content-types/product/schema.json`

Add after `flavor_profile` (line 54):
```json
"grade_category": {
  "type": "enumeration",
  "enum": ["High-end", "Mid-end", "Low-end"],
  "required": false
},
"sizes_available": {
  "type": "enumeration",
  "enum": ["Large", "Medium", "Small"],
  "required": false
},
```

#### Frontend Type Update
**File:** `frontend/src/types/product.ts`

Add to `ProductAttributes` interface (after line 74):
```typescript
grade_category?: 'High-end' | 'Mid-end' | 'Low-end';
sizes_available?: 'Large' | 'Medium' | 'Small';
```

#### API Client Update
**File:** `frontend/src/lib/api/admin-products.ts`

Add to `CreateProductData` interface:
```typescript
grade_category?: 'High-end' | 'Mid-end' | 'Low-end';
sizes_available?: 'Large' | 'Medium' | 'Small';
```

#### Admin Form Update
**File:** `frontend/src/app/admin-portal/products/new/page.tsx`

Add after THC Content field (after line 193):
```tsx
<div className="space-y-2">
  <Label htmlFor="grade_category">Grade Category</Label>
  <Select
    value={formData.grade_category || ''}
    onValueChange={(value) => handleFormChange('grade_category', value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select grade" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="High-end">High-end</SelectItem>
      <SelectItem value="Mid-end">Mid-end</SelectItem>
      <SelectItem value="Low-end">Low-end</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label htmlFor="sizes_available">Sizes Available</Label>
  <Select
    value={formData.sizes_available || ''}
    onValueChange={(value) => handleFormChange('sizes_available', value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select size" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Large">Large</SelectItem>
      <SelectItem value="Medium">Medium</SelectItem>
      <SelectItem value="Small">Small</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### 1.3 Bud Style Updates: 1-4 Buds Options

**Requirement:** Bud style options should be: 1 bud, 2 buds, 3 buds, 4 buds.

**Current State:**
- `category` enum: ["trim_quality", "flower_grade", "visual_style"]

**Implementation:**

#### Backend Schema Change
**File:** `backend/src/api/bud-style/content-types/bud-style/schema.json`

Update category enum (line 22):
```json
"category": {
  "type": "enumeration",
  "enum": ["trim_quality", "flower_grade", "visual_style", "bud_count"],
  "required": true
}
```

#### Seeder Update
**File:** `backend/database/seeders/customization-seeder.ts`

1. Update type definition (line 13):
```typescript
type BudCategory = 'trim_quality' | 'flower_grade' | 'visual_style' | 'bud_count';
```

2. Add new entries to `budStyles` array (after line 37):
```typescript
{ name: '1 Bud', category: 'bud_count', description: 'Single premium bud', sort_order: 9 },
{ name: '2 Buds', category: 'bud_count', description: 'Two select buds', sort_order: 10 },
{ name: '3 Buds', category: 'bud_count', description: 'Three quality buds', sort_order: 11 },
{ name: '4 Buds', category: 'bud_count', description: 'Four choice buds', sort_order: 12 },
```

#### Frontend Type Update
**File:** `frontend/src/types/customization.ts`

Update `BudStyle` interface category type to include `'bud_count'`.

---

## Part 2: Business Color Theme

### 2.1 Brand Colors

**Business Colors:**
- Black: #000000
- Red: #d00900
- Orange: #da2600
- Yellow: #ffbd07

**HSL Conversions:**
- Black: 0 0% 0%
- Red (#d00900): 4 100% 41%
- Orange (#da2600): 11 100% 43%
- Yellow (#ffbd07): 44 100% 51%

### 2.2 CSS Variable Updates

**File:** `frontend/src/app/globals.css`

Replace current color scheme in `:root` (lines 6-31):
```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 0%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 0%;

  /* Brand Colors */
  --primary: 11 100% 43%;          /* Orange #da2600 */
  --primary-foreground: 0 0% 100%;
  --secondary: 44 100% 51%;         /* Yellow #ffbd07 */
  --secondary-foreground: 0 0% 0%;
  --destructive: 4 100% 41%;        /* Red #d00900 */
  --destructive-foreground: 0 0% 100%;

  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 44 100% 92%;            /* Light yellow */
  --accent-foreground: 0 0% 0%;

  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 11 100% 43%;              /* Orange ring */
  --radius: 0.5rem;

  /* Brand color utilities */
  --brand-black: 0 0% 0%;
  --brand-red: 4 100% 41%;
  --brand-orange: 11 100% 43%;
  --brand-yellow: 44 100% 51%;

  /* Charts using brand colors */
  --chart-1: 4 100% 41%;            /* Red */
  --chart-2: 11 100% 43%;           /* Orange */
  --chart-3: 44 100% 51%;           /* Yellow */
  --chart-4: 0 0% 20%;              /* Dark gray */
  --chart-5: 0 0% 40%;              /* Medium gray */
}

.dark {
  --background: 0 0% 5%;
  --foreground: 0 0% 98%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 98%;

  /* Brand Colors (same in dark mode) */
  --primary: 11 100% 48%;           /* Slightly lighter orange */
  --primary-foreground: 0 0% 100%;
  --secondary: 44 100% 55%;         /* Slightly lighter yellow */
  --secondary-foreground: 0 0% 0%;
  --destructive: 4 100% 45%;        /* Slightly lighter red */
  --destructive-foreground: 0 0% 100%;

  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 44 30% 20%;
  --accent-foreground: 0 0% 98%;

  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 11 100% 48%;

  /* Brand utilities (same) */
  --brand-black: 0 0% 0%;
  --brand-red: 4 100% 45%;
  --brand-orange: 11 100% 48%;
  --brand-yellow: 44 100% 55%;
}
```

### 2.3 Tailwind Config Update

**File:** `frontend/tailwind.config.ts`

Add brand colors to theme extension (after line 52):
```typescript
brand: {
  black: 'hsl(var(--brand-black))',
  red: 'hsl(var(--brand-red))',
  orange: 'hsl(var(--brand-orange))',
  yellow: 'hsl(var(--brand-yellow))',
},
```

### 2.4 Component Color Updates

Update hardcoded colors in components to use CSS variables:

| Current | Replace With |
|---------|-------------|
| `bg-red-500` | `bg-destructive` |
| `text-red-500` | `text-destructive` |
| `bg-orange-500`, `bg-orange-600` | `bg-primary` |
| `text-orange-500` | `text-primary` |
| `bg-yellow-500` | `bg-secondary` |
| `text-yellow-800` | `text-secondary-foreground` |

**Files to update:**
- `frontend/src/components/products/ProductCard.tsx`
- `frontend/src/components/products/StepIndicator.tsx`
- `frontend/src/components/admin/StatusBadge.tsx`
- `frontend/src/app/admin-portal/users/page.tsx` (status badges)
- `frontend/src/app/admin-portal/users/[id]/page.tsx` (status badges)

---

## Part 3: Partner Management Enhancement

### 3.1 Current State

The admin user management already includes:
- User list at `/admin-portal/users/page.tsx`
- User detail at `/admin-portal/users/[id]/page.tsx` with order history
- Functions: `getUserOrderSummary()`, `getUserOrders()`

### 3.2 Existing Features (Already Implemented)

The user detail page already shows:
- Total orders count
- Total revenue
- Last order date
- Recent orders list with "View All" link
- Partner company info
- Business license
- Contact information

**No major changes needed** - The functionality for viewing partners and their order history already exists.

### 3.3 Optional Enhancements

If desired, these minor improvements could be added:

1. **Add order stats to user list table:**
   - Show total orders and revenue directly in the table columns

2. **Add export functionality:**
   - Export partner list with order history to CSV

---

## Part 4: Messaging System

### 4.1 Database Schema

#### Conversation Content Type
**Create:** `backend/src/api/conversation/content-types/conversation/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "conversations",
  "info": {
    "singularName": "conversation",
    "pluralName": "conversations",
    "displayName": "Conversation",
    "description": "Chat conversations between admin and partners"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "participant_admin": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "participant_partner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "lastMessageAt": {
      "type": "datetime"
    },
    "lastMessagePreview": {
      "type": "text",
      "maxLength": 200
    },
    "unreadCount_admin": {
      "type": "integer",
      "default": 0
    },
    "unreadCount_partner": {
      "type": "integer",
      "default": 0
    },
    "status": {
      "type": "enumeration",
      "enum": ["active", "archived"],
      "default": "active"
    },
    "messages": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::message.message",
      "mappedBy": "conversation"
    }
  }
}
```

#### Message Content Type
**Create:** `backend/src/api/message/content-types/message/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "messages",
  "info": {
    "singularName": "message",
    "pluralName": "messages",
    "displayName": "Message",
    "description": "Individual chat messages"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "conversation": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::conversation.conversation",
      "inversedBy": "messages"
    },
    "sender": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "content": {
      "type": "text",
      "required": true
    },
    "relatedOrder": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::order-inquiry.order-inquiry"
    },
    "isRead": {
      "type": "boolean",
      "default": false
    },
    "messageType": {
      "type": "enumeration",
      "enum": ["text", "system", "order_update"],
      "default": "text"
    }
  }
}
```

### 4.2 Backend API Endpoints

**Create:** `backend/src/api/conversation/routes/custom.ts`

```typescript
export default {
  routes: [
    {
      method: 'GET',
      path: '/conversations',
      handler: 'conversation.find',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/conversations/:id',
      handler: 'conversation.findOne',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/conversations/with-user/:userId',
      handler: 'conversation.findOrCreate',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/conversations/:id/messages',
      handler: 'conversation.getMessages',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/conversations/:id/messages',
      handler: 'conversation.sendMessage',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/conversations/:id/mark-read',
      handler: 'conversation.markAsRead',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/conversations/unread-count',
      handler: 'conversation.getUnreadCount',
      config: { policies: [] }
    }
  ]
};
```

**Create:** `backend/src/api/conversation/controllers/conversation.ts`

Controller with methods:
- `find()` - Get all conversations for current user
- `findOne()` - Get conversation with recent messages
- `findOrCreate()` - Get or create conversation with specific user
- `getMessages()` - Paginated messages for conversation
- `sendMessage()` - Send new message
- `markAsRead()` - Mark conversation messages as read
- `getUnreadCount()` - Total unread message count

### 4.3 Frontend Implementation

#### API Client
**Create:** `frontend/src/lib/api/conversations.ts`

```typescript
import { strapiApi } from './strapi';

export interface Conversation {
  id: number;
  attributes: {
    participant_admin: { data: User };
    participant_partner: { data: User };
    lastMessageAt: string;
    lastMessagePreview: string;
    unreadCount_admin: number;
    unreadCount_partner: number;
    status: 'active' | 'archived';
  };
}

export interface Message {
  id: number;
  attributes: {
    content: string;
    sender: { data: User };
    relatedOrder?: { data: any };
    isRead: boolean;
    messageType: 'text' | 'system' | 'order_update';
    createdAt: string;
  };
}

// Functions
export async function getConversations(): Promise<Conversation[]> { /* ... */ }
export async function getConversation(id: number): Promise<Conversation> { /* ... */ }
export async function findOrCreateConversation(userId: number): Promise<Conversation> { /* ... */ }
export async function getMessages(conversationId: number, page?: number): Promise<Message[]> { /* ... */ }
export async function sendMessage(conversationId: number, content: string, orderId?: number): Promise<Message> { /* ... */ }
export async function markAsRead(conversationId: number): Promise<void> { /* ... */ }
export async function getUnreadCount(): Promise<number> { /* ... */ }
```

#### Navigation Update
**File:** `frontend/src/app/admin-portal/layout.tsx`

Add Messages to nav items (after line 48):
```typescript
{ href: '/admin-portal/messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
```

Add import:
```typescript
import { MessageSquare } from 'lucide-react';
```

#### Messages List Page
**Create:** `frontend/src/app/admin-portal/messages/page.tsx`

Features:
- List all conversations
- Show partner name, company, last message preview
- Unread badge indicator
- Search by partner name
- Click to open conversation

#### Conversation Detail Page
**Create:** `frontend/src/app/admin-portal/messages/[id]/page.tsx`

Features:
- Message thread (newest at bottom)
- Auto-scroll to latest message
- Message input with send button
- Partner info in header
- Link to partner's orders

#### Message Button Component
**Create:** `frontend/src/components/admin/messages/MessageButton.tsx`

Reusable button that:
- Takes partnerId as prop
- Finds or creates conversation
- Navigates to conversation page

#### Integration Points

1. **User List Page** (`admin-portal/users/page.tsx`):
   - Add "Message" action in dropdown menu (after "Send Email", line 274)

2. **User Detail Page** (`admin-portal/users/[id]/page.tsx`):
   - Add "Message Partner" button in header actions (after "Send Email" button, line 181)

3. **Order Detail Page** (`admin-portal/orders/[id]/page.tsx`):
   - Add "Message about this order" button

---

## Part 5: Reseller Portal Messaging

### 5.1 Reseller Layout Update
**File:** `frontend/src/app/(portal)/layout.tsx`

Add Messages navigation item for resellers.

### 5.2 Reseller Messages Page
**Create:** `frontend/src/app/(portal)/messages/page.tsx`

Similar to admin but:
- Only shows conversation with admin
- Simpler interface (single conversation view)

---

## Implementation Phases

### Phase 1: Product Updates (2-3 days)
1. Backend schema changes for product fields
2. Seeder updates for bud styles
3. Frontend type updates
4. Admin form updates
5. Product display updates
6. Testing

### Phase 2: Color Theme (1-2 days)
1. CSS variable updates
2. Tailwind config updates
3. Component color replacements
4. Visual verification across all pages
5. Dark mode verification

### Phase 3: Messaging System (4-5 days)
1. Backend content types (Conversation, Message)
2. Backend controllers and routes
3. Backend lifecycle hooks for notifications
4. Frontend API client
5. Admin messages pages
6. Message components
7. Integration with user management
8. Reseller messages page
9. Testing

### Phase 4: Polish & Testing (2 days)
1. End-to-end testing
2. Mobile responsiveness
3. Performance optimization
4. Bug fixes

---

## Files to Create

### Backend
- `backend/src/api/conversation/content-types/conversation/schema.json`
- `backend/src/api/conversation/routes/custom.ts`
- `backend/src/api/conversation/controllers/conversation.ts`
- `backend/src/api/conversation/services/conversation.ts`
- `backend/src/api/message/content-types/message/schema.json`
- `backend/src/api/message/routes/message.ts`

### Frontend
- `frontend/src/lib/api/conversations.ts`
- `frontend/src/app/admin-portal/messages/page.tsx`
- `frontend/src/app/admin-portal/messages/[id]/page.tsx`
- `frontend/src/app/(portal)/messages/page.tsx`
- `frontend/src/components/admin/messages/MessageButton.tsx`
- `frontend/src/components/admin/messages/ConversationList.tsx`
- `frontend/src/components/admin/messages/MessageThread.tsx`
- `frontend/src/components/admin/messages/MessageInput.tsx`

## Files to Modify

### Backend
- `backend/src/api/product/content-types/product/schema.json`
- `backend/src/api/bud-style/content-types/bud-style/schema.json`
- `backend/database/seeders/customization-seeder.ts`

### Frontend
- `frontend/src/app/globals.css`
- `frontend/tailwind.config.ts`
- `frontend/src/types/product.ts`
- `frontend/src/types/customization.ts`
- `frontend/src/lib/api/admin-products.ts`
- `frontend/src/app/admin-portal/products/new/page.tsx`
- `frontend/src/app/admin-portal/products/[id]/page.tsx` (edit page)
- `frontend/src/app/admin-portal/layout.tsx`
- `frontend/src/app/admin-portal/users/page.tsx`
- `frontend/src/app/admin-portal/users/[id]/page.tsx`
- `frontend/src/app/(portal)/layout.tsx`
- `frontend/src/components/products/ProductCard.tsx`
- `frontend/src/components/products/ProductDetailClient.tsx`
- `frontend/src/components/products/StepIndicator.tsx`
- `frontend/src/components/admin/StatusBadge.tsx`

---

## What Your Project Manager Needs

### Resource Requirements
- **1 Full-stack Developer** - For all implementation work
- **Testing/QA** - For verification of all features

### Timeline Estimate
- **Total:** 9-12 working days
- Phase 1 (Product Updates): 2-3 days
- Phase 2 (Color Theme): 1-2 days
- Phase 3 (Messaging): 4-5 days
- Phase 4 (Testing/Polish): 2 days

### Dependencies
1. Strapi backend must be running for schema changes
2. Database access for seeder updates
3. No external service dependencies (messaging is internal)

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Schema changes affect existing products | Use default values, don't make fields required |
| Color changes break UI consistency | Systematic replacement with CSS variables |
| Messaging complexity | Start with polling, add WebSocket later if needed |

### Acceptance Criteria
1. Products can be priced per pound OR per half pound
2. Bud styles include 1-4 buds options
3. Products have Grade Category and Sizes Available dropdowns
4. Strain Type only shows Indica and Hybrid (already done - no Sativa in schema)
5. All UI uses brand colors (red, orange, yellow, black)
6. Admin can view all partners with their order history (already exists)
7. Admin and partners can exchange messages
8. Messages are tracked and centralized
9. All features work on mobile and desktop

### Task Breakdown for Project Management

#### Sprint 1: Product & Styling (3-4 days)
| Task | Estimate | Priority |
|------|----------|----------|
| Add `pricing_unit` field to product schema | 1 hour | High |
| Add `grade_category` field to product schema | 30 min | High |
| Add `sizes_available` field to product schema | 30 min | High |
| Add `bud_count` category to bud style schema | 30 min | High |
| Update customization seeder with 1-4 buds | 30 min | High |
| Update frontend TypeScript types | 1 hour | High |
| Update admin product form with new fields | 2 hours | High |
| Update CSS variables with brand colors | 1 hour | High |
| Update Tailwind config with brand colors | 30 min | High |
| Replace hardcoded colors in components | 3 hours | Medium |
| Update product card display | 1 hour | Medium |
| Testing and verification | 2 hours | High |

#### Sprint 2: Messaging System (5-6 days)
| Task | Estimate | Priority |
|------|----------|----------|
| Create Conversation content type | 1 hour | High |
| Create Message content type | 1 hour | High |
| Implement conversation controller | 3 hours | High |
| Implement message routes | 2 hours | High |
| Create frontend conversations API client | 2 hours | High |
| Create admin messages list page | 3 hours | High |
| Create conversation detail page | 4 hours | High |
| Create message components | 3 hours | High |
| Add message button to user pages | 1 hour | Medium |
| Create reseller messages page | 2 hours | Medium |
| Add navigation items | 30 min | High |
| Integration testing | 3 hours | High |
| Bug fixes and polish | 2 hours | Medium |

---

## Testing Commands

```bash
# Frontend tests
cd frontend
npm run test                    # Run all tests
npm run test:ui                 # Vitest UI mode
npm run test:coverage           # Coverage report

# Backend tests
cd backend
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f strapi
docker-compose logs -f frontend

# Restart after schema changes
docker-compose restart strapi

# Rebuild after Dockerfile changes
docker-compose up -d --build
```

---

**End of Implementation Plan**
