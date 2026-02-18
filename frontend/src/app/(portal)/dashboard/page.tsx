'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  Package,
  DollarSign,
  RefreshCw,
  ChevronRight,
  Image,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { getResellerDashboardStats, type ResellerDashboardStats } from '@/lib/api/dashboard';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { resellerDashboardSteps } from '@/hooks/tours/resellerTours';

export default function DashboardPage() {
  useOnboardingTour({ moduleKey: 'dashboard', steps: resellerDashboardSteps });
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<ResellerDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardStats = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getResellerDashboardStats();
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
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border border-[hsl(var(--gold))] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen px-6 py-12 mx-auto max-w-screen-2xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4" data-tour="res-dashboard-header">
        <div>
          <p className="text-luxury-label text-[hsl(var(--gold))]/60 mb-2">Welcome back</p>
          <h1 className="text-luxury-lg font-display text-white">
            {user?.companyName || user?.username}
          </h1>
          <p className="font-body text-sm text-white/30 mt-2">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchDashboardStats(true)}
          disabled={isRefreshing}
          className="border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-luxury-label rounded-sm self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="res-dashboard-stats">
        <div className="bg-[#111] border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-luxury-label text-white/40">Total Orders</span>
            <div className="w-8 h-8 rounded-full border border-[hsl(var(--gold))]/30 flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            </div>
          </div>
          <div className="font-display text-4xl font-light text-white">{dashboardData?.totalOrders || 0}</div>
          <p className="text-luxury-label text-white/25 mt-2">All-time order inquiries</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-luxury-label text-white/40">Pending Orders</span>
            <div className="w-8 h-8 rounded-full border border-[hsl(var(--gold))]/30 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            </div>
          </div>
          <div className="font-display text-4xl font-light text-white">{dashboardData?.pendingOrders || 0}</div>
          <p className="text-luxury-label text-white/25 mt-2">Awaiting review or approval</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-luxury-label text-white/40">Available Products</span>
            <div className="w-8 h-8 rounded-full border border-[hsl(var(--gold))]/30 flex items-center justify-center">
              <Package className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            </div>
          </div>
          <div className="font-display text-4xl font-light text-white">{dashboardData?.availableProducts || 0}</div>
          <p className="text-luxury-label text-white/25 mt-2">Products in catalog</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-luxury-label text-white/40">Total Spent</span>
            <div className="w-8 h-8 rounded-full border border-[hsl(var(--gold))]/30 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            </div>
          </div>
          <div className="font-display text-4xl font-light text-white">
            {dashboardData?.totalSpent ? formatCurrency(dashboardData.totalSpent) : '$0'}
          </div>
          <p className="text-luxury-label text-white/25 mt-2">Total order value</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-sm" data-tour="res-dashboard-activity">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h3 className="font-display text-lg text-white">Recent Activity</h3>
              <p className="text-luxury-label text-white/30 mt-0.5">Your latest order inquiries</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/10 text-luxury-label rounded-sm">
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="p-6 space-y-3">
            {!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-display text-base text-white/30">No recent orders</p>
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="mt-4 border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-luxury-label rounded-sm">
                    <ShoppingBag className="mr-2 h-3 w-3" />
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              dashboardData.recentActivity.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-white/5 rounded-sm hover:border-white/10 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--gold))]/20">
                      <Package className="h-4 w-4 text-[hsl(var(--gold))]/60" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-white">{order.inquiry_number}</p>
                      <p className="text-luxury-label text-white/30 mt-0.5">
                        {order.product?.name} · {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={order.status} variant="order" size="sm" />
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/5">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111] border border-white/10 rounded-sm" data-tour="res-dashboard-quick-actions">
          <div className="px-6 py-5 border-b border-white/5">
            <h3 className="font-display text-lg text-white">Quick Actions</h3>
            <p className="text-luxury-label text-white/30 mt-0.5">What would you like to do?</p>
          </div>
          <div className="p-6 space-y-2">
            <Link href="/products" className="block">
              <button
                type="button"
                className="w-full flex items-center px-4 py-3 border border-white/10 rounded-sm text-white/50 hover:border-[hsl(var(--gold))]/30 hover:text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold))]/5 transition-colors text-left"
              >
                <Package className="mr-3 h-3.5 w-3.5" />
                <span className="text-luxury-label">Browse Products</span>
              </button>
            </Link>
            <Link href="/orders" className="block">
              <button
                type="button"
                className="w-full flex items-center px-4 py-3 border border-white/10 rounded-sm text-white/50 hover:border-[hsl(var(--gold))]/30 hover:text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold))]/5 transition-colors text-left"
              >
                <ShoppingBag className="mr-3 h-3.5 w-3.5" />
                <span className="text-luxury-label">View My Orders</span>
              </button>
            </Link>
            <Link href="/media-hub" className="block">
              <button
                type="button"
                className="w-full flex items-center px-4 py-3 border border-white/10 rounded-sm text-white/50 hover:border-[hsl(var(--gold))]/30 hover:text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold))]/5 transition-colors text-left"
              >
                <Image className="mr-3 h-3.5 w-3.5" />
                <span className="text-luxury-label">Media Hub</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-[#111] border border-white/10 rounded-sm">
        <div className="px-6 py-5 border-b border-white/5">
          <h3 className="font-display text-lg text-white">Quick Start Guide</h3>
          <p className="text-luxury-label text-white/30 mt-0.5">Get started with the BC Flame Premium Portal</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start space-x-5">
            <div className="w-7 h-7 rounded-full border border-[hsl(var(--gold))]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-display text-sm text-[hsl(var(--gold))]">1</span>
            </div>
            <div>
              <h4 className="font-body text-sm font-medium text-white">Browse Products</h4>
              <p className="text-luxury-label text-white/30 mt-1">
                Explore our catalog of premium cannabis products and check real-time inventory
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-5">
            <div className="w-7 h-7 rounded-full border border-[hsl(var(--gold))]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-display text-sm text-[hsl(var(--gold))]">2</span>
            </div>
            <div>
              <h4 className="font-body text-sm font-medium text-white">Customize Packaging</h4>
              <p className="text-luxury-label text-white/30 mt-1">
                Use our Smart Packaging Studio to design custom packaging with your brand
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-5">
            <div className="w-7 h-7 rounded-full border border-[hsl(var(--gold))]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="font-display text-sm text-[hsl(var(--gold))]">3</span>
            </div>
            <div>
              <h4 className="font-body text-sm font-medium text-white">Submit Inquiry</h4>
              <p className="text-luxury-label text-white/30 mt-1">
                Send us your requirements and we&apos;ll get back to you with a custom quote
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
