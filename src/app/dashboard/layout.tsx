'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In production, these come from session/API
  const userName = 'WePay User';
  const userRole = 'API Partner';

  return (
    <div>
      <Sidebar
        userName={userName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Topbar
        userName={userName}
        onMobileToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="main-content">
        <div className="page-content">
          {children}
        </div>
        <footer className="footer">
          {new Date().getFullYear()} © <strong>WePay</strong> - All rights reserved.
        </footer>
      </main>
    </div>
  );
}
