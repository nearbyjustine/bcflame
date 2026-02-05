import type { TourStepConfig } from '@/hooks/useOnboardingTour';

export const adminDashboardSteps: TourStepConfig[] = [
  {
    id: 'adm-dashboard-welcome',
    title: 'Admin Dashboard',
    text: 'Welcome to the admin command center. Monitor your business operations from one place.',
    attachTo: { element: '[data-tour="adm-dashboard-header"]', on: 'bottom' },
  },
  {
    id: 'adm-dashboard-stats',
    title: 'Key Metrics',
    text: 'Track today\'s orders, revenue, pending orders needing attention, and low stock alerts.',
    attachTo: { element: '[data-tour="adm-dashboard-stats"]', on: 'bottom' },
  },
  {
    id: 'adm-dashboard-orders',
    title: 'Recent Orders',
    text: 'The latest order inquiries from resellers appear here. Click "View All" to jump to full order management.',
    attachTo: { element: '[data-tour="adm-dashboard-orders"]', on: 'top' },
  },
  {
    id: 'adm-dashboard-sidebar',
    title: 'Quick Stats & Actions',
    text: 'Get a snapshot of total products, active resellers, and weekly revenue. Use quick actions to add products, upload media, or review pending orders.',
    attachTo: { element: '[data-tour="adm-dashboard-sidebar"]', on: 'left' },
  },
];

export const adminOrdersSteps: TourStepConfig[] = [
  {
    id: 'adm-orders-welcome',
    title: 'Order Management',
    text: 'View and manage all order inquiries submitted by your reseller partners.',
    attachTo: { element: '[data-tour="adm-orders-header"]', on: 'bottom' },
  },
  {
    id: 'adm-orders-status-cards',
    title: 'Status Overview',
    text: 'Click any status card to instantly filter the table — All, Pending, Reviewing, Approved, or Fulfilled.',
    attachTo: { element: '[data-tour="adm-orders-status-cards"]', on: 'bottom' },
  },
  {
    id: 'adm-orders-table',
    title: 'Orders Table',
    text: 'The table shows order number, customer, product, date, status, payment, and weight. Use the search box to find specific orders.',
    attachTo: { element: '[data-tour="adm-orders-table"]', on: 'top' },
  },
  {
    id: 'adm-orders-export',
    title: 'Export Orders',
    text: 'Export order data to CSV or Excel for reporting and offline analysis.',
    attachTo: { element: '[data-tour="adm-orders-export"]', on: 'bottom' },
  },
];

export const adminProductsSteps: TourStepConfig[] = [
  {
    id: 'adm-products-welcome',
    title: 'Product Management',
    text: 'Manage your entire product catalog — publish, edit, and track inventory from here.',
    attachTo: { element: '[data-tour="adm-products-header"]', on: 'bottom' },
  },
  {
    id: 'adm-products-add',
    title: 'Add a Product',
    text: 'Click "Add Product" to create a new item in your catalog with pricing, images, and inventory details.',
    attachTo: { element: '[data-tour="adm-products-add-btn"]', on: 'bottom' },
  },
  {
    id: 'adm-products-stats',
    title: 'Catalog Stats',
    text: 'See totals for published products, drafts, and items running low on stock at a glance.',
    attachTo: { element: '[data-tour="adm-products-stats"]', on: 'bottom' },
  },
  {
    id: 'adm-products-table',
    title: 'Products Table',
    text: 'Browse all products with their category, price, stock status, and publish state. Use the action menu on each row to publish, edit, or delete.',
    attachTo: { element: '[data-tour="adm-products-table"]', on: 'top' },
  },
];

export const adminUsersSteps: TourStepConfig[] = [
  {
    id: 'adm-users-welcome',
    title: 'User Management',
    text: 'Manage your reseller accounts — approve, block, and communicate with partners here.',
    attachTo: { element: '[data-tour="adm-users-header"]', on: 'bottom' },
  },
  {
    id: 'adm-users-stats',
    title: 'Reseller Stats',
    text: 'See the total number of resellers, how many are active, and how many are currently blocked.',
    attachTo: { element: '[data-tour="adm-users-stats"]', on: 'bottom' },
  },
  {
    id: 'adm-users-table',
    title: 'Users Table',
    text: 'View all resellers with their company, contact details, join date, and status. Use the action menu to block, unblock, or send an email. Select multiple users for bulk actions.',
    attachTo: { element: '[data-tour="adm-users-table"]', on: 'top' },
  },
];

export const adminMediaSteps: TourStepConfig[] = [
  {
    id: 'adm-media-welcome',
    title: 'Media Management',
    text: 'Upload and manage marketing assets that your reseller partners can download from the Media Hub.',
    attachTo: { element: '[data-tour="adm-media-header"]', on: 'bottom' },
  },
  {
    id: 'adm-media-upload',
    title: 'Upload an Asset',
    text: 'Click "Upload Asset" to add images, videos, PDFs, or design files. You can assign a category and tags for easy discovery.',
    attachTo: { element: '[data-tour="adm-media-upload-btn"]', on: 'bottom' },
  },
  {
    id: 'adm-media-table',
    title: 'Assets Table',
    text: 'Browse all media assets with category, tags, file size, and download counts. Filter by category or search by title.',
    attachTo: { element: '[data-tour="adm-media-table"]', on: 'top' },
  },
];

export const adminMessagesSteps: TourStepConfig[] = [
  {
    id: 'adm-messages-welcome',
    title: 'Messages',
    text: 'Communicate with your reseller partners in real time through direct conversations.',
    attachTo: { element: '[data-tour="adm-messages-header"]', on: 'bottom' },
  },
  {
    id: 'adm-messages-search',
    title: 'Search Conversations',
    text: 'Use the search box to quickly find a conversation by partner name, company, or message content.',
    attachTo: { element: '[data-tour="adm-messages-search"]', on: 'bottom' },
  },
  {
    id: 'adm-messages-list',
    title: 'Conversation List',
    text: 'All active conversations are listed here. Click any conversation to open the chat and start messaging.',
    attachTo: { element: '[data-tour="adm-messages-list"]', on: 'right' },
  },
];
