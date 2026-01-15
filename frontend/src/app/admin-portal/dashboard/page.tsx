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
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled';
  total: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-purple-100 text-purple-800',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Total Orders Today',
      value: '12',
      change: '+20%',
      changeType: 'positive',
      icon: <ShoppingCart className="h-5 w-5" />,
      href: '/admin-portal/orders',
    },
    {
      title: 'Revenue Today',
      value: '$4,250',
      change: '+15%',
      changeType: 'positive',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: 'Pending Orders',
      value: '5',
      change: '',
      changeType: 'neutral',
      icon: <Clock className="h-5 w-5" />,
      href: '/admin-portal/orders?status=pending',
    },
    {
      title: 'Low Stock Items',
      value: '3',
      change: 'Needs attention',
      changeType: 'negative',
      icon: <AlertTriangle className="h-5 w-5" />,
      href: '/admin-portal/products?filter=low-stock',
    },
  ]);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([
    {
      id: 1,
      inquiryNumber: 'INQ-20260115-0001',
      customerName: 'John Doe',
      companyName: 'ABC Cannabis Co.',
      status: 'pending',
      total: 450,
      createdAt: '10 minutes ago',
    },
    {
      id: 2,
      inquiryNumber: 'INQ-20260115-0002',
      customerName: 'Jane Smith',
      companyName: 'Green Valley Dispensary',
      status: 'approved',
      total: 820,
      createdAt: '1 hour ago',
    },
    {
      id: 3,
      inquiryNumber: 'INQ-20260114-0015',
      customerName: 'Mike Johnson',
      companyName: 'Pacific Herbs LLC',
      status: 'reviewing',
      total: 1200,
      createdAt: '3 hours ago',
    },
    {
      id: 4,
      inquiryNumber: 'INQ-20260114-0014',
      customerName: 'Sarah Williams',
      companyName: 'Mountain High Supply',
      status: 'fulfilled',
      total: 650,
      createdAt: 'Yesterday',
    },
  ]);

  const [quickStats, setQuickStats] = useState({
    totalProducts: 45,
    activeResellers: 128,
    weeklyRevenue: '$24,500',
  });

  // TODO: Fetch real data from API
  // useEffect(() => {
  //   fetchDashboardStats();
  //   fetchRecentOrders();
  // }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Button size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View All Orders
          </Button>
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
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <Package className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.inquiryNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.companyName} • {order.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={statusColors[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">${order.total}</span>
                    <Link href={`/admin-portal/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
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
                <span className="font-medium">{quickStats.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active Resellers</span>
                </div>
                <span className="font-medium">{quickStats.activeResellers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Weekly Revenue</span>
                </div>
                <span className="font-medium">{quickStats.weeklyRevenue}</span>
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
