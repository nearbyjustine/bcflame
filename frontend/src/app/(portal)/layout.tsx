'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/layout/CartDrawer';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const { setOpen, getItemCount } = useCartStore();

  const itemCount = getItemCount();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleOpenCart = () => {
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <CartDrawer />
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">BC Flame</h1>
            <div className="hidden md:flex space-x-4">
              <a href="/dashboard" className="text-sm hover:text-primary">Dashboard</a>
              <a href="/products" className="text-sm hover:text-primary">Products</a>
              <a href="/media-hub" className="text-sm hover:text-primary">Media Hub</a>
              <a href="/orders" className="text-sm hover:text-primary">Orders</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <button
              onClick={handleOpenCart}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
            <div className="text-sm">
              <p className="font-medium">{user?.companyName || user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
