'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import {
  ArrowLeft,
  User,
  Package,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  Send,
  Download,
  Save,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge, OrderStatus, PaymentStatus, InvoiceStatus } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { strapiApi } from '@/lib/api/strapi';

interface OrderDetail {
  id: number;
  inquiry_number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  reviewed_at?: string;
  total_weight: number;
  weight_unit: string;
  notes?: string;
  adminNotes?: string;
  shippingTrackingNumber?: string;
  selected_photos?: any;
  selected_bud_styles?: any;
  selected_backgrounds?: any;
  selected_fonts?: any;
  selected_prebagging?: any;
  customer: {
    id: number;
    username: string;
    email: string;
    company?: string;
    phone?: string;
  } | null;
  product: {
    id: number;
    name: string;
    category?: string;
    base_price_per_lb?: number;
  } | null;
  invoice?: {
    id: number;
    invoiceNumber: string;
    status: InvoiceStatus;
    subtotal: number;
    tax: number;
    total: number;
    dueDate?: string;
    paidDate?: string;
  } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch order details
  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await strapiApi.get(`/api/order-inquiries/${orderId}`, {
        params: {
          'populate[customer]': 'true',
          'populate[product]': 'true',
          'populate[invoice]': 'true',
        },
      });

      const item = response.data.data;
      const orderData: OrderDetail = {
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
      };

      setOrder(orderData);
      setAdminNotes(orderData.adminNotes || '');
      setTrackingNumber(orderData.shippingTrackingNumber || '');
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Debounced auto-save for admin notes
  const debouncedSaveNotes = useCallback(
    debounce(async (notes: string) => {
      try {
        await strapiApi.put(`/api/order-inquiries/${orderId}`, {
          data: { adminNotes: notes },
        });
        setHasUnsavedChanges(false);
        toast.success('Notes saved');
      } catch (error) {
        toast.error('Failed to save notes');
      }
    }, 2000),
    [orderId]
  );

  const handleNotesChange = (value: string) => {
    setAdminNotes(value);
    setHasUnsavedChanges(true);
    debouncedSaveNotes(value);
  };

  // Update order status
  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true);
    try {
      await strapiApi.put(`/api/order-inquiries/${orderId}`, {
        data: {
          status: newStatus,
          reviewed_at: newStatus === 'reviewing' ? new Date().toISOString() : undefined,
        },
      });
      setOrder((prev) => prev ? { ...prev, status: newStatus as OrderStatus } : null);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  // Update payment status
  const handlePaymentStatusChange = async (newStatus: string) => {
    setIsSaving(true);
    try {
      await strapiApi.put(`/api/order-inquiries/${orderId}`, {
        data: { paymentStatus: newStatus },
      });
      setOrder((prev) => prev ? { ...prev, paymentStatus: newStatus as PaymentStatus } : null);
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setIsSaving(false);
    }
  };

  // Save tracking number
  const handleSaveTracking = async () => {
    setIsSaving(true);
    try {
      await strapiApi.put(`/api/order-inquiries/${orderId}`, {
        data: { shippingTrackingNumber: trackingNumber },
      });
      setOrder((prev) => prev ? { ...prev, shippingTrackingNumber: trackingNumber } : null);
      toast.success('Tracking number saved');
    } catch (error) {
      toast.error('Failed to save tracking number');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate invoice
  const handleGenerateInvoice = async () => {
    try {
      toast.loading('Generating invoice...');
      await strapiApi.post('/api/invoices/generate', {
        data: { orderId: order?.id },
      });
      toast.dismiss();
      toast.success('Invoice generated successfully');
      fetchOrder(); // Refresh to get invoice data
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate invoice');
    }
  };

  // Send invoice email
  const handleSendInvoice = async () => {
    if (!order?.invoice?.id) return;
    try {
      toast.loading('Sending invoice...');
      await strapiApi.post(`/api/invoices/${order.invoice.id}/send`);
      toast.dismiss();
      toast.success('Invoice sent to customer');
      fetchOrder();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to send invoice');
    }
  };

  // Download invoice PDF
  const handleDownloadInvoice = async () => {
    if (!order?.invoice?.id) return;
    try {
      const response = await strapiApi.get(`/api/invoices/${order.invoice.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${order.invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Order not found</p>
        <Link href="/admin-portal/orders">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin-portal/orders">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {order.inquiry_number || `Order #${order.id}`}
              </h1>
              <StatusBadge status={order.status} variant="order" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(order.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saving...
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Update the order status and track progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={order.paymentStatus || 'unpaid'}
                    onValueChange={handlePaymentStatusChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Shipping Tracking */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping Tracking Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveTracking}
                    disabled={isSaving || trackingNumber === order.shippingTrackingNumber}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Product Info */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white border">
                    <Package className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{order.product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.product?.category || 'Category'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {order.total_weight} {order.weight_unit || 'lb'}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Weight</p>
                  </div>
                </div>

                {/* Customization Summary */}
                {(order.selected_photos || order.selected_bud_styles || order.selected_backgrounds || order.selected_fonts || order.selected_prebagging) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Customizations</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {order.selected_photos && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Photos:</span>{' '}
                            <span>{Array.isArray(order.selected_photos) ? order.selected_photos.length : 1} selected</span>
                          </div>
                        )}
                        {order.selected_bud_styles && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Bud Style:</span>{' '}
                            <span>{typeof order.selected_bud_styles === 'string' ? order.selected_bud_styles : 'Custom'}</span>
                          </div>
                        )}
                        {order.selected_backgrounds && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Background:</span>{' '}
                            <span>{typeof order.selected_backgrounds === 'string' ? order.selected_backgrounds : 'Custom'}</span>
                          </div>
                        )}
                        {order.selected_fonts && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Font:</span>{' '}
                            <span>{typeof order.selected_fonts === 'string' ? order.selected_fonts : 'Custom'}</span>
                          </div>
                        )}
                        {order.selected_prebagging && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Pre-bagging:</span>{' '}
                            <span>{typeof order.selected_prebagging === 'string' ? order.selected_prebagging : 'Yes'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Notes */}
                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Customer Notes</h4>
                      <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-lg">
                        {order.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Admin Notes
              </CardTitle>
              <CardDescription>Internal notes (not visible to customer)</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={adminNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add internal notes about this order..."
                className="w-full min-h-[120px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Notes auto-save after you stop typing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {order.customer?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">{order.customer?.username || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">Customer</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {order.customer?.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer.company}</span>
                  </div>
                )}
                {order.customer?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="text-primary hover:underline"
                    >
                      {order.customer.email}
                    </a>
                  </div>
                )}
                {order.customer?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
              </div>
              {order.customer?.id && (
                <Link href={`/admin-portal/users/${order.customer.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Eye className="mr-2 h-4 w-4" />
                    View Customer Profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Invoice Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.invoice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{order.invoice.invoiceNumber}</span>
                    <StatusBadge status={order.invoice.status} variant="invoice" size="sm" />
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${order.invoice.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${order.invoice.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${order.invoice.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  {order.invoice.dueDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {format(new Date(order.invoice.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadInvoice}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    {order.invoice.status !== 'paid' && (
                      <Button size="sm" onClick={handleSendInvoice} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Send to Customer
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No invoice generated yet
                  </p>
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={order.status !== 'approved'}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  {order.status !== 'approved' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Order must be approved to generate invoice
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="w-px h-full bg-slate-200" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">Order Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
                {order.reviewed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="w-px h-full bg-slate-200" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">Under Review</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.reviewed_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                {order.updatedAt !== order.createdAt && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        <Calendar className="h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.updatedAt), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
