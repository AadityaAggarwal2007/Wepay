'use client';

interface TopbarProps {
  userName: string;
  onMobileToggle: () => void;
}

export default function Topbar({ userName, onMobileToggle }: TopbarProps) {
  const today = new Date().toISOString().split('T')[0];

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="topbar">
      <button className="mobile-toggle" onClick={onMobileToggle}>
        <i className="fas fa-bars" />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        <div className="topbar-badge">
          <i className="fas fa-calendar-alt" />
          {today} - Active
        </div>

        <div className="topbar-icon">
          <i className="fas fa-envelope" />
          <span className="badge">9</span>
        </div>

        <div className="topbar-icon">
          <i className="fas fa-bell" />
          <span className="badge">5</span>
        </div>

        <div className="topbar-user">
          <div className="topbar-user-avatar">{getInitials(userName)}</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            User
          </span>
          <i className="fas fa-chevron-down" style={{ fontSize: 10, color: 'var(--text-muted)' }} />
        </div>
      </div>
    </header>
  );
}
