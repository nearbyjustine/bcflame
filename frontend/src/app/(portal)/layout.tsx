'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b border-[hsl(var(--gold))] mx-auto"></div>
          <p className="mt-4 text-luxury-label text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* CartDrawer hidden - code preserved for future use */}
      {/* <CartDrawer /> */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md" data-tour="res-nav">
        <div className="mx-auto max-w-screen-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="lg:hidden p-2 rounded-sm hover:bg-white/5 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-white/70" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-[#0a0a0a] border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Image src="/header_logo.svg" alt="BC Flame" width={140} height={40} className="h-10 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1 mt-8">
                  <a
                    href="/dashboard"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a
                    href="/products"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </a>
                  <a
                    href="/messages"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </a>
                  {/* Media Hub hidden per requirements */}
                  {/* <a
                    href="/media-hub"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Media Hub
                  </a> */}
                  <a
                    href="/orders"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </a>
                  {/* Inventory hidden - will be admin-only feature
                  <a
                    href="/inventory"
                    className="text-luxury-label text-white/50 hover:text-[hsl(var(--gold))] py-3 border-b border-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inventory
                  </a>
                  */}
                </nav>
                {/* Mobile User Info */}
                <div className="mt-8 pt-4 border-t border-white/10">
                  <div className="mb-4">
                    <p className="font-display text-base text-white">{user?.companyName || user?.username}</p>
                    <p className="text-luxury-label text-white/30 mt-0.5">{user?.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full border-[hsl(var(--gold))]/40 text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/10 text-luxury-label"
                  >
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Image src="/header_logo.svg" alt="BC Flame" width={140} height={40} className="h-10 w-auto" />

            <div className="hidden lg:flex items-center space-x-8">
              <a href="/dashboard" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Dashboard</a>
              <a href="/products" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Products</a>
              <a href="/messages" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Messages</a>
              {/* Media Hub hidden per requirements */}
              {/* <a href="/media-hub" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Media Hub</a> */}
              <a href="/orders" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Orders</a>
              {/* Inventory hidden - will be admin-only feature */}
              {/* <a href="/inventory" className="text-luxury-label text-white/60 hover:text-[hsl(var(--gold))] transition-colors">Inventory</a> */}
            </div>
          </div>

          <div className="flex items-center space-x-5">
            {/* Cart Icon - hidden, code preserved for future use */}
            {/* ThemeToggle hidden - portal is dark-mode only */}
            {/* <ThemeToggle /> */}
            <NotificationDropdown />
            <div className="hidden md:block text-right">
              <p className="font-display text-sm text-[hsl(var(--gold-light))]">{user?.companyName || user?.username}</p>
              <p className="text-luxury-label text-white/30">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:inline-flex border border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/10 hover:text-[hsl(var(--gold))] text-luxury-label rounded-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
