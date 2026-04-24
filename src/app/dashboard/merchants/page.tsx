'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';

interface Merchant {
  id: number;
  type: string;
  mobile: string;
  upiId: string | null;
  status: string;
  verified: boolean;
  createdAt: string;
  merchantId: string | null;
}

export default function MerchantsPage() {
  const [merchantType, setMerchantType] = useState('');
  const [mobile, setMobile] = useState('');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMerchants = useCallback(async () => {
    try {
      const res = await authFetch('/api/merchants');
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants || []);
      }
    } catch (e) {
      console.error('Failed to fetch merchants:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: merchantType, mobile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Merchant added! Please provide BharatPe credentials via Connect Merchant flow.');
        setMerchantType('');
        setMobile('');
        fetchMerchants();
      } else {
        alert(data.error || 'Failed to add merchant');
      }
    } catch {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;
    try {
      const res = await authFetch('/api/merchants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchMerchants();
      } else {
        alert('Failed to delete merchant');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <>
      {/* Add Merchant Form */}
      <div className="card mb-24">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 4 }}>
            <i className="fas fa-plus-circle" style={{ color: 'var(--primary)' }} />
            Add New Merchant
          </h2>
          <p className="card-subtitle">Connect a new payment merchant</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Merchant Name</label>
                <select className="form-select" value={merchantType} onChange={(e) => setMerchantType(e.target.value)} required>
                  <option value="">Select Merchant Type</option>
                  <option value="bharatpe">BharatPe</option>
                  <option value="phonepe">PhonePe Business</option>
                  <option value="paytm">Paytm Business</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cashier Mobile Number</label>
                <input
                  type="tel" className="form-control"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile} onChange={(e) => setMobile(e.target.value)}
                  pattern="[0-9]{10}" required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                <i className={submitting ? 'fas fa-spinner fa-spin' : 'fas fa-plus'} /> {submitting ? 'Adding...' : 'Add Merchant'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Connected Merchants Table */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="card-title">
                <i className="fas fa-list" style={{ color: 'var(--primary)' }} />
                All Connected Merchants
              </h2>
              <p className="card-subtitle">Manage your connected payment merchants</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 20 }} /> Loading...
            </div>
          ) : merchants.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-store-slash" style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
              No merchants connected yet
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Merchant Type</th>
                  <th>Mobile Number</th>
                  <th>Added Date</th>
                  <th>Status</th>
                  <th>Verify</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td><span className="badge badge-warning">{m.type}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-phone" style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                        {m.mobile}
                      </span>
                    </td>
                    <td>{new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>
                      <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {m.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {m.verified ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          <i className="fas fa-check-circle" /> Verified
                        </span>
                      ) : (
                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                          <i className="fas fa-exclamation-circle" /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => handleDelete(m.id)}>
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <span className="pagination-info">Showing {merchants.length} merchant{merchants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}
