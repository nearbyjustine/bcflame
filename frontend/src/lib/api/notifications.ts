import { strapiApi } from './strapi';

export interface Notification {
  id: number;
  type: 'new_order' | 'low_stock' | 'payment_received' | 'order_status_changed' | 'payment_reminder' | 'new_product' | 'new_message' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  relatedOrder?: {
    id: number;
    inquiry_number: string;
  };
  relatedProduct?: {
    id: number;
    name: string;
  };
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface UnreadCountResponse {
  data: {
    count: number;
  };
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
}

/**
 * Get unread notifications count for current user
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await strapiApi.get<UnreadCountResponse>('/api/notifications/unread/count');
    return response.data?.data?.count || 0;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
}

/**
 * Get recent unread notifications for current user
 */
export async function getUnreadNotifications(limit: number = 10): Promise<Notification[]> {
  try {
    const response = await strapiApi.get<NotificationResponse>('/api/notifications', {
      params: {
        filters: {
          isRead: false,
        },
        sort: 'createdAt:desc',
        pagination: {
          limit,
        },
        populate: ['relatedOrder', 'relatedProduct'],
      },
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error);
    return [];
  }
}

/**
 * Get all notifications for current user
 */
export async function getAllNotifications(page: number = 1, pageSize: number = 25): Promise<NotificationResponse> {
  try {
    const response = await strapiApi.get<NotificationResponse>('/api/notifications', {
      params: {
        sort: 'createdAt:desc',
        pagination: {
          page,
          pageSize,
        },
        populate: ['relatedOrder', 'relatedProduct'],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number): Promise<boolean> {
  try {
    await strapiApi.put(`/api/notifications/${notificationId}`, {
      data: {
        isRead: true,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(): Promise<boolean> {
  try {
    await strapiApi.post('/api/notifications/mark-all-read');
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

/**
 * Get notifications with filtering and pagination
 */
export async function getNotifications(
  page: number = 1,
  pageSize: number = 25,
  filters?: NotificationFilters
): Promise<NotificationResponse> {
  try {
    const filterParams: any = {};

    if (filters?.type) {
      filterParams.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      filterParams.isRead = filters.isRead;
    }

    const response = await strapiApi.get<NotificationResponse>('/api/notifications', {
      params: {
        filters: filterParams,
        sort: 'createdAt:desc',
        pagination: {
          page,
          pageSize,
        },
        populate: ['relatedOrder', 'relatedProduct'],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

/**
 * Toggle notification read status
 */
export async function toggleReadStatus(
  notificationId: number,
  isRead: boolean
): Promise<boolean> {
  try {
    await strapiApi.put(`/api/notifications/${notificationId}`, {
      data: { isRead },
    });
    return true;
  } catch (error) {
    console.error('Failed to toggle notification read status:', error);
    return false;
  }
}
