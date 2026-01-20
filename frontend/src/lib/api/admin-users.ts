import { strapiApi } from './strapi';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  businessLicense?: string;
  userType: 'reseller' | 'admin';
  reseller_logo?: {
    id: number;
    url: string;
    formats?: {
      thumbnail?: { url: string };
    };
  };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  blocked?: boolean;
  userType?: 'reseller' | 'admin' | 'all';
}

export interface UserOrderSummary {
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate?: string;
}

/**
 * Fetch users for admin management
 */
export async function getAdminUsers(params?: AdminUsersParams): Promise<AdminUsersResponse> {
  const {
    page = 1,
    pageSize = 25,
    search,
    blocked,
    userType = 'reseller',
  } = params || {};

  // Build query params
  const queryParams: Record<string, any> = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'populate': 'reseller_logo',
  };

  // Build filters
  const filters: string[] = [];

  if (search) {
    // Search by email, company, or username
    filters.push(`filters[$or][0][email][$containsi]=${encodeURIComponent(search)}`);
    filters.push(`filters[$or][1][company][$containsi]=${encodeURIComponent(search)}`);
    filters.push(`filters[$or][2][username][$containsi]=${encodeURIComponent(search)}`);
    filters.push(`filters[$or][3][firstName][$containsi]=${encodeURIComponent(search)}`);
    filters.push(`filters[$or][4][lastName][$containsi]=${encodeURIComponent(search)}`);
  }

  if (blocked !== undefined) {
    filters.push(`filters[blocked][$eq]=${blocked}`);
  }

  if (userType !== 'all') {
    filters.push(`filters[userType][$eq]=${userType}`);
  }

  // Construct the query string
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `${key}=${value}`)
    .concat(filters)
    .join('&');

  const response = await strapiApi.get(`/api/users?${queryString}`);

  // Transform the response
  const users = response.data.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    confirmed: user.confirmed,
    blocked: user.blocked,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    firstName: user.firstName,
    lastName: user.lastName,
    company: user.company,
    phone: user.phone,
    businessLicense: user.businessLicense,
    userType: user.userType || 'reseller',
    reseller_logo: user.reseller_logo,
  }));

  return {
    users,
    total: users.length, // Strapi users endpoint doesn't return pagination meta
  };
}

/**
 * Get a single user by ID
 */
export async function getAdminUser(id: number): Promise<AdminUser> {
  const response = await strapiApi.get(`/api/users/${id}`, {
    params: {
      populate: 'reseller_logo',
    },
  });

  const user = response.data;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    confirmed: user.confirmed,
    blocked: user.blocked,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    firstName: user.firstName,
    lastName: user.lastName,
    company: user.company,
    phone: user.phone,
    businessLicense: user.businessLicense,
    userType: user.userType || 'reseller',
    reseller_logo: user.reseller_logo,
  };
}

/**
 * Block a user
 */
export async function blockUser(id: number): Promise<AdminUser> {
  const response = await strapiApi.put(`/api/users/${id}`, {
    blocked: true,
  });
  return response.data;
}

/**
 * Unblock a user
 */
export async function unblockUser(id: number): Promise<AdminUser> {
  const response = await strapiApi.put(`/api/users/${id}`, {
    blocked: false,
  });
  return response.data;
}

/**
 * Update user details
 */
export async function updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
  const response = await strapiApi.put(`/api/users/${id}`, data);
  return response.data;
}

/**
 * Get user's order summary
 */
export async function getUserOrderSummary(userId: number): Promise<UserOrderSummary> {
  try {
    const response = await strapiApi.get('/api/order-inquiries', {
      params: {
        filters: {
          user: {
            id: { $eq: userId },
          },
        },
        pagination: {
          pageSize: 100,
        },
      },
    });

    const orders = response.data.data || [];

    let totalRevenue = 0;
    let lastOrderDate: string | undefined;

    orders.forEach((order: any) => {
      // Sum up estimated totals from order items
      const items = order.attributes.items || [];
      items.forEach((item: any) => {
        totalRevenue += item.estimated_total || 0;
      });

      // Track most recent order
      const orderDate = order.attributes.createdAt;
      if (!lastOrderDate || new Date(orderDate) > new Date(lastOrderDate)) {
        lastOrderDate = orderDate;
      }
    });

    return {
      totalOrders: orders.length,
      totalRevenue,
      lastOrderDate,
    };
  } catch (error) {
    console.error('Failed to fetch order summary:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
    };
  }
}

/**
 * Get user's recent orders
 */
export async function getUserOrders(userId: number, limit: number = 5): Promise<any[]> {
  try {
    const response = await strapiApi.get('/api/order-inquiries', {
      params: {
        filters: {
          user: {
            id: { $eq: userId },
          },
        },
        sort: ['createdAt:desc'],
        pagination: {
          pageSize: limit,
        },
        populate: '*',
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return [];
  }
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  businessLicense?: string;
  userType: 'reseller' | 'admin';
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<AdminUser> {
  const response = await strapiApi.post('/api/users', {
    ...data,
    confirmed: true, // Auto-confirm users created by admin
    blocked: false,
  });
  return response.data;
}

/**
 * Upload reseller logo for a user
 */
export async function uploadResellerLogo(userId: number, file: File): Promise<AdminUser> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'plugin::users-permissions.user');
  formData.append('refId', userId.toString());
  formData.append('field', 'reseller_logo');

  await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Fetch and return updated user
  return getAdminUser(userId);
}
