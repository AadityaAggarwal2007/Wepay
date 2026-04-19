import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import DashboardShell from '@/components/layout/DashboardShell';

/**
 * Dashboard Layout — SERVER COMPONENT
 * 
 * This runs on the server for EVERY page navigation (just like Express.js did).
 * It checks the auth cookie, verifies the JWT, and redirects to /login if invalid.
 * No middleware needed — this is the most reliable auth pattern in Next.js.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookie server-side (same as Express req.cookies)
  const cookieStore = await cookies();
  const token = cookieStore.get('wepay_token')?.value;

  // No cookie → redirect to login
  if (!token) {
    redirect('/login');
  }

  // Verify JWT (same as Express jwt.verify)
  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  return (
    <DashboardShell
      userName={payload.email?.split('@')[0] || 'User'}
      userRole={payload.role || 'partner'}
    >
      {children}
    </DashboardShell>
  );
}
