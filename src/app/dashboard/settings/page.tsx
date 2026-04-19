'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState({
    instanceId: 'INST17765402628212549',
    mobile: '9289144767',
    email: 'aadityaaggarwal3526@gmail.com',
    name: 'Aaditya aggarwal',
    company: 'student',
    pan: 'ABCPR1234A',
    aadhaar: '256729852104',
    userId: '471',
    location: 'new delhi',
    otpRequired: 'NO',
    whatsappAlert: 'NO',
    emailAlert: 'NO',
  });

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <div className="card">
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '16px 24px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fas fa-user" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Personal Information</span>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Instance ID</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.instanceId} readOnly style={{ background: 'var(--bg-body)', paddingRight: 36 }} />
                <i className="fas fa-id-card" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-mobile-alt" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-envelope" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.name} onChange={e => handleChange('name', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-user" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.company} onChange={e => handleChange('company', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-building" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.pan} onChange={e => handleChange('pan', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-id-badge" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Aadhaar Number</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.aadhaar} onChange={e => handleChange('aadhaar', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-id-card" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">User ID</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.userId} readOnly style={{ background: 'var(--bg-body)', paddingRight: 36 }} />
                <i className="fas fa-key" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" value={form.location} onChange={e => handleChange('location', e.target.value)} style={{ paddingRight: 36 }} />
                <i className="fas fa-map-marker-alt" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { key: 'otpRequired', label: 'OTP Required' },
              { key: 'whatsappAlert', label: 'WhatsApp Alert' },
              { key: 'emailAlert', label: 'Email Alert' },
            ].map(({ key, label }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <select className="form-select" value={form[key as keyof typeof form]} onChange={e => handleChange(key, e.target.value)}>
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
                <span style={{ fontSize: 12, color: form[key as keyof typeof form] === 'YES' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginTop: 4, display: 'block' }}>
                  {form[key as keyof typeof form] === 'YES' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
            <button type="submit" className="btn btn-primary btn-lg">
              <i className="fas fa-save" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
