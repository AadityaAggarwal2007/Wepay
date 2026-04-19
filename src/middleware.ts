import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('wepay_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  const publicPaths = ['/login', '/register', '/forgot-password', '/pay', '/api/create-order', '/api/check-order-status', '/api/auth', '/api/cron'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/img') || pathname.startsWith('/sdk')) {
    return NextResponse.next();
  }

  // If on login page with token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes
  if (!isPublic && !token && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
