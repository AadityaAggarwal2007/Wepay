'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/lib/authFetch';
import DashboardShell from '@/components/layout/DashboardShell';

/**
 * Dashboard Layout — CLIENT COMPONENT
 *
 * Checks localStorage for the auth token.
 * If missing or invalid, redirects to /login.
 * No cookies involved.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    ready: boolean;
    userName: string;
    userRole: string;
  }>({ ready: false, userName: '', userRole: '' });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    // Decode payload from JWT to get user info (no server call needed)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || !payload.userId) {
        removeToken();
        router.replace('/login');
        return;
      }

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        removeToken();
        router.replace('/login');
        return;
      }

      setAuthState({
        ready: true,
        userName: payload.email?.split('@')[0] || 'User',
        userRole: payload.role || 'partner',
      });
    } catch {
      removeToken();
      router.replace('/login');
    }
  }, [router]);

  // Show nothing while checking auth (prevents flash)
  if (!authState.ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-body)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }} />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      userName={authState.userName}
      userRole={authState.userRole}
    >
      {children}
    </DashboardShell>
  );
}
