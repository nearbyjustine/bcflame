'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Package, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPartnerOrders, type OrderInquirySummary } from '@/lib/api/conversations';
import { getImageUrl } from '@/lib/utils/image';

interface OrdersModalProps {
  conversationId: number;
  partnerName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Status badge variant mapping
const getStatusVariant = (
  status: string
): 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'default' => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'reviewing':
      return 'in_review';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'fulfilled':
      return 'completed';
    default:
      return 'default';
  }
};

// Format status label
const formatStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export function OrdersModal({
  conversationId,
  partnerName,
  isOpen,
  onClose,
}: OrdersModalProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderInquirySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, conversationId, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPartnerOrders(
        conversationId,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching partner orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = (orderId: number) => {
    router.push(`/admin-portal/orders/${orderId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Orders for {partnerName}
          </DialogTitle>
        </DialogHeader>

        {/* Status Filter */}
        <div className="flex items-center gap-2 py-2">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchOrders} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-2">
                <Package className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No orders found</p>
                {statusFilter !== 'all' && (
                  <Button
                    onClick={() => setStatusFilter('all')}
                    variant="outline"
                    size="sm"
                  >
                    Clear filter
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order.id)}
                  className="group relative p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all text-left bg-card"
                >
                  <div className="flex gap-3">
                    {/* Product Image */}
                    {order.product.images && order.product.images.length > 0 && (
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(order.product.images[0].url)}
                          alt={
                            order.product.images[0].alternativeText ||
                            order.product.name
                          }
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    )}

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm truncate">
                          {order.inquiry_number}
                        </p>
                        <Badge
                          variant={getStatusVariant(order.status)}
                          className="flex-shrink-0"
                        >
                          {formatStatusLabel(order.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {order.product.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="mt-2 text-xs text-primary group-hover:underline">
                        View details →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
