import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('wepay_token')?.value;
  const { pathname } = request.nextUrl;

  // Skip static assets completely
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/img') ||
    pathname.startsWith('/sdk') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public routes — no auth required
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/pay',
    '/api/',  // ALL API routes are public (they handle their own auth)
  ];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Root page is public
  if (pathname === '/') return NextResponse.next();

  // If on login page with valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes — redirect to login if no token
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|img/|sdk/).*)',
  ],
};
