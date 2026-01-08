BC Flame Premium Client Portal - Project Development Plan

     Executive Summary

     This plan outlines the complete development roadmap for the BC Flame Premium Client Portal. Phase 1 (authentication and infrastructure) is complete. This plan
     focuses on Phase 2: implementing the full B2B partner portal with product catalog, order inquiry system, media hub, and smart packaging customization studio.

     Product Catalog: 6 cannabis products scraped from bcflameonline.com (5 Indica, 1 Hybrid)

     Infrastructure Verification Summary

     ✅ Infrastructure Status: 95% Complete
     - Docker services, authentication, and core architecture fully implemented
     - Missing: Portal pages (products, orders, media-hub, profile)
     - All documented in CLAUDE.md and verified compliant

     ---
     MAJOR TASKS & MINOR TASKS BREAKDOWN

     PHASE 2A: BACKEND - STRAPI CONTENT TYPES & API

     Major Task 1: Product Catalog Content Types

     Owner: Backend Developer
     Dependencies: None
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Product content type in Strapi
       - Fields: name, sku, category (enum: Indica, Hybrid, Sativa), tagline, description, full_description
       - Fields: best_for, warning, thc_content (optional), flavor_profile (optional)
       - Fields: on_sale (boolean), featured (boolean)
       - Fields: product_url (text), sort_order (integer)
       - Enable drafts & publish workflow
       - Add media field for product images (multiple)
     2. Create Pricing content type (Component)
       - Create repeatable component: ProductPricing
       - Fields: weight (enum: 7g, 14g, 28g), amount (decimal), currency (text, default USD)
       - Attach as repeatable component to Product
     3. Create Features component
       - Create repeatable component: ProductFeature
       - Fields: label (text), icon (optional)
       - Attach to Product content type
     4. Configure Product API permissions
       - Public role: find, findOne (read-only access for partners)
       - Authenticated role: find, findOne (read-only)
       - Admin role: full CRUD access
     5. Seed Products from bcflame-scrape.json
       - Create seed script or manual import via Strapi admin
       - Import all 6 products (9 Pound Hammer, Gas Gummies, Gas Mask, Kosher Kush, Platinum Bubba Kush, Tom Ford Pink Kush)
       - Add placeholder images or scrape product images
       - Verify all fields populated correctly
     6. Test Product API endpoints
       - GET /api/products (list all)
       - GET /api/products/:id (single product)
       - Test filters: ?filters[category][$eq]=Indica
       - Test sorting: ?sort=name:asc
       - Test pagination: ?pagination[page]=1&pagination[pageSize]=10

     ---
     Major Task 2: Order Inquiry System Content Types

     Owner: Backend Developer
     Dependencies: Product content type
     Estimated Complexity: Medium-High

     Minor Tasks:

     1. Create Order Inquiry content type
       - Fields: inquiry_number (auto-generated, unique), status (enum: pending, reviewing, quoted, accepted, declined, fulfilled)
       - Fields: partner_notes (richtext), admin_notes (richtext, admin-only)
       - Fields: requested_delivery_date (date), urgency (enum: standard, rush, urgent)
       - Relations: user (many-to-one with users-permissions), order_items (one-to-many)
       - Timestamps: createdAt, updatedAt
     2. Create Order Item content type
       - Fields: quantity (integer), weight_option (enum: 7g, 14g, 28g)
       - Fields: unit_price (decimal), total_price (decimal)
       - Fields: custom_packaging (boolean), packaging_notes (text)
       - Relations: product (many-to-one), order_inquiry (many-to-one)
     3. Create Quote Response content type (Component)
       - Create component: QuoteResponse
       - Fields: quoted_price (decimal), quoted_delivery_date (date), quote_notes (richtext)
       - Fields: quote_valid_until (date), status (enum: draft, sent, accepted, rejected)
       - Attach to Order Inquiry (single component)
     4. Configure Order Inquiry permissions
       - Public role: none
       - Authenticated role: create, find (own inquiries only), findOne (own only), update (own only, limited fields)
       - Admin role: full CRUD access
     5. Create lifecycle hooks for Order Inquiry
       - Auto-generate inquiry_number on create (format: INQ-YYYYMMDD-XXXX)
       - Auto-calculate total_price on Order Item create/update
       - Send email notification to admin on new inquiry
       - Send email notification to partner on status change
     6. Test Order Inquiry API
       - POST /api/order-inquiries (create inquiry with items)
       - GET /api/order-inquiries?filters[user][id][$eq]=:userId
       - PUT /api/order-inquiries/:id (update status, add notes)
       - Test permissions (partners can't see other partners' inquiries)

     ---
     Major Task 3: Media Hub Content Types

     Owner: Backend Developer
     Dependencies: None
     Estimated Complexity: Low-Medium

     Minor Tasks:

     1. Create Media Asset content type
       - Fields: title, description (richtext), asset_type (enum: image, video, pdf, zip)
       - Fields: category (enum: product_photos, marketing_materials, packaging_templates, brand_guidelines, other)
       - Fields: tags (relation to Tag content type), featured (boolean)
       - Media field: file (single or multiple based on type)
       - Fields: file_size (auto-calculated), download_count (integer, default 0)
       - Relations: products (many-to-many, optional - link assets to specific products)
     2. Create Tag content type
       - Fields: name (unique), slug (auto-generated), color (optional)
       - Relations: media_assets (many-to-many)
     3. Configure Media Hub permissions
       - Public role: none
       - Authenticated role: find, findOne, download (read-only)
       - Admin role: full CRUD + upload
     4. Create download tracking hook
       - Increment download_count on media asset access
       - Log download activity (user, timestamp, asset) for analytics
     5. Seed Media Hub with placeholder content
       - Create categories: Product Photos, Marketing Materials, Packaging Templates, Brand Guidelines
       - Upload 2-3 placeholder assets per category
       - Add relevant tags
     6. Test Media Hub API
       - GET /api/media-assets?filters[category][$eq]=product_photos
       - GET /api/media-assets?filters[tags][name][$containsi]=indica
       - GET /api/media-assets/:id (with file URLs)
       - Test file download endpoint

     ---
     Major Task 4: User Profile & Partner Management

     Owner: Backend Developer
     Dependencies: None
     Estimated Complexity: Low-Medium

     Minor Tasks:

     1. Extend User content type (users-permissions)
       - Add fields: company_name, business_number, phone, address (component)
       - Add fields: partner_tier (enum: bronze, silver, gold, platinum), verified (boolean, default false)
       - Add fields: credit_limit (decimal, optional), payment_terms (text, optional)
       - Add media field: business_logo (single image)
     2. Create Address component
       - Fields: street, city, province, postal_code, country (default Canada)
       - Mark as reusable component
     3. Configure Profile API permissions
       - Authenticated role: findOne (own profile), update (own profile, limited fields)
       - Admin role: full access to all profiles
     4. Create user profile update endpoint
       - Custom controller: update-me (allows user to update own profile)
       - Validation: prevent updating verified, partner_tier, credit_limit (admin-only fields)
     5. Test Profile API
       - GET /api/users/me (current user with extended fields)
       - PUT /api/users/:id (update profile)
       - Test field restrictions (can't self-verify, can't change tier)

     ---
     Major Task 5: Smart Packaging Customization (Future Phase 2B)

     Owner: Backend Developer
     Dependencies: Product catalog
     Estimated Complexity: High

     Minor Tasks:

     1. Create Packaging Template content type
       - Fields: template_name, template_type (enum: jar_label, bag_label, box_design)
       - Fields: dimensions (component), base_design (media - PSD/AI file)
       - Fields: customizable_areas (JSON - coordinates for text/logo placement)
       - Relations: products (many-to-many - which products support this template)
     2. Create Packaging Customization content type
       - Fields: customization_name, status (enum: draft, pending_review, approved, in_production)
       - Fields: custom_text (text), custom_logo (media), color_scheme (JSON)
       - Relations: template (many-to-one), user (many-to-one), order_inquiry (many-to-one, optional)
       - Media: preview_image (auto-generated), final_print_file (PDF)
     3. Create packaging preview generation service
       - Integrate image manipulation library (sharp, canvas)
       - Generate preview PNG based on template + customizations
       - Store preview in media library
     4. Configure Packaging API permissions
       - Authenticated role: create, find (own), findOne (own), update (own)
       - Admin role: full CRUD + approve/reject
     5. Test Packaging API
       - POST /api/packaging-customizations (create draft)
       - GET /api/packaging-customizations/:id/preview (generate preview)
       - PUT /api/packaging-customizations/:id (update status)

     ---
     PHASE 2B: FRONTEND - PORTAL PAGES & UI

     Major Task 6: Product Catalog Page

     Owner: Frontend Developer
     Dependencies: Backend Major Task 1 (Product API)
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Products page layout
       - File: frontend/src/app/(portal)/products/page.tsx
       - Implement grid/list toggle view
       - Add filtering sidebar (category, price range, on_sale)
       - Add sorting dropdown (name, price, category)
       - Add search bar (search by name, sku, description)
     2. Create ProductCard component
       - File: frontend/src/components/products/ProductCard.tsx
       - Display: product image, name, category badge, tagline
       - Display: price range, on_sale badge, quick view button
       - Hover effects: show full description preview
       - Click: navigate to product detail page
     3. Create Product Detail page
       - File: frontend/src/app/(portal)/products/[id]/page.tsx
       - Display: image gallery, full description, pricing table
       - Display: THC content, flavor profile, best for, warnings
       - Add to inquiry button (opens inquiry modal with product pre-filled)
       - Related products section (same category)
     4. Integrate Strapi Product API
       - Create API service: frontend/src/lib/api/products.ts
       - Functions: getProducts(), getProductById(), searchProducts(), getProductsByCategory()
       - Handle pagination, filtering, sorting in API calls
       - Error handling and loading states
     5. Add loading skeletons
       - Create ProductCardSkeleton component
       - Add to Products page while fetching data
       - Smooth loading transitions
     6. Test Products page
       - Verify all products display correctly
       - Test filtering (click Indica, verify only Indica products show)
       - Test sorting (click price low-to-high, verify order)
       - Test search (search "Kush", verify 3 results)
       - Test detail page navigation
       - Test responsive design (mobile, tablet, desktop)

     ---
     Major Task 7: Order Inquiry Page

     Owner: Frontend Developer
     Dependencies: Backend Major Task 2 (Order Inquiry API)
     Estimated Complexity: High

     Minor Tasks:

     1. Create Orders page layout
       - File: frontend/src/app/(portal)/orders/page.tsx
       - Tab navigation: All Inquiries, Pending, Quoted, Accepted, Fulfilled
       - Table view: inquiry_number, status, requested_delivery_date, total_items, created_at
       - Filter bar: date range, status, urgency
       - Create New Inquiry button (opens modal)
     2. Create New Inquiry modal/form
       - File: frontend/src/components/orders/NewInquiryModal.tsx
       - Multi-step form:
           - Step 1: Select products (searchable product list with checkboxes)
         - Step 2: Specify quantities and weights (7g/14g/28g)
         - Step 3: Delivery details (requested date, urgency, notes)
         - Step 4: Review and submit
       - Validation: at least 1 product, valid quantities, future delivery date
       - Auto-calculate estimated total (display pricing)
     3. Create Order Detail page
       - File: frontend/src/app/(portal)/orders/[id]/page.tsx
       - Display: inquiry_number, status badge, timestamps
       - Display: ordered items table (product, quantity, weight, unit price, total)
       - Display: partner notes, admin notes (if any), quote response
       - Actions: Edit (if pending), Cancel (if pending), Accept Quote (if quoted)
       - Status timeline component (visual progress tracker)
     4. Integrate Strapi Order Inquiry API
       - Create API service: frontend/src/lib/api/orders.ts
       - Functions: getInquiries(), getInquiryById(), createInquiry(), updateInquiry(), cancelInquiry()
       - Handle error responses (validation errors, permission errors)
     5. Create OrderStatusBadge component
       - File: frontend/src/components/orders/OrderStatusBadge.tsx
       - Color-coded badges: pending (yellow), reviewing (blue), quoted (purple), accepted (green), fulfilled (gray), declined (red)
     6. Add real-time status updates (optional enhancement)
       - Implement WebSocket or polling for order status changes
       - Show toast notification when admin updates inquiry status
       - Auto-refresh order detail page on status change
     7. Test Orders page
       - Create new inquiry with 2 products (different weights)
       - Verify inquiry appears in table
       - Navigate to detail page, verify all data displays
       - Test filtering by status
       - Test editing pending inquiry
       - Test responsive design

     ---
     Major Task 8: Media Hub Page

     Owner: Frontend Developer
     Dependencies: Backend Major Task 3 (Media Hub API)
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Media Hub page layout
       - File: frontend/src/app/(portal)/media-hub/page.tsx
       - Category tabs: All, Product Photos, Marketing Materials, Packaging Templates, Brand Guidelines
       - Grid view with card layout (masonry or uniform)
       - Search bar and tag filter
       - Sort dropdown (date uploaded, name, download count)
     2. Create MediaAssetCard component
       - File: frontend/src/components/media/MediaAssetCard.tsx
       - Display: thumbnail (if image/video), file icon (if PDF/ZIP)
       - Display: title, description preview, file size, download count
       - Actions: Download button, Quick View button (lightbox for images)
       - Tag badges
     3. Create Asset Detail modal/lightbox
       - File: frontend/src/components/media/AssetDetailModal.tsx
       - Large preview (if image/video)
       - Full description, tags, related products
       - Download button (tracks download count)
       - Share link button
     4. Integrate Strapi Media Hub API
       - Create API service: frontend/src/lib/api/media.ts
       - Functions: getAssets(), getAssetById(), downloadAsset(), searchAssets()
       - Handle file download (trigger browser download)
       - Track download count on download
     5. Implement file preview
       - Images: full lightbox preview with zoom
       - Videos: embedded player
       - PDFs: embedded PDF viewer or open in new tab
       - Other files: show file icon and download option
     6. Add featured assets section
       - Display featured assets at top of page
       - Larger cards with prominent styling
       - Auto-carousel (optional)
     7. Test Media Hub page
       - Verify all assets display correctly
       - Test category filtering (click Product Photos, verify filter)
       - Test search (search "indica", verify tag matches)
       - Download asset, verify download count increments
       - Test lightbox preview for images
       - Test responsive design

     ---
     Major Task 9: User Profile Page

     Owner: Frontend Developer
     Dependencies: Backend Major Task 4 (Profile API)
     Estimated Complexity: Low-Medium

     Minor Tasks:

     1. Create Profile page layout
       - File: frontend/src/app/(portal)/profile/page.tsx
       - Tab navigation: Profile, Company Info, Security
       - Editable form fields with save/cancel buttons
       - Display read-only fields (verified status, partner tier)
     2. Create Profile tab
       - Display: username (read-only), email (read-only), phone, business logo upload
       - Form validation: phone format, file size limits for logo
       - Save button updates user profile
     3. Create Company Info tab
       - Display: company_name, business_number, address fields (street, city, province, postal code)
       - Display read-only: partner_tier (with badge), credit_limit (if applicable)
       - Verified badge (if verified)
     4. Create Security tab
       - Change password form (current password, new password, confirm password)
       - Validation: min 8 characters, contains uppercase, lowercase, number
       - Success/error toast notifications
     5. Integrate Profile API
       - Create API service: frontend/src/lib/api/profile.ts
       - Functions: getProfile(), updateProfile(), changePassword()
       - Update authStore with new user data on profile update
     6. Add image upload handling
       - Integrate file upload to Strapi media library
       - Image preview before upload
       - Crop/resize options (optional)
     7. Test Profile page
       - Update phone number, save, verify update persists
       - Upload business logo, verify displays on profile
       - Change password, logout, verify new password works
       - Verify read-only fields can't be edited
       - Test validation (invalid phone format, weak password)
       - Test responsive design

     ---
     Major Task 10: Portal Navigation & Layout Enhancements

     Owner: Frontend Developer
     Dependencies: None
     Estimated Complexity: Low

     Minor Tasks:

     1. Update portal layout navigation
       - File: frontend/src/app/(portal)/layout.tsx
       - Add navigation links: Dashboard, Products, Orders, Media Hub, Profile
       - Highlight active route
       - Add user dropdown menu (profile, logout)
     2. Create Portal Header component
       - File: frontend/src/components/layout/PortalHeader.tsx
       - Display: BC Flame logo, navigation menu, user avatar/name, notifications icon (future)
       - Mobile: hamburger menu for navigation
       - Sticky header on scroll
     3. Create Portal Sidebar (optional)
       - Alternative to top navigation
       - Collapsible sidebar with icons + labels
       - Pinned/unpinned state (localStorage)
     4. Update Dashboard page
       - File: frontend/src/app/(portal)/dashboard/page.tsx
       - Add widgets: Recent Orders (table with 5 latest), Quick Actions (buttons to create inquiry, browse products)
       - Add stats cards: Total Orders, Pending Inquiries, Accepted Orders
       - Add featured products carousel
     5. Implement breadcrumb navigation
       - File: frontend/src/components/layout/Breadcrumb.tsx
       - Auto-generate breadcrumb trail based on route
       - Example: Dashboard > Products > 9 Pound Hammer
     6. Test navigation
       - Click all navigation links, verify correct pages load
       - Test mobile hamburger menu
       - Test active route highlighting
       - Test user dropdown (logout redirects to login)
       - Test breadcrumbs on nested routes

     ---
     PHASE 2C: ENHANCEMENTS & POLISH

     Major Task 11: Notifications System

     Owner: Full-stack Developer
     Dependencies: Order Inquiry API
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Notification content type (Strapi)
       - Fields: title, message, type (enum: info, success, warning, error), read (boolean)
       - Relations: user (many-to-one), related_entity (polymorphic - can link to order, product, etc.)
       - Timestamps: createdAt
     2. Create notification lifecycle hooks
       - Trigger on order inquiry status change (notify partner)
       - Trigger on new quote received (notify partner)
       - Trigger on new inquiry created (notify admin)
     3. Create Notification API endpoints
       - GET /api/notifications (user's notifications)
       - PUT /api/notifications/:id/read (mark as read)
       - PUT /api/notifications/read-all (mark all as read)
     4. Create Notification Bell component (Frontend)
       - File: frontend/src/components/layout/NotificationBell.tsx
       - Display unread count badge
       - Dropdown menu showing recent notifications
       - Mark as read on click
       - "View All" link to notifications page
     5. Create Notifications page (Frontend)
       - File: frontend/src/app/(portal)/notifications/page.tsx
       - List all notifications (grouped by date)
       - Filter: read/unread
       - Click notification navigates to related entity (order, product)
     6. Test notifications
       - Create order inquiry, verify notification appears for partner
       - Admin updates inquiry status, verify partner receives notification
       - Click notification, verify navigates to order detail
       - Mark as read, verify badge count decrements

     ---
     Major Task 12: Search & Filtering Infrastructure

     Owner: Full-stack Developer
     Dependencies: All content types
     Estimated Complexity: Medium

     Minor Tasks:

     1. Implement global search (Backend)
       - Custom Strapi endpoint: /api/search?q=keyword
       - Search across: products (name, sku, description), orders (inquiry_number), media (title, tags)
       - Return grouped results by content type
     2. Create SearchBar component (Frontend)
       - File: frontend/src/components/layout/SearchBar.tsx
       - Global search bar in portal header
       - Autocomplete dropdown with grouped results
       - Keyboard navigation (arrow keys, enter to navigate)
     3. Implement advanced filtering (Frontend)
       - Create FilterPanel component (reusable)
       - Support multi-select (categories, tags), range (price, date), toggle (on_sale, featured)
       - Persist filter state in URL query params
     4. Add search analytics (Backend)
       - Log search queries (keyword, user, timestamp, result count)
       - Admin dashboard showing popular searches
     5. Test search
       - Search "kush", verify returns 3 products
       - Search "INQ-", verify returns matching orders
       - Test autocomplete suggestions
       - Test keyboard navigation
       - Test filter combinations (category + price range)

     ---
     Major Task 13: Testing & Quality Assurance

     Owner: QA / All Developers
     Dependencies: All major tasks
     Estimated Complexity: High

     Minor Tasks:

     1. Write unit tests (Frontend)
       - Test API service functions (mock axios responses)
       - Test utility functions (price formatting, date formatting)
       - Coverage target: 70%+
     2. Write integration tests (Backend)
       - Test Strapi API endpoints (create, read, update, delete)
       - Test permissions (unauthenticated, authenticated, admin)
       - Test lifecycle hooks (inquiry number generation, notifications)
     3. Write E2E tests (Frontend)
       - Tool: Playwright or Cypress
       - Test critical user flows:
           - Login → Browse products → Create inquiry → View inquiry detail
         - Login → Download media asset → Verify download count
         - Login → Update profile → Logout → Login with updated credentials
     4. Manual testing checklist
       - Test all portal pages on Chrome, Firefox, Safari
       - Test responsive design (mobile, tablet, desktop)
       - Test authentication flows (login, logout, token expiration)
       - Test error handling (network errors, validation errors, 404s)
       - Test edge cases (empty states, long text, special characters)
     5. Performance testing
       - Lighthouse audit (target: 90+ performance score)
       - Optimize images (WebP format, lazy loading)
       - Code splitting (dynamic imports for heavy components)
       - API response time testing (target: <500ms for all endpoints)
     6. Security audit
       - OWASP Top 10 review
       - Test XSS prevention (user inputs, rich text)
       - Test CSRF protection
       - Test SQL injection (Strapi ORM should prevent, but verify)
       - Review CORS configuration
       - Verify JWT expiration and refresh
     7. Accessibility audit
       - WCAG 2.1 AA compliance
       - Keyboard navigation for all interactive elements
       - Screen reader testing (NVDA/JAWS)
       - Color contrast ratios
       - Focus indicators
       - ARIA labels for icons

     ---
     Major Task 14: Deployment & DevOps

     Owner: DevOps / Lead Developer
     Dependencies: Testing complete
     Estimated Complexity: Medium-High

     Minor Tasks:

     1. Set up production environment variables
       - Generate production JWT secrets, APP_KEYS, API tokens
       - Configure production database credentials
       - Set production URLs (frontend, backend)
       - Store secrets in secure vault (AWS Secrets Manager, Doppler, etc.)
     2. Configure production Docker setup
       - Update docker-compose.prod.yml (if needed)
       - Set NODE_ENV=production
       - Disable Strapi auto-reload and admin panel (or secure admin panel)
       - Configure PostgreSQL backups
     3. Set up CI/CD pipeline
       - Tool: GitHub Actions, GitLab CI, or Jenkins
       - Pipeline steps:
           - Lint code (ESLint, TypeScript)
         - Run tests (unit, integration)
         - Build Docker images
         - Push to container registry (Docker Hub, AWS ECR)
         - Deploy to staging/production
       - Automated deployments on merge to main/production branch
     4. Configure domain and SSL
       - Purchase domain (e.g., portal.bcflame.com)
       - Configure DNS (A records for frontend/backend)
       - Set up SSL certificates (Let's Encrypt, Cloudflare)
       - Configure reverse proxy (Nginx, Traefik, or Cloudflare)
     5. Set up monitoring and logging
       - Application monitoring: Sentry, LogRocket, or Datadog
       - Error tracking and alerting
       - Server monitoring: CPU, memory, disk usage
       - Log aggregation: Elasticsearch + Kibana, or Datadog Logs
     6. Create database backup strategy
       - Automated daily PostgreSQL backups
       - Store backups in S3 or cloud storage
       - Test restore procedure
       - Retention policy: 30 days
     7. Performance optimization
       - Enable Strapi production caching
       - Set up CDN for static assets (Cloudflare, AWS CloudFront)
       - Enable Gzip/Brotli compression
       - Optimize Docker image sizes (multi-stage builds)
     8. Create deployment documentation
       - Document environment variables
       - Document deployment steps
       - Document rollback procedure
       - Document monitoring dashboards

     ---
     PHASE 2D: FUTURE ENHANCEMENTS (BACKLOG)

     Major Task 15: Smart Packaging Customization Studio

     Owner: Full-stack Developer
     Dependencies: Major Task 5 (Backend Packaging API)
     Estimated Complexity: Very High

     Minor Tasks:

     1. Create Packaging Studio page
       - File: frontend/src/app/(portal)/packaging-studio/page.tsx
       - Canvas-based design tool (Fabric.js or Konva.js)
       - Template selection (jar labels, bag labels, box designs)
       - Customizable text fields, logo upload, color picker
       - Live preview
     2. Implement design editor
       - Drag-and-drop text elements
       - Font selection, size, color
       - Logo upload with positioning and scaling
       - Background color/pattern selection
       - Undo/redo functionality
     3. Create preview generation API
       - Backend: Use sharp or canvas to generate preview PNG
       - Frontend: Display preview in modal
       - Export final design as high-res PDF for printing
     4. Link packaging to order inquiries
       - Add packaging customization to inquiry form
       - Display linked customization in order detail page
     5. Admin approval workflow
       - Admin reviews submitted customizations
       - Approve/reject with notes
       - Partner receives notification on approval

     ---
     Major Task 16: Analytics Dashboard (Admin)

     Owner: Full-stack Developer
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Analytics content type
       - Track: page views, downloads, inquiries, conversions
       - Store: user_id, event_type, entity_type, entity_id, metadata (JSON)
     2. Create Admin Analytics page
       - Display: total partners, total inquiries, inquiry conversion rate
       - Charts: inquiries over time, top products, top downloaded assets
       - Partner activity table
     3. Implement event tracking
       - Track: product views, inquiry creations, media downloads
       - Send events to analytics service (Google Analytics, Mixpanel, or custom)

     ---
     Major Task 17: Partner Communication Tools

     Owner: Full-stack Developer
     Estimated Complexity: Medium

     Minor Tasks:

     1. Create Message content type
       - Fields: subject, body, sender, recipient, read, replied
       - Relations: order_inquiry (optional - link message to inquiry)
     2. Create Messaging page
       - Inbox/Sent tabs
       - Compose new message to admin
       - Reply to messages
       - Attach order inquiry context
     3. Email integration
       - Send email notifications on new message
       - Reply to email triggers reply in portal

     ---
     Major Task 18: Referral Program

     Owner: Full-stack Developer
     Estimated Complexity: Low-Medium

     Minor Tasks:

     1. Create Referral content type
       - Fields: referrer_user, referred_email, status (pending, accepted, active)
       - Fields: reward_amount, reward_claimed
     2. Create Referral page
       - Display referral link (unique per user)
       - Track referrals (pending, accepted)
       - Display rewards earned
     3. Implement referral tracking
       - Capture referral code on signup
       - Reward referrer when referred user places first order

     ---
     CRITICAL FILES TO BE CREATED/MODIFIED

     Backend (Strapi)

     - backend/src/api/product/ - Product content type
     - backend/src/api/order-inquiry/ - Order Inquiry content type
     - backend/src/api/order-item/ - Order Item content type
     - backend/src/api/media-asset/ - Media Asset content type
     - backend/src/api/tag/ - Tag content type
     - backend/src/api/notification/ - Notification content type
     - backend/src/api/packaging-template/ - Packaging Template (future)
     - backend/src/api/packaging-customization/ - Packaging Customization (future)
     - backend/src/extensions/users-permissions/ - Extended User fields
     - backend/src/index.ts - Lifecycle hooks, custom routes

     Frontend (Next.js)

     - frontend/src/app/(portal)/products/page.tsx - Products list page
     - frontend/src/app/(portal)/products/[id]/page.tsx - Product detail page
     - frontend/src/app/(portal)/orders/page.tsx - Orders list page
     - frontend/src/app/(portal)/orders/[id]/page.tsx - Order detail page
     - frontend/src/app/(portal)/media-hub/page.tsx - Media hub page
     - frontend/src/app/(portal)/profile/page.tsx - Profile page
     - frontend/src/components/products/ProductCard.tsx
     - frontend/src/components/orders/NewInquiryModal.tsx
     - frontend/src/components/media/MediaAssetCard.tsx
     - frontend/src/components/layout/PortalHeader.tsx
     - frontend/src/lib/api/products.ts - Product API service
     - frontend/src/lib/api/orders.ts - Order API service
     - frontend/src/lib/api/media.ts - Media API service
     - frontend/src/lib/api/profile.ts - Profile API service

     ---
     VERIFICATION & TESTING PLAN

     End-to-End User Flows

     1. Partner onboarding flow
       - Sign up → Email verification → Login → Complete profile → Browse products
     2. Product inquiry flow
       - Login → Browse products → Create inquiry (add 2 products) → Submit → View in Orders tab → Receive quote (admin) → Accept quote
     3. Media download flow
       - Login → Navigate to Media Hub → Filter by category → Download asset → Verify download count increments
     4. Profile update flow
       - Login → Navigate to Profile → Update company info → Upload logo → Save → Logout → Login → Verify changes persist

     API Testing Checklist

     - All Strapi content types created and seeded
     - All API endpoints return correct data
     - Permissions enforced (partners can't access other partners' data)
     - Pagination works on all list endpoints
     - Filtering and sorting work correctly
     - JWT authentication works on protected routes
     - 401/403 errors handled gracefully

     Frontend Testing Checklist

     - All portal pages render without errors
     - Navigation works (all links, breadcrumbs)
     - Forms validate correctly (required fields, format validation)
     - Loading states display during API calls
     - Error states display on API failures
     - Responsive design works on mobile, tablet, desktop
     - Accessibility: keyboard navigation, screen reader support

     Performance Testing

     - Lighthouse scores: Performance 90+, Accessibility 100, Best Practices 100, SEO 90+
     - API response times <500ms
     - Images optimized (WebP, lazy loading)
     - Bundle size <500KB (gzipped)

     Security Testing

     - XSS prevention (all user inputs sanitized)
     - CSRF protection enabled
     - SQL injection prevention (ORM used correctly)
     - JWT expiration enforced
     - HTTPS enabled in production
     - CORS configured correctly
     - Secrets not exposed in frontend

     ---
     PROJECT TIMELINE ESTIMATION

     Note: Timeline estimates are approximate and depend on team size, experience, and availability.

     ┌─────────────────────────────────┬─────────────┬─────────────────────┐
     │              Phase              │ Major Tasks │ Estimated Duration  │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Phase 2A: Backend Content Types │ Tasks 1-5   │ 2-3 weeks           │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Phase 2B: Frontend Portal Pages │ Tasks 6-10  │ 3-4 weeks           │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Phase 2C: Enhancements & Polish │ Tasks 11-14 │ 2-3 weeks           │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Phase 2D: Future Enhancements   │ Tasks 15-18 │ 4-6 weeks (backlog) │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Total (Phase 2A-C)              │             │ 7-10 weeks          │
     ├─────────────────────────────────┼─────────────┼─────────────────────┤
     │ Total (Phase 2A-D)              │             │ 11-16 weeks         │
     └─────────────────────────────────┴─────────────┴─────────────────────┘
     ---
     DEPENDENCIES & RISKS

     Critical Dependencies

     1. Product Data: bcflame-scrape.json contains 6 products - may need to scrape more or manual entry
     2. Product Images: No images in scraped data - need to source/scrape product images
     3. Admin Resources: Admin must be available to test quote workflows and admin-side features

     Technical Risks

     1. Strapi Performance: Large media files may slow down admin panel - consider external storage (S3)
     2. Real-time Updates: WebSocket implementation may require additional infrastructure
     3. Image Processing: Packaging preview generation may be CPU-intensive - consider background jobs
     4. Mobile Performance: Complex portal pages may perform poorly on low-end mobile devices

     Mitigation Strategies

     - Product Images: Use placeholder images initially, source later
     - Performance: Implement caching, pagination, lazy loading early
     - Strapi Storage: Configure S3 or Cloudflare R2 for media uploads before seeding large assets
     - Testing: Conduct performance testing after each major task to catch issues early

     ---
     SUCCESS CRITERIA

     Phase 2A-C (MVP) is complete when:
     - ✅ All 6 products from bcflame-scrape.json are seeded and displayed
     - ✅ Partners can browse products, create inquiries, download media assets, update profiles
     - ✅ Admins can manage inquiries, respond with quotes, upload media assets
     - ✅ All critical user flows tested and working
     - ✅ Accessibility (WCAG AA), performance (Lighthouse 90+), security audits passed
     - ✅ Deployed to production with monitoring and backups configured

     Phase 2D (Future) is complete when:
     - ✅ Smart Packaging Customization Studio launched
     - ✅ Analytics dashboard operational
     - ✅ Partner messaging system active
     - ✅ Referral program tracking conversions

     ---
     NEXT STEPS

     Immediate Actions

     1. Confirm Scope: Review this plan and confirm which phases to implement (Phase 2A-C recommended for MVP)
     2. Resource Allocation: Assign backend and frontend developers to major tasks
     3. Product Images: Decide on strategy for product images (scrape from bcflameonline.com or use placeholders)
     4. Timeline Agreement: Confirm if 7-10 week timeline for Phase 2A-C is acceptable

     Phase 2A Start (Backend)

     - Start with Major Task 1 (Product Catalog) to unblock frontend development
     - Configure Strapi admin panel access for development team
     - Set up development database with fresh migration

     Questions for User

     1. Do you have access to product images, or should we plan to scrape them from bcflameonline.com?
     2. Are there more products beyond the 6 in bcflame-scrape.json that need to be added?
     3. What is the priority order for the major tasks? (Recommended: Tasks 1, 2, 6, 7 for core functionality)
     4. Do you need the Smart Packaging Studio (Phase 2D) in the initial launch, or is it a future enhancement?
     5. What is your target launch date for the portal?

     ---
     APPENDIX: INFRASTRUCTURE VERIFICATION

     Current Infrastructure Status: ✅ 95% Complete

     All Phase 1 components are verified and match CLAUDE.md specifications:

     1. Docker Configuration - All 3 services (postgres, strapi, frontend) correctly configured
     2. Environment Variables - All required vars present in .env.example and .env
     3. Package Scripts - All documented scripts available in root package.json
     4. Frontend Architecture - Next.js 14 App Router with auth/portal route groups, middleware protection
     5. Backend Architecture - Strapi 4.16.2 with all config files correctly set up
     6. Authentication - Full JWT flow with Zustand store, cookie management, interceptors

     Minor Gap: Portal pages (products, orders, media-hub, profile) are protected by middleware but not yet implemented. This plan addresses creating all missing
     pages in Phase 2B.
     - All 3 services present and correctly configured (postgres, strapi, frontend)
     - PostgreSQL 16-alpine with health checks
     - Named volumes: postgres_data, strapi_uploads
     - Custom network: bcflame_network
     - Multi-stage Dockerfiles for both frontend and backend

     2. Environment Variables
       - .env.example and .env files present
       - All required variables documented and configured
       - Includes: DB credentials, JWT secrets, APP_KEYS, API tokens, service URLs
     3. Package Scripts
       - Root package.json contains all documented scripts
       - Database management: db:setup, db:start, db:stop, db:reset
       - Development: dev, dev:frontend, dev:backend, install:all
     4. Frontend Architecture (Next.js 14)
       - App Router structure matches documentation
       - Route groups: (auth)/login, (portal)/dashboard
       - Webpack polling enabled (1000ms) in next.config.js
       - Middleware protection for all portal routes
       - Authentication flow fully implemented:
           - JWT storage in cookies (7-day expiration)
         - Zustand store with localStorage persistence
         - Axios interceptors for automatic token injection
         - 401 error handling with auto-logout
     5. Backend Architecture (Strapi 4.16.2)
       - All config files present and correctly configured:
           - config/database.ts - PostgreSQL connection
         - config/server.ts - Port 1337, webhooks, APP_KEYS
         - config/middlewares.ts - CORS for localhost:3000
         - config/api.ts - REST API limits (default: 25, max: 100)
       - Users-Permissions plugin for JWT authentication
       - Ready for custom content types in src/api/
     6. Dependencies
       - Next.js 14.1.0 with App Router
       - Strapi 4.16.2 with PostgreSQL driver
       - Zustand 4.4.7 for state management
       - Axios 1.6.5 for API calls
       - React Hook Form + Zod for form validation

     ⚠️ Minor Discrepancy (Non-Critical)

     Protected Portal Routes - Future Implementation

     The middleware protects these routes, but the page components don't exist yet:
     - /products - Product catalog page
     - /orders - Order inquiry page
     - /media-hub - Marketing media hub page
     - /profile - User profile page

     Status: This is expected and documented in CLAUDE.md as Phase 2 (Future) work. The infrastructure is ready for these routes.

     Compliance Score

     Overall: 95% Compliant

     - ✅ Docker infrastructure: 100%
     - ✅ Environment configuration: 100%
     - ✅ Package scripts: 100%
     - ✅ Frontend architecture: 100%
     - ✅ Backend architecture: 100%
     - ⚠️ Portal pages: 20% (1 of 5 pages implemented - dashboard only)

     Key Findings

     1. Excellent Documentation: CLAUDE.md accurately describes the implemented infrastructure
     2. Production-Ready: All critical components are properly configured
     3. Authentication Complete: JWT flow fully implemented with proper security
     4. Docker Optimized: Multi-stage builds, health checks, volume management
     5. Development Experience: Hot reload, polling, separate local/Docker scripts
     6. Phase Alignment: Phase 1 (auth + infrastructure) complete, Phase 2 (content) pending

     Recommendations

     No immediate action required. The infrastructure adheres to the documentation specifications. When implementing Phase 2 features, create the following portal
     pages:

     1. frontend/src/app/(portal)/products/page.tsx
     2. frontend/src/app/(portal)/orders/page.tsx
     3. frontend/src/app/(portal)/media-hub/page.tsx
     4. frontend/src/app/(portal)/profile/page.tsx

     All routing, authentication, and middleware protections are already in place for these routes.

     Critical Files

     All documented critical files are present:
     - /docker-compose.yml
     - /backend/config/database.ts
     - /backend/config/server.ts
     - /backend/config/middlewares.ts
     - /backend/config/api.ts
     - /frontend/next.config.js
     - /frontend/src/middleware.ts
     - /frontend/src/lib/api/strapi.ts
     - /frontend/src/stores/authStore.ts

     Conclusion

     The BC Flame project infrastructure is fully compliant with CLAUDE.md specifications. All Phase 1 components are correctly implemented. The minor discrepancy
     (missing portal pages) is expected future work that doesn't impact current functionality.



⏺ Perfect! I've created a comprehensive project plan that acts as both a project management document and a lead developer's technical roadmap. The plan includes:

  Plan Overview

  18 Major Tasks broken down into ~120 Minor Tasks across 4 phases:

  Phase 2A: Backend (Tasks 1-5) - 2-3 weeks

  - Product Catalog with pricing components
  - Order Inquiry System with lifecycle hooks
  - Media Hub with download tracking
  - User Profile extensions
  - Smart Packaging (future/backlog)

  Phase 2B: Frontend (Tasks 6-10) - 3-4 weeks

  - Products page with filtering/sorting
  - Orders page with multi-step form
  - Media Hub with lightbox previews
  - Profile page with tabs
  - Portal navigation enhancements

  Phase 2C: Polish (Tasks 11-14) - 2-3 weeks

  - Notifications system
  - Global search
  - Testing & QA (unit, integration, E2E)
  - Deployment & DevOps

  Phase 2D: Future Enhancements (Tasks 15-18) - Backlog

  - Packaging Customization Studio
  - Analytics Dashboard
  - Messaging System
  - Referral Program

  Key Features

  ✅ Verified infrastructure - All Phase 1 components match CLAUDE.md specs
  ✅ Product data mapped - 6 products from bcflame-scrape.json ready to import
  ✅ Critical files listed - Every file that needs to be created/modified
  ✅ Testing checklist - API, Frontend, Performance, Security, Accessibility
  ✅ Timeline estimates - 7-10 weeks for MVP (Phase 2A-C)
  ✅ Risk mitigation - Product images, Strapi performance, mobile optimization
