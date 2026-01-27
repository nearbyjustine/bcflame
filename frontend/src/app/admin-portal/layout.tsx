'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingCart,
  Image as ImageIcon,
  Package,
  Users,
  Bell,
  Menu,
  LogOut,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/admin-portal/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/admin-portal/orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
  { href: '/admin-portal/messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
  { href: '/admin-portal/media', label: 'Media', icon: <ImageIcon className="w-5 h-5" /> },
  { href: '/admin-portal/products', label: 'Products', icon: <Package className="w-5 h-5" /> },
  { href: '/admin-portal/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
];

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const {
    notifications,
    unreadCount,
    startPolling,
    stopPolling,
    markAsRead,
    markAllAsRead,
  } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && user && user.userType !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Start notification polling when component mounts
  useEffect(() => {
    if (user?.userType === 'admin') {
      startPolling(30000); // Poll every 30 seconds
    }

    return () => {
      stopPolling();
    };
  }, [user, startPolling, stopPolling]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin-portal/dashboard') {
      return pathname === '/admin-portal/dashboard' || pathname === '/admin-portal';
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin-portal/dashboard" className="flex items-center space-x-2">
              <Image src="/header_logo.svg" alt="BC Flame" width={100} height={32} className="h-8 w-auto" />
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Admin
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActiveRoute(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="mt-3 w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Top Bar - Mobile & Desktop */}
      <header className="fixed top-0 right-0 z-30 h-16 border-b bg-card lg:left-64 left-0">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-left flex items-center space-x-2">
                  <Image src="/header_logo.svg" alt="BC Flame" width={100} height={32} className="h-8 w-auto" />
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Admin
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActiveRoute(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="border-t p-4 mt-auto">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page Title - Hidden on mobile */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find(item => isActiveRoute(item.href))?.label || 'Admin Portal'}
            </h1>
          </div>

          {/* Mobile Title */}
          <div className="lg:hidden">
            <Image src="/header_logo.svg" alt="BC Flame" width={100} height={32} className="h-8 w-auto" />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="relative p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="text-xs h-auto py-1"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 hover:bg-background cursor-pointer transition-colors',
                            !notification.isRead && 'bg-blue-50/50'
                          )}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                            if (notification.link) {
                              router.push(notification.link);
                              setNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                              notification.isRead ? 'bg-transparent' : 'bg-blue-500'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.createdAt
                                  ? new Date(notification.createdAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })
                                  : 'No date'}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="border-t px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setNotificationsOpen(false);
                        // Could navigate to a dedicated notifications page if needed
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* User Avatar - Desktop only */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
