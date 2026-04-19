import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal middleware — ONLY handles login-page redirect for already-authenticated users.
 * Auth for /dashboard/* is handled by the dashboard layout server component.
 * This avoids the Next.js 16 middleware deprecation issues entirely.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('wepay_token')?.value;
  const { pathname } = request.nextUrl;

  // If on login page with valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Everything else passes through — dashboard auth is in the layout
  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
