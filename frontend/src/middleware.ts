import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to decode JWT payload (base64)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;
  const pathname = request.nextUrl.pathname;

  // Define protected path groups
  const resellerPaths = ['/dashboard', '/products', '/media-hub', '/orders', '/profile', '/notifications'];
  const adminPaths = ['/admin-portal'];
  
  const isResellerRoute = resellerPaths.some(path => pathname.startsWith(path));
  const isAdminRoute = adminPaths.some(path => pathname.startsWith(path));
  const isProtected = isResellerRoute || isAdminRoute;

  // Redirect to login if no token on protected routes
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based routing for authenticated users
  if (token) {
    const payload = decodeJwtPayload(token);
    const userType = (payload?.userType as string) || 'reseller';

    // Redirect from login based on user type
    if (pathname === '/login') {
      const redirectUrl = userType === 'admin' ? '/admin-portal/dashboard' : '/products';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Prevent resellers from accessing admin routes
    if (isAdminRoute && userType !== 'admin') {
      return NextResponse.redirect(new URL('/products', request.url));
    }

    // Prevent admins from accessing reseller routes (optional - admins can access both)
    // Uncomment below if you want strict separation
    // if (isResellerRoute && userType === 'admin') {
    //   return NextResponse.redirect(new URL('/admin-portal/dashboard', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/media-hub/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    '/admin-portal/:path*',
    '/login'
  ],
};
