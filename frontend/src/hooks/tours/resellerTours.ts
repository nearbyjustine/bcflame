import type { TourStepConfig } from '@/hooks/useOnboardingTour';

export const resellerDashboardSteps: TourStepConfig[] = [
  {
    id: 'res-dashboard-welcome',
    title: 'Welcome to Your Dashboard',
    text: 'This is your command center. Get a quick overview of your orders, products, and spending at a glance.',
    attachTo: { element: '[data-tour="res-dashboard-header"]', on: 'bottom' },
  },
  {
    id: 'res-dashboard-stats',
    title: 'Your Key Metrics',
    text: 'These cards show your total orders, pending orders, available products, and total amount spent — updated in real time.',
    attachTo: { element: '[data-tour="res-dashboard-stats"]', on: 'bottom' },
  },
  {
    id: 'res-dashboard-activity',
    title: 'Recent Activity',
    text: 'Your latest order inquiries appear here so you can track their status without leaving the dashboard.',
    attachTo: { element: '[data-tour="res-dashboard-activity"]', on: 'top' },
  },
  {
    id: 'res-dashboard-quick-actions',
    title: 'Quick Actions',
    text: 'Jump straight to browsing products, viewing your orders, or accessing the Media Hub from here.',
    attachTo: { element: '[data-tour="res-dashboard-quick-actions"]', on: 'top' },
  },
  {
    id: 'res-dashboard-nav',
    title: 'Navigation',
    text: 'Use the top navigation bar to move between Dashboard, Products, Messages, Media Hub, and Orders at any time.',
    attachTo: { element: '[data-tour="res-nav"]', on: 'bottom' },
  },
];

export const resellerProductsSteps: TourStepConfig[] = [
  {
    id: 'res-products-welcome',
    title: 'Product Catalog',
    text: 'Browse the full catalog of premium products available for your business.',
    attachTo: { element: '[data-tour="res-products-header"]', on: 'bottom' },
  },
  {
    id: 'res-products-filters',
    title: 'Filter Products',
    text: 'Narrow down by category, price range, THC content, or search by name to find exactly what you need.',
    attachTo: { element: '[data-tour="res-products-filter-panel"]', on: 'right' },
  },
  {
    id: 'res-products-grid',
    title: 'Product Cards',
    text: 'Each card shows the product name, category, price, and current stock status.',
    attachTo: { element: '[data-tour="res-products-grid"]', on: 'left' },
  },
  {
    id: 'res-products-customize',
    title: 'Customize a Product',
    text: 'Tap the "Customize" button on any card to open the Smart Packaging Studio and create a custom order inquiry.',
    attachTo: { element: '[data-tour="res-products-grid"]', on: 'left' },
  },
];

export const resellerOrdersSteps: TourStepConfig[] = [
  {
    id: 'res-orders-welcome',
    title: 'My Orders',
    text: 'Track all of your custom product order inquiries and their current status here.',
    attachTo: { element: '[data-tour="res-orders-header"]', on: 'bottom' },
  },
  {
    id: 'res-orders-status',
    title: 'Order Status',
    text: 'Each order card shows a status badge — Pending, In Review, Approved, Rejected, or Completed — so you always know where things stand.',
    attachTo: { element: '[data-tour="res-orders-header"]', on: 'bottom' },
  },
  {
    id: 'res-orders-details',
    title: 'View Details',
    text: 'Click "View Details" on any order card to see full customization selections, contact info, and timestamps.',
    attachTo: { element: '[data-tour="res-orders-grid"]', on: 'top' },
  },
];

export const resellerMessagesSteps: TourStepConfig[] = [
  {
    id: 'res-messages-welcome',
    title: 'Messages',
    text: 'This is your direct line to the BC Flame admin team. Ask questions, get updates, and collaborate here.',
    attachTo: { element: '[data-tour="res-messages-header"]', on: 'bottom' },
  },
  {
    id: 'res-messages-status',
    title: 'Connection Status',
    text: 'The indicator below the header tells you whether your real-time connection is active. Messages send instantly when connected.',
    attachTo: { element: '[data-tour="res-messages-connection"]', on: 'bottom' },
  },
  {
    id: 'res-messages-chat',
    title: 'Chat Interface',
    text: 'Type in the input box at the bottom to send a message. You\'ll also see typing indicators when the admin is responding.',
    attachTo: { element: '[data-tour="res-messages-chat"]', on: 'top' },
  },
];

export const resellerMediaHubSteps: TourStepConfig[] = [
  {
    id: 'res-mediahub-welcome',
    title: 'Media Hub',
    text: 'Download marketing materials, product photos, and brand assets to support your business.',
    attachTo: { element: '[data-tour="res-mediahub-header"]', on: 'bottom' },
  },
  {
    id: 'res-mediahub-categories',
    title: 'Browse by Category',
    text: 'Filter assets by category — Product Photos, Marketing Materials, Packaging Templates, or Brand Guidelines.',
    attachTo: { element: '[data-tour="res-mediahub-categories"]', on: 'bottom' },
  },
  {
    id: 'res-mediahub-assets',
    title: 'Assets & Filters',
    text: 'Use the sidebar to filter by tags, or switch between grid and list view. Click any asset to preview and download it.',
    attachTo: { element: '[data-tour="res-mediahub-assets"]', on: 'top' },
  },
];
