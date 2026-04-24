'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch';

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) {
      alert('Passwords do not match!');
      return;
    }
    if (newPwd.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password changed successfully!');
        setCurrent(''); setNewPwd(''); setConfirm('');
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="card-body" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Update Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>
          Use a strong password for better security
        </p>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Current Password', value: current, setter: setCurrent, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { label: 'New Password', value: newPwd, setter: setNewPwd, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: 'Confirm Password', value: confirm, setter: setConfirm, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
          ].map(({ label, value, setter, show, toggle }) => (
            <div className="form-group" key={label}>
              <label className="form-label">{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="form-control"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={toggle}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
                >
                  <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
          ))}

          <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 8 }}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
