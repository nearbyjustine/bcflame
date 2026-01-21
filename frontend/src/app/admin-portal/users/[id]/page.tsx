'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  Ban,
  CheckCircle,
  Package,
  DollarSign,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getAdminUser,
  getUserOrderSummary,
  getUserOrders,
  blockUser,
  unblockUser,
  type AdminUser,
  type UserOrderSummary,
} from '@/lib/api/admin-users';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [orderSummary, setOrderSummary] = useState<UserOrderSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'unblock'>('block');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const [userData, summary, orders] = await Promise.all([
        getAdminUser(userId),
        getUserOrderSummary(userId),
        getUserOrders(userId, 5),
      ]);

      setUser(userData);
      setOrderSummary(summary);
      setRecentOrders(orders);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      if (actionType === 'block') {
        await blockUser(user.id);
        toast.success('User has been blocked');
      } else {
        await unblockUser(user.id);
        toast.success('User has been unblocked');
      }
      setActionDialogOpen(false);
      fetchUserData();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(`Failed to ${actionType} user`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">User not found</h2>
        <Link href="/admin-portal/users">
          <Button variant="link">Back to users</Button>
        </Link>
      </div>
    );
  }

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const logoUrl = user.reseller_logo?.formats?.thumbnail?.url || user.reseller_logo?.url;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin-portal/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted/50 overflow-hidden">
              {logoUrl ? (
                <img
                  src={`${strapiUrl}${logoUrl}`}
                  alt={user.company || user.email}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Users className="h-7 w-7 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold ">
                  {fullName || user.username}
                </h1>
                <StatusBadge
                  status={user.blocked ? 'blocked' : 'active'}
                  variant="user-account"
                  showDot={false}
                />
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a className="flex items-center gap-2" href={`mailto:${user.email}`}>
              <Mail className="h-4 w-4" />
              Send Email
            </a>
          </Button>
          {user.blocked ? (
            <Button
              onClick={() => {
                setActionType('unblock');
                setActionDialogOpen(true);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Unblock User
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                setActionType('block');
                setActionDialogOpen(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              Block User
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{user.company}</p>
                  </div>
                </div>
              )}

              {user.businessLicense && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Business License</p>
                    <p className="font-medium">{user.businessLicense}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Confirmed</span>
                <StatusBadge
                  status={user.confirmed ? 'confirmed' : 'unconfirmed'}
                  variant="user-confirmation"
                  showDot={false}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Access</span>
                <StatusBadge
                  status={user.blocked ? 'blocked' : 'active'}
                  variant="user-account"
                  showDot={false}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Type</span>
                <StatusBadge
                  status={user.userType}
                  variant="user-type"
                  showDot={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{orderSummary?.totalOrders || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    ${(orderSummary?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-lg font-medium">
                    {orderSummary?.lastOrderDate
                      ? new Date(orderSummary.lastOrderDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from this reseller</CardDescription>
              </div>
              {recentOrders.length > 0 && (
                <Link href={`/admin-portal/orders?user=${user.id}`}>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.attributes.inquiry_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.attributes.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <StatusBadge status={order.attributes.status} variant="order" size="sm" />
                        <Link href={`/admin-portal/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Block/Unblock Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'block' ? 'Block User' : 'Unblock User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'block' ? (
                <>
                  Are you sure you want to block <strong>{user.email}</strong>?
                  They will no longer be able to log in or place orders.
                </>
              ) : (
                <>
                  Are you sure you want to unblock <strong>{user.email}</strong>?
                  They will be able to log in and place orders again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'block' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : actionType === 'block' ? 'Block User' : 'Unblock User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
