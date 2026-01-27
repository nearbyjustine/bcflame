import { create } from 'zustand';
import { toast } from 'sonner';
import { strapiApi } from '@/lib/api/strapi';

interface Notification {
  id: number;
  type: 'new_order' | 'low_stock' | 'payment_received' | 'order_status_changed' | 'system';
  title: string;
  message?: string;
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

interface DashboardStats {
  ordersToday: number;
  ordersTodayChange: number;
  revenueToday: number;
  revenueTodayChange: number;
  pendingOrders: number;
  lowStockItems: number;
  totalProducts: number;
  activeResellers: number;
  weeklyRevenue: number;
}

interface AdminState {
  notifications: Notification[];
  unreadCount: number;
  isPolling: boolean;
  pollInterval: NodeJS.Timeout | null;
  stats: DashboardStats | null;
  isLoadingStats: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isPolling: false,
  pollInterval: null,
  stats: null,
  isLoadingStats: false,

  fetchNotifications: async () => {
    try {
      const response = await strapiApi.get('/api/notifications/unread');
      const data = response.data?.data;
      
      if (!data) {
        return;
      }

      const { unreadCount = 0, notifications = [] } = data;

      const { unreadCount: prevCount, notifications: prevNotifications } = get();

      // Show toast for new notifications
      if (unreadCount > prevCount && prevCount >= 0) {
        const newNotifs = notifications.filter(
          (n: Notification) => !prevNotifications.some((p) => p.id === n.id)
        );
        newNotifs.forEach((n: Notification) => {
          toast.info(n.title, {
            description: n.message,
            action: n.link
              ? {
                  label: 'View',
                  onClick: () => {
                    window.location.href = n.link!;
                  },
                }
              : undefined,
          });
        });
      }

      set({
        notifications: notifications.map((n: any) => ({
          id: n.id,
          ...n.attributes,
          relatedOrder: n.attributes?.relatedOrder?.data
            ? {
                id: n.attributes.relatedOrder.data.id,
                ...n.attributes.relatedOrder.data.attributes,
              }
            : undefined,
          relatedProduct: n.attributes?.relatedProduct?.data
            ? {
                id: n.attributes.relatedProduct.data.id,
                ...n.attributes.relatedProduct.data.attributes,
              }
            : undefined,
        })),
        unreadCount,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await strapiApi.put(`/api/notifications/${id}`, {
        data: { isRead: true },
      });

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      await strapiApi.post('/api/notifications/mark-all-read');

      set({
        notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      // For now, return mock data
      // TODO: Implement actual /api/admin/stats endpoint
      const stats: DashboardStats = {
        ordersToday: 12,
        ordersTodayChange: 20,
        revenueToday: 4250,
        revenueTodayChange: 15,
        pendingOrders: 5,
        lowStockItems: 3,
        totalProducts: 45,
        activeResellers: 128,
        weeklyRevenue: 24500,
      };

      set({ stats, isLoadingStats: false });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      set({ isLoadingStats: false });
    }
  },

  startPolling: (interval = 30000) => {
    const { isPolling, fetchNotifications } = get();

    if (isPolling) return;

    // Initial fetch
    fetchNotifications();

    // Start interval
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, interval);

    set({ isPolling: true, pollInterval });
  },

  stopPolling: () => {
    const { pollInterval } = get();

    if (pollInterval) {
      clearInterval(pollInterval);
    }

    set({ isPolling: false, pollInterval: null });
  },
}));
