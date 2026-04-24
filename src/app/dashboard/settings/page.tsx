'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';

interface UserSettings {
  id: number;
  instanceId: string;
  mobile: string;
  email: string;
  name: string;
  company: string;
  panNumber: string;
  aadhaarNumber: string;
  location: string;
  otpRequired: boolean;
  whatsappAlert: boolean;
  emailAlert: boolean;
}

export default function SettingsPage() {
  const [form, setForm] = useState({
    instanceId: '', mobile: '', email: '', name: '',
    company: '', pan: '', aadhaar: '', userId: '',
    location: '', otpRequired: 'NO', whatsappAlert: 'NO', emailAlert: 'NO',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data: UserSettings = await res.json();
        setForm({
          instanceId: data.instanceId || '',
          mobile: data.mobile || '',
          email: data.email || '',
          name: data.name || '',
          company: data.company || '',
          pan: data.panNumber || '',
          aadhaar: data.aadhaarNumber || '',
          userId: String(data.id || ''),
          location: data.location || '',
          otpRequired: data.otpRequired ? 'YES' : 'NO',
          whatsappAlert: data.whatsappAlert ? 'YES' : 'NO',
          emailAlert: data.emailAlert ? 'YES' : 'NO',
        });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          panNumber: form.pan,
          aadhaarNumber: form.aadhaar,
          location: form.location,
          otpRequired: form.otpRequired,
          whatsappAlert: form.whatsappAlert,
          emailAlert: form.emailAlert,
        }),
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }} /> Loading settings...
      </div>
    );
  }

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
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
