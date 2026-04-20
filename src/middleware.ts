import { NextResponse } from 'next/server';

/**
 * No-op middleware — auth is fully handled by:
 *   - API routes: read Authorization header via getUserFromRequest()
 *   - Dashboard pages: client-side check in dashboard layout (localStorage)
 * 
 * This just passes everything through.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Match nothing — effectively disabled
  matcher: [],
};
