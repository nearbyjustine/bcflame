'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, Package, MessageSquare, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import {
  getNotifications,
  markAllAsRead,
  toggleReadStatus,
  type Notification,
  type NotificationFilters,
} from '@/lib/api/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const notificationIcons = {
  new_order: ShoppingCart,
  order_status_changed: ShoppingCart,
  new_message: MessageSquare,
  new_product: Package,
  payment_reminder: DollarSign,
  payment_received: DollarSign,
  low_stock: AlertCircle,
  system: Bell,
};

const notificationTypeLabels = {
  new_order: 'New Order',
  order_status_changed: 'Order Update',
  new_message: 'New Message',
  new_product: 'New Product',
  payment_reminder: 'Payment Reminder',
  payment_received: 'Payment Received',
  low_stock: 'Low Stock',
  system: 'System',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch notifications with filters
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const filterParams: NotificationFilters = {};

      if (readFilter === 'unread') filterParams.isRead = false;
      if (readFilter === 'read') filterParams.isRead = true;
      if (typeFilter !== 'all') filterParams.type = typeFilter;

      const response = await getNotifications(currentPage, 25, filterParams);
      setNotifications(response.data);
      setTotalPages(response.meta.pagination.pageCount);
      setTotalCount(response.meta.pagination.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, readFilter, typeFilter]);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
        fetchNotifications();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  // Handle toggle read status
  const handleToggleRead = async (notificationId: number, currentIsRead: boolean) => {
    try {
      const success = await toggleReadStatus(notificationId, !currentIsRead);
      if (success) {
        fetchNotifications();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification',
        variant: 'destructive',
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleToggleRead(notification.id, notification.isRead);
    }
    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount} total notification{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="order_status_changed">Order Updates</SelectItem>
            <SelectItem value="new_message">New Messages</SelectItem>
            <SelectItem value="new_product">New Products</SelectItem>
            <SelectItem value="payment_reminder">Payment Reminders</SelectItem>
            <SelectItem value="new_order">New Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              {readFilter === 'unread'
                ? "You're all caught up!"
                : 'No notifications to display'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  notification.isRead ? 'bg-muted/30' : 'bg-background border-primary/20'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={`mt-1 p-2 rounded-full ${
                      notification.isRead ? 'bg-muted' : 'bg-primary/10'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        notification.isRead ? 'text-muted-foreground' : 'text-primary'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {notificationTypeLabels[notification.type]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(notification.id, notification.isRead);
                          }}
                        >
                          {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
