'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/layout/CartDrawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const { setOpen, getItemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-left">BC Flame</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  <a 
                    href="/dashboard" 
                    className="text-sm hover:text-primary py-2 border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/products" 
                    className="text-sm hover:text-primary py-2 border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </a>
                  <a 
                    href="/media-hub" 
                    className="text-sm hover:text-primary py-2 border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Media Hub
                  </a>
                  <a 
                    href="/orders" 
                    className="text-sm hover:text-primary py-2 border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </a>
                  <a 
                    href="/inventory" 
                    className="text-sm hover:text-primary py-2 border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inventory
                  </a>
                </nav>
                {/* Mobile User Info */}
                <div className="mt-8 pt-4 border-t">
                  <div className="text-sm mb-4">
                    <p className="font-medium">{user?.companyName || user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-2xl font-bold">BC Flame</h1>
            <div className="hidden md:flex space-x-4">
              <a href="/dashboard" className="text-sm hover:text-primary">Dashboard</a>
              <a href="/products" className="text-sm hover:text-primary">Products</a>
              <a href="/media-hub" className="text-sm hover:text-primary">Media Hub</a>
              <a href="/orders" className="text-sm hover:text-primary">Orders</a>
              <a href="/inventory" className="text-sm hover:text-primary">Inventory</a>
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
            <div className="hidden md:block text-sm">
              <p className="font-medium">{user?.companyName || user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
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
