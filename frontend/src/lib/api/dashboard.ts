import { strapiApi } from './strapi';

export interface AdminDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  lowStockItems: number;
  totalProducts: number;
  activeResellers: number;
  weeklyRevenue: number;
  recentOrders: Array<{
    id: number;
    inquiry_number: string;
    status: string;
    createdAt: string;
    customer: {
      id: number;
      email: string;
      name: string;
      company?: string;
    };
    product: {
      id: number;
      name: string;
    };
  }>;
}

export interface ResellerDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  availableProducts: number;
  totalSpent: number;
  recentActivity: Array<{
    id: number;
    inquiry_number: string;
    status: string;
    createdAt: string;
    product: {
      id: number;
      name: string;
    };
  }>;
}

/**
 * Fetch admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const response = await strapiApi.get('/api/dashboard/admin');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetch reseller dashboard statistics
 */
export async function getResellerDashboardStats(): Promise<ResellerDashboardStats> {
  try {
    const response = await strapiApi.get('/api/dashboard/reseller');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reseller dashboard stats:', error);
    throw error;
  }
}
