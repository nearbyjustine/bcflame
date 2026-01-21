'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Eye,
  MoreHorizontal,
  FileText,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge, OrderStatus, PaymentStatus } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { strapiApi } from '@/lib/api/strapi';

interface Order {
  id: number;
  inquiry_number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  total_weight: number;
  weight_unit: string;
  notes?: string;
  customer: {
    id: number;
    username: string;
    email: string;
    company?: string;
  } | null;
  product: {
    id: number;
    name: string;
  } | null;
  invoice?: {
    id: number;
    invoiceNumber: string;
    status: string;
  } | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'all');

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        'populate[customer]': 'true',
        'populate[product]': 'true',
        'populate[invoice]': 'true',
        'sort[0]': 'createdAt:desc',
        'pagination[pageSize]': '100',
      };

      if (selectedStatus && selectedStatus !== 'all') {
        params['filters[status][$eq]'] = selectedStatus;
      }

      const response = await strapiApi.get('/api/order-inquiries', { params });

      const formattedOrders: Order[] = response.data.data.map((item: any) => ({
        id: item.id,
        ...item.attributes,
        customer: item.attributes.customer?.data ? {
          id: item.attributes.customer.data.id,
          ...item.attributes.customer.data.attributes,
        } : null,
        product: item.attributes.product?.data ? {
          id: item.attributes.product.data.id,
          ...item.attributes.product.data.attributes,
        } : null,
        invoice: item.attributes.invoice?.data ? {
          id: item.attributes.invoice.data.id,
          ...item.attributes.invoice.data.attributes,
        } : null,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setSelectedStatus(value);
    if (value === 'all') {
      router.push('/admin-portal/orders');
    } else {
      router.push(`/admin-portal/orders?status=${value}`);
    }
  };

  // Define table columns
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        accessorKey: 'inquiry_number',
        header: 'Order #',
        cell: ({ row }) => (
          <Link
            href={`/admin-portal/orders/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.getValue('inquiry_number') || `#${row.original.id}`}
          </Link>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          const customer = row.original.customer;
          return (
            <div className="min-w-[150px]">
              <p className="font-medium ">
                {customer?.username || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer?.company || customer?.email || '—'}
              </p>
            </div>
          );
        },
        filterFn: (row, id, filterValue) => {
          const customer = row.original.customer;
          if (!customer) return false;
          const searchValue = filterValue.toLowerCase();
          return (
            customer.username?.toLowerCase().includes(searchValue) ||
            customer.email?.toLowerCase().includes(searchValue) ||
            customer.company?.toLowerCase().includes(searchValue) ||
            false
          );
        },
      },
      {
        accessorKey: 'product',
        header: 'Product',
        cell: ({ row }) => {
          const product = row.original.product;
          return (
            <span className="text-sm">
              {product?.name || '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string;
          return (
            <div className="min-w-[100px]">
              <p className="text-sm">{format(new Date(date), 'MMM d, yyyy')}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(date), 'h:mm a')}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status')} variant="order" />
        ),
        filterFn: (row, id, filterValue) => {
          return filterValue === 'all' || row.getValue(id) === filterValue;
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => (
          <StatusBadge
            status={row.getValue('paymentStatus') || 'unpaid'}
            variant="payment"
            size="sm"
          />
        ),
      },
      {
        accessorKey: 'total_weight',
        header: 'Weight',
        cell: ({ row }) => {
          const weight = row.getValue('total_weight') as number;
          const unit = row.original.weight_unit || 'lb';
          return weight ? `${weight} ${unit}` : '—';
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin-portal/orders/${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {order.invoice ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/admin-portal/orders/${order.id}?tab=invoice`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Invoice
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleGenerateInvoice(order.id)}
                    disabled={order.status !== 'approved'}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Handle invoice generation
  const handleGenerateInvoice = async (orderId: number) => {
    try {
      toast.loading('Generating invoice...');
      await strapiApi.post('/api/invoices/generate', {
        data: { orderId },
      });
      toast.dismiss();
      toast.success('Invoice generated successfully');
      fetchOrders(); // Refresh the list
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate invoice');
      console.error('Invoice generation error:', error);
    }
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      reviewing: orders.filter((o) => o.status === 'reviewing').length,
      approved: orders.filter((o) => o.status === 'approved').length,
      fulfilled: orders.filter((o) => o.status === 'fulfilled').length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold ">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all order inquiries from resellers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
          onClick={() => handleStatusFilterChange('all')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">All Orders</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'pending' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-muted/30'}`}
          onClick={() => handleStatusFilterChange('pending')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'reviewing' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted/30'}`}
          onClick={() => handleStatusFilterChange('reviewing')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.reviewing}</p>
            <p className="text-xs text-muted-foreground">Reviewing</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/30'}`}
          onClick={() => handleStatusFilterChange('approved')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'fulfilled' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-muted/30'}`}
          onClick={() => handleStatusFilterChange('fulfilled')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.fulfilled}</p>
            <p className="text-xs text-muted-foreground">Fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                {selectedStatus === 'all'
                  ? 'Showing all orders'
                  : `Filtered by: ${selectedStatus}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            searchKey="customer"
            searchPlaceholder="Search by customer name, email, or company..."
            isLoading={isLoading}
            showColumnVisibility={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
