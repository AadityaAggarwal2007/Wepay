'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userName: string;
  userRole: string;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    section: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large' },
    ],
  },
  {
    section: 'MERCHANT SETTING',
    items: [
      { href: '/dashboard/merchants', label: 'Connect Merchant', icon: 'fas fa-store' },
      { href: '/dashboard/payment-links', label: 'Payment Link', icon: 'fas fa-link' },
      { href: '/dashboard/transactions', label: 'Transactions', icon: 'fas fa-exchange-alt' },
      { href: '/dashboard/subscription', label: 'Subscription', icon: 'fas fa-crown' },
    ],
  },
  {
    section: 'ACCOUNT SETTING',
    items: [
      { href: '/dashboard/settings', label: 'Account Settings', icon: 'fas fa-user-cog' },
      { href: '/dashboard/change-password', label: 'Change Password', icon: 'fas fa-lock' },
    ],
  },
  {
    section: 'DEVELOPER SETTING',
    items: [
      { href: '/dashboard/api-details', label: 'API Details', icon: 'fas fa-key' },
      { href: '/dashboard/documentation', label: 'Documentation', icon: 'fas fa-book' },
      { href: '/dashboard/faq', label: 'FAQ', icon: 'fas fa-question-circle' },
      { href: '/dashboard/sdk', label: 'SDK File', icon: 'fas fa-download' },
    ],
  },
];

export default function Sidebar({ userName, userRole, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-avatar">{getInitials(userName)}</div>
          <div className="sidebar-user-info">
            <h4>{userName}</h4>
            <span>
              <i className="fas fa-user-tie" style={{ fontSize: 10 }} /> {userRole}
            </span>
          </div>
          <button className="sidebar-toggle" onClick={onToggle}>
            <i className="fas fa-chevron-left" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <div className="sidebar-section-label">{group.section}</div>
              )}
              {group.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth <= 1024) onToggle();
                    }}
                  >
                    <span className="icon">
                      <i className={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 12 }}>
            <a
              href="https://wa.me/918874757998"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link"
            >
              <span className="icon">
                <i className="fab fa-whatsapp" />
              </span>
              Support
            </a>
            <Link href="/api/auth/logout" className="sidebar-link" style={{ color: 'var(--danger)' }}>
              <span className="icon">
                <i className="fas fa-sign-out-alt" />
              </span>
              Logout
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
