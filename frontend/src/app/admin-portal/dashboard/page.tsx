'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Package,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { getAdminDashboardStats, type AdminDashboardStats } from '@/lib/api/dashboard';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  href?: string;
}

interface RecentOrder {
  id: number;
  inquiryNumber: string;
  customerName: string;
  companyName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'cancelled' | 'fulfilled';
  total: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardStats = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getAdminDashboardStats();
      setDashboardData(data);
      if (isManualRefresh) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats: StatCard[] = [
    {
      title: 'Total Orders Today',
      value: dashboardData.todayOrders.toString(),
      change: '',
      changeType: 'neutral',
      icon: <ShoppingCart className="h-5 w-5" />,
      href: '/admin-portal/orders',
    },
    {
      title: 'Revenue Today',
      value: formatCurrency(dashboardData.todayRevenue),
      change: '',
      changeType: 'neutral',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: 'Pending Orders',
      value: dashboardData.pendingOrders.toString(),
      change: dashboardData.pendingOrders > 0 ? 'Needs attention' : '',
      changeType: dashboardData.pendingOrders > 0 ? 'negative' : 'neutral',
      icon: <Clock className="h-5 w-5" />,
      href: '/admin-portal/orders?status=pending',
    },
    {
      title: 'Low Stock Items',
      value: dashboardData.lowStockItems.toString(),
      change: dashboardData.lowStockItems > 0 ? 'Needs attention' : '',
      changeType: dashboardData.lowStockItems > 0 ? 'negative' : 'neutral',
      icon: <AlertTriangle className="h-5 w-5" />,
      href: '/admin-portal/products?filter=low-stock',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin-portal/orders">
            <Button size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <div className="flex items-center text-xs mt-1">
                  {stat.changeType === 'positive' && (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500">{stat.change}</span>
                    </>
                  )}
                  {stat.changeType === 'negative' && (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500">{stat.change}</span>
                    </>
                  )}
                  {stat.changeType === 'neutral' && (
                    <span className="text-muted-foreground">{stat.change}</span>
                  )}
                  <span className="text-muted-foreground ml-1">from yesterday</span>
                </div>
              )}
              {stat.href && (
                <Link 
                  href={stat.href}
                  className="absolute inset-0 z-10"
                  aria-label={`View ${stat.title}`}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest order inquiries from resellers</CardDescription>
            </div>
            <Link href="/admin-portal/orders">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent orders
                </p>
              ) : (
                dashboardData.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <Package className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.inquiry_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer.company || order.customer.name} • {formatRelativeTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={order.status} variant="order" size="sm" />
                      <Link href={`/admin-portal/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Products</span>
                </div>
                <span className="font-medium">{dashboardData.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active Resellers</span>
                </div>
                <span className="font-medium">{dashboardData.activeResellers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Weekly Revenue</span>
                </div>
                <span className="font-medium">{formatCurrency(dashboardData.weeklyRevenue)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin-portal/products/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </Link>
              <Link href="/admin-portal/media/upload" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upload Media Asset
                </Button>
              </Link>
              <Link href="/admin-portal/orders?status=pending" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
