'use client';

import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.companyName || user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your account today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Browse our catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">
              View available products and inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Track your inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-2">
              Order inquiries submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Hub</CardTitle>
            <CardDescription>Marketing materials</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">
              Download marketing assets
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with the BC Flame Premium Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h3 className="font-semibold">Browse Products</h3>
              <p className="text-sm text-muted-foreground">
                Explore our catalog of premium cannabis products and check real-time inventory
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h3 className="font-semibold">Customize Packaging</h3>
              <p className="text-sm text-muted-foreground">
                Use our Smart Packaging Studio to design custom packaging with your brand
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h3 className="font-semibold">Submit Inquiry</h3>
              <p className="text-sm text-muted-foreground">
                Send us your requirements and we'll get back to you with a custom quote
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
