'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

interface DashboardShellProps {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export default function DashboardShell({ userName, userRole, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
